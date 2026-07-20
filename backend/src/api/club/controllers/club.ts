/**
 * club controller
 */

import { factories } from '@strapi/strapi';
import { VOTE_THRESHOLD } from '../../vote/services/vote';

export default factories.createCoreController('api::club.club', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in to propose a club');

    const { name, description } = ctx.request.body?.data ?? {};
    if (!name || !description) return ctx.badRequest('name and description are required');

    // founder always comes from the JWT, never from client input, so a club
    // can't be proposed on someone else's behalf. Set via the Document
    // Service (like voter/approvedBy elsewhere) since the relation isn't
    // writable through the client-facing create body's field validation.
    const entry = await strapi.documents('api::club.club').create({
      data: { name, description, founder: user.documentId } as any,
      status: 'published',
    });

    return ctx.created({ data: entry });
  },

  async vote(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in to vote');

    const { documentId } = ctx.params;

    try {
      const { voteCount } = await strapi.service('api::vote.vote').castVote(documentId, user.documentId);
      return ctx.send({ voteCount });
    } catch (e: any) {
      if (e.message === 'ALREADY_VOTED') return ctx.badRequest('You have already voted for this club');
      throw e;
    }
  },

  async approve(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    }).then((u: any) => {
      if (u?.role?.name !== 'Ambassador') {
        ctx.forbidden('Only Ambassadors can approve clubs');
      }
    });
    if (ctx.response.status === 403) return;

    const { documentId } = ctx.params;

    const votes = await strapi.documents('api::vote.vote').findMany({
      filters: { club: { documentId: { $eq: documentId } } } as any,
      status: 'published',
    });

    if (votes.length < VOTE_THRESHOLD) {
      return ctx.badRequest(`Club needs at least ${VOTE_THRESHOLD} votes to be approved (current: ${votes.length})`);
    }

    await strapi.documents('api::club.club').update({
      documentId,
      data: {
        club_status: 'approved',
        approvedBy: user.documentId,
      } as any,
    });

    const updated = await strapi.documents('api::club.club').publish({ documentId });

    return ctx.send({ data: updated });
  },
}));
