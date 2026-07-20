/**
 * vote controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::vote.vote', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in to vote');

    const { club } = ctx.request.body?.data ?? {};
    if (!club) return ctx.badRequest('club is required');

    const clubDocumentId = typeof club === 'object' ? club.documentId ?? club.connect?.[0]?.documentId : club;
    if (!clubDocumentId) return ctx.badRequest('Invalid club value');

    try {
      const { entry } = await strapi.service('api::vote.vote').castVote(clubDocumentId, user.documentId);
      return ctx.created({ data: entry });
    } catch (e: any) {
      if (e.message === 'ALREADY_VOTED') return ctx.badRequest('You have already voted for this club');
      throw e;
    }
  },
}));
