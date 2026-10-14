export default {
  routes: [
    {
      method: 'POST',
      path: '/clubs/:documentId/schedule-event',
      handler: 'club.scheduleEvent',
      config: { policies: [] },
    },
  ],
};
