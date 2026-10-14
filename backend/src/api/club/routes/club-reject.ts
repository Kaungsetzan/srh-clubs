export default {
  routes: [
    {
      method: 'POST',
      path: '/clubs/:documentId/reject',
      handler: 'club.reject',
      config: { policies: [] },
    },
  ],
};
