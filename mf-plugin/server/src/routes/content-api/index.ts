export default {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/',
      handler: 'controller.index',
      config: {
        policies: [],
      },
    },
    // Public layout endpoint for frontend consumption
    {
      method: 'GET',
      path: '/layouts/:slug',
      handler: 'page-layout.findBySlug',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/layouts/:id/export',
      handler: 'page-layout.export',
      config: {
        policies: [],
      },
    },
  ],
};
