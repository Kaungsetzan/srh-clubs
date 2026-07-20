export default {
  routes: [
    {
      method: 'POST',
      path: '/clubs/:documentId/vote',
      handler: 'club.vote',
      config: { policies: [] },
    },
  ],
};
