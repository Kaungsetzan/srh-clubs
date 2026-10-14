/**
 * club controller
 */

import { factories } from '@strapi/strapi';
import { VOTE_THRESHOLD } from '../../vote/services/vote';

export default factories.createCoreController('api::club.club', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in to propose a club');

    const { name, description, email, maxMembers } = ctx.request.body?.data ?? {};
    if (!name || !description) return ctx.badRequest('name and description are required');
    if (!email) return ctx.badRequest('email is required');
    const maxMembersNum = Number(maxMembers);
    if (!maxMembers || !Number.isInteger(maxMembersNum) || maxMembersNum < 1) {
      return ctx.badRequest('maxMembers must be a positive whole number');
    }

    // founder always comes from the JWT, never from client input, so a club
    // can't be proposed on someone else's behalf. Set via the Document
    // Service (like voter/approvedBy elsewhere) since the relation isn't
    // writable through the client-facing create body's field validation.
    const entry = await strapi.documents('api::club.club').create({
      data: { name, description, email, maxMembers: maxMembersNum, founder: user.documentId } as any,
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

  async reject(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    }).then((u: any) => {
      if (u?.role?.name !== 'Ambassador') {
        ctx.forbidden('Only Ambassadors can reject clubs');
      }
    });
    if (ctx.response.status === 403) return;

    const { documentId } = ctx.params;
    const reason = (ctx.request.body?.reason as string)?.trim();
    if (!reason) return ctx.badRequest('A rejection reason is required');

    const club = await strapi.documents('api::club.club').findOne({ documentId });
    if (!club) return ctx.notFound();
    if (club.club_status === 'approved' || club.club_status === 'rejected') {
      return ctx.badRequest('This club has already been decided');
    }

    await strapi.documents('api::club.club').update({
      documentId,
      data: { club_status: 'rejected', rejectionReason: reason } as any,
    });

    const updated = await strapi.documents('api::club.club').publish({ documentId });

    return ctx.send({ data: updated });
  },

  async scheduleEvent(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const { documentId } = ctx.params;
    const club_event = (ctx.request.body?.club_event as string)?.trim();
    if (!club_event) return ctx.badRequest('Event details are required');

    const club = await strapi.documents('api::club.club').findOne({
      documentId,
      populate: ['founder'],
    });
    if (!club) return ctx.notFound();
    if ((club as any).founder?.documentId !== user.documentId) {
      return ctx.forbidden('Only the club founder can schedule its event');
    }
    if (club.club_status !== 'approved') {
      return ctx.badRequest('The club must be approved before scheduling an event');
    }

    await strapi.documents('api::club.club').update({
      documentId,
      data: { club_event } as any,
    });

    const updated = await strapi.documents('api::club.club').publish({ documentId });

    return ctx.send({ data: updated });
  },
}));
