/**
 * vote service
 */

import { factories } from '@strapi/strapi';

export const VOTE_THRESHOLD = 10;

export default factories.createCoreService('api::vote.vote', ({ strapi }) => ({
  // Single source of truth for casting a vote: duplicate check, create,
  // recount, and the eligible-status flip at VOTE_THRESHOLD. Both the
  // custom `POST /clubs/:documentId/vote` route and the default
  // `POST /votes` route must go through this so they can't drift out of
  // sync on the one-vote-per-user rule or the threshold logic.
  async castVote(clubDocumentId: string, voterDocumentId: string) {
    const existing = await strapi.documents('api::vote.vote').findMany({
      filters: {
        voter: { documentId: { $eq: voterDocumentId } },
        club: { documentId: { $eq: clubDocumentId } },
      } as any,
      status: 'published',
    });
    if (existing.length > 0) {
      throw new Error('ALREADY_VOTED');
    }

    const entry = await strapi.documents('api::vote.vote').create({
      data: { club: clubDocumentId, voter: voterDocumentId } as any,
      status: 'published',
    });

    const votes = await strapi.documents('api::vote.vote').findMany({
      filters: { club: { documentId: { $eq: clubDocumentId } } } as any,
      status: 'published',
    });

    if (votes.length >= VOTE_THRESHOLD) {
      await strapi.documents('api::club.club').update({
        documentId: clubDocumentId,
        data: { club_status: 'eligible' } as any,
      });
      await strapi.documents('api::club.club').publish({ documentId: clubDocumentId });
    }

    return { entry, voteCount: votes.length };
  },
}));
