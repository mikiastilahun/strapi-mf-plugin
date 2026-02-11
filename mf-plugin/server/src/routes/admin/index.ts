export default {
  type: 'admin',
  routes: [
    // MF Sources
    {
      method: 'GET',
      path: '/mf-sources',
      handler: 'mf-source.find',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/mf-sources/:id',
      handler: 'mf-source.findOne',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/mf-sources',
      handler: 'mf-source.create',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/mf-sources/:id',
      handler: 'mf-source.update',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/mf-sources/:id/refresh',
      handler: 'mf-source.refresh',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/mf-sources/:id',
      handler: 'mf-source.delete',
      config: {
        policies: [],
        auth: false,
      },
    },

    // Page Layouts
    {
      method: 'GET',
      path: '/layouts',
      handler: 'page-layout.find',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/layouts/:id',
      handler: 'page-layout.findOne',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/layouts/slug/:slug',
      handler: 'page-layout.findBySlug',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/layouts',
      handler: 'page-layout.create',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/layouts/:id',
      handler: 'page-layout.update',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/layouts/:id',
      handler: 'page-layout.delete',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/layouts/:id/export',
      handler: 'page-layout.export',
      config: {
        policies: [],
        auth: false,
      },
    },

    // Components
    {
      method: 'GET',
      path: '/components',
      handler: 'component.findAll',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/components/by-source',
      handler: 'component.findBySource',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/components/by-category',
      handler: 'component.findByCategory',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/components/search',
      handler: 'component.search',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/components/:id',
      handler: 'component.findOne',
      config: {
        policies: [],
        auth: false,
      },
    },
  ],
};
