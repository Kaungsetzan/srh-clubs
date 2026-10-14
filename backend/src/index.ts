import type { Core } from '@strapi/strapi';
import { VOTE_THRESHOLD } from './api/vote/services/vote';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    // Custom route: GET /api/users/me/role
    // Strapi's standard /api/users/me?populate=role strips the role field for non-admin
    // callers. Raw Koa routes bypass auth middleware (ctx.state.user is always null),
    // so we decode the JWT manually and look up the role via strapi.query.
    strapi.server.router.get('/api/users/me/role', async (ctx: any) => {
      const authHeader = ctx.request.headers.authorization ?? '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (!token) {
        ctx.status = 401;
        ctx.body = { error: 'Unauthorized' };
        return;
      }

      try {
        const jwtService = strapi.plugins['users-permissions'].services.jwt as any;
        const payload = await jwtService.verify(token);
        const userId = payload.id;

        const user = await (strapi as any).query('plugin::users-permissions.user').findOne({
          where: { id: userId },
          populate: ['role'],
        });

        if (!user) {
          ctx.status = 401;
          ctx.body = { error: 'Unauthorized' };
          return;
        }

        ctx.body = { role: user.role ?? null };
      } catch {
        ctx.status = 401;
        ctx.body = { error: 'Invalid token' };
      }
    });

    // Custom route: GET /api/ambassadors
    // Returns only username + documentId for users with the Ambassador role.
    // /api/users strips the role field for non-admin callers even with ?populate=role.
    strapi.server.router.get('/api/ambassadors', async (ctx: any) => {
      const users = await (strapi as any).query('plugin::users-permissions.user').findMany({
        where: {},
        populate: ['role'],
      });
      const ambassadors = users
        .filter((u: any) => u.role?.name === 'Ambassador')
        .map((u: any) => ({ id: u.id, documentId: u.document_id ?? u.documentId, username: u.username }));
      ctx.body = ambassadors;
    });

    // Custom route: GET /api/clubs/:documentId/my-vote
    // Returns { hasVoted: boolean } for the current user.
    // Avoids the 403 from deep-populating voter on the public club endpoint.
    strapi.server.router.get('/api/clubs/:documentId/my-vote', async (ctx: any) => {
      const authHeader = ctx.request.headers.authorization ?? '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) {
        ctx.body = { hasVoted: false };
        return;
      }

      try {
        const jwtService = strapi.plugins['users-permissions'].services.jwt as any;
        const payload = await jwtService.verify(token);

        const user = await (strapi as any).query('plugin::users-permissions.user').findOne({
          where: { id: payload.id },
        });
        if (!user) { ctx.body = { hasVoted: false }; return; }

        const votes = await strapi.documents('api::vote.vote').findMany({
          filters: {
            voter: { documentId: { $eq: user.document_id } },
            club: { documentId: { $eq: ctx.params.documentId } },
          } as any,
          status: 'published',
        });

        ctx.body = { hasVoted: votes.length > 0 };
      } catch {
        ctx.body = { hasVoted: false };
      }
    });

    // Dev-only: POST /api/dev/clubs/:documentId/seed-votes?count=N
    // Casts real votes (via the same castVote service the app uses) from
    // existing seeded users who haven't already voted for this club, so
    // demos/presentations don't need the admin panel's relation picker —
    // which silently reassigns votes between clubs instead of creating new
    // ones (Vote has no distinguishing label, so it's a data-loss trap).
    // Never available outside development.
    strapi.server.router.post('/api/dev/clubs/:documentId/seed-votes', async (ctx: any) => {
      if (process.env.NODE_ENV === 'production') {
        ctx.status = 404;
        return;
      }

      const authHeader = ctx.request.headers.authorization ?? '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) {
        ctx.status = 401;
        ctx.body = { error: 'Unauthorized' };
        return;
      }

      try {
        const jwtService = strapi.plugins['users-permissions'].services.jwt as any;
        const payload = await jwtService.verify(token);
        const caller = await (strapi as any)
          .query('plugin::users-permissions.user')
          .findOne({ where: { id: payload.id }, populate: ['role'] });

        if (!caller || caller.role?.name !== 'Ambassador') {
          ctx.status = 403;
          ctx.body = { error: 'Only Ambassadors can seed votes' };
          return;
        }

        const { documentId } = ctx.params;
        const count = Math.max(1, Math.min(Number(ctx.query.count) || VOTE_THRESHOLD, 50));

        const existingVotes = await strapi.documents('api::vote.vote').findMany({
          filters: { club: { documentId: { $eq: documentId } } } as any,
          status: 'published',
          populate: ['voter'],
        });
        const alreadyVoted = new Set(existingVotes.map((v: any) => v.voter?.documentId).filter(Boolean));

        const candidates = await (strapi as any)
          .query('plugin::users-permissions.user')
          .findMany({ where: {} });
        const eligible = candidates.filter((u: any) => !alreadyVoted.has(u.document_id ?? u.documentId));

        const toSeed = eligible.slice(0, count);
        let voteCount = existingVotes.length;
        for (const user of toSeed) {
          try {
            const result = await strapi
              .service('api::vote.vote')
              .castVote(documentId, user.document_id ?? user.documentId);
            voteCount = result.voteCount;
          } catch {
            // ALREADY_VOTED race or similar — skip, doesn't block the rest
          }
        }

        ctx.body = { seeded: toSeed.length, voteCount };
      } catch {
        ctx.status = 401;
        ctx.body = { error: 'Invalid token' };
      }
    });
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await seedNews(strapi);
    await seedEvents(strapi);
    await seedProjects(strapi);
    await ensurePermissions(strapi, 'plugin::upload.content-api.upload', ['Authenticated', 'Ambassador']);
    await ensurePermissions(strapi, 'api::club.club.reject', ['Ambassador']);
    await ensurePermissions(strapi, 'api::club.club.scheduleEvent', ['Authenticated', 'Ambassador']);
  },
};

