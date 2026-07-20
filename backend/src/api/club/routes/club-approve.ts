export default {
  routes: [
    {
      method: 'POST',
      path: '/clubs/:documentId/approve',
      handler: 'club.approve',
      config: { policies: [] },
    },
  ],
};