// Custom controller actions (and the Upload plugin's content-API action) aren't
// covered by any content-type schema, so they don't exist as permissions until
// someone flips them on manually in Settings → Users & Permissions → Roles.
// Grant them here on every boot instead (idempotent — skips roles that already
// have the permission) so the app works without an admin-panel setup step.
async function ensurePermissions(strapi: Core.Strapi, action: string, roleNames: string[]) {
  const roles = await (strapi as any)
    .query('plugin::users-permissions.role')
    .findMany({ where: { name: { $in: roleNames } } });

  for (const role of roles) {
    const existing = await (strapi as any)
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action, role: role.id } });

    if (!existing) {
      await (strapi as any)
        .query('plugin::users-permissions.permission')
        .create({ data: { action, role: role.id } });
    }
  }
}

async function seedNews(strapi: Core.Strapi) {
  const existing = await strapi.documents('api::news-item.news-item').findMany({ status: 'published' });
  if (existing.length > 0) return;

  const items = [
    {
      title: 'SRH Clubs Platform Launches',
      content: 'We are excited to announce the launch of the SRH Clubs platform, where students can propose, vote on, and join new clubs at SRH University.',
      publishedDate: new Date('2025-09-01').toISOString(),
    },
    {
      title: 'First Club Reaches 10 Votes',
      content: 'The Photography Club has become the first student-proposed club to reach the 10-vote threshold, making it eligible for Ambassador approval.',
      publishedDate: new Date('2025-09-15').toISOString(),
    },
    {
      title: 'Ambassador Review Process Explained',
      content: 'Once a club reaches 10 votes it enters the eligible state. An SRH Ambassador will then review the proposal and either approve or reject it within 5 business days.',
      publishedDate: new Date('2025-10-01').toISOString(),
    },
    {
      title: 'New Semester, New Clubs',
      content: 'The winter semester brings a wave of new club proposals including a Robotics Club, a Creative Writing Circle, and a Debate Society. Cast your votes now!',
      publishedDate: new Date('2026-01-10').toISOString(),
    },
  ];

  for (const data of items) {
    await strapi.documents('api::news-item.news-item').create({ data: data as any, status: 'published' });
  }
}

async function seedEvents(strapi: Core.Strapi) {
  const existing = await strapi.documents('api::event.event').findMany({ status: 'published' });
  if (existing.length > 0) return;

  const items = [
    {
      title: 'Club Fair — Meet the Clubs',
      description: 'Browse all approved clubs, talk to founders, and sign up for the ones that interest you. Free snacks provided!',
      date: new Date('2025-10-20T14:00:00').toISOString(),
      location: 'SRH Main Hall, Building A',
    },
    {
      title: 'Voting Week Kickoff',
      description: 'The official start of the autumn voting period. Log in and vote for up to three club proposals this week.',
      date: new Date('2025-11-03T10:00:00').toISOString(),
      location: 'Online — SRH Clubs Portal',
    },
    {
      title: 'Ambassador Q&A Session',
      description: 'Have questions about the club approval process? Join our open Q&A with the SRH Ambassador team over Zoom.',
      date: new Date('2025-11-18T17:00:00').toISOString(),
      location: 'Zoom — link sent by email',
    },
    {
      title: 'Winter Club Showcase',
      description: 'Approved clubs present their first semester activities and plans for the upcoming year. Open to all students.',
      date: new Date('2026-02-14T13:00:00').toISOString(),
      location: 'SRH Auditorium, Building B',
    },
  ];

  for (const data of items) {
    await strapi.documents('api::event.event').create({ data: data as any, status: 'published' });
  }
}

async function seedProjects(strapi: Core.Strapi) {
  const existing = await strapi.documents('api::project.project').findMany({ status: 'published' });
  if (existing.length > 0) return;

  const items = [
    {
      title: 'Clubs Platform Development',
      description: 'Building the web application that lets students propose clubs, cast votes, and Ambassadors manage approvals. Stack: Strapi 5 + Next.js 15.',
      status: 'ongoing',
    },
    {
      title: 'Student Onboarding Guide',
      description: 'A written and video guide explaining how to create an account, propose a club, and navigate the voting system.',
      status: 'completed',
    },
    {
      title: 'Ambassador Dashboard',
      description: 'A dedicated view for SRH Ambassadors showing all eligible clubs, vote counts, and one-click approve/reject controls.',
      status: 'ongoing',
    },
    {
      title: 'Mobile-Responsive Redesign',
      description: 'Audit and update the frontend layout so all club management features work seamlessly on phones and tablets.',
      status: 'ongoing',
    },
  ];

  for (const data of items) {
    await strapi.documents('api::project.project').create({ data: data as any, status: 'published' });
  }
}
