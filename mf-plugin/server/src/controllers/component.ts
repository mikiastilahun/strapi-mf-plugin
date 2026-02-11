import type { Core } from '@strapi/strapi';

const componentController = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Get all available components from all active MF sources
   */
  async findAll(ctx) {
    const componentRegistry = strapi.plugin('mf-plugin').service('component-registry');
    const components = await componentRegistry.getAllComponents();

    ctx.body = { data: components };
  },

  /**
   * Get components grouped by MF source
   */
  async findBySource(ctx) {
    const componentRegistry = strapi.plugin('mf-plugin').service('component-registry');
    const grouped = await componentRegistry.getComponentsBySource();

    ctx.body = { data: grouped };
  },

  /**
   * Get components grouped by category
   */
  async findByCategory(ctx) {
    const componentRegistry = strapi.plugin('mf-plugin').service('component-registry');
    const grouped = await componentRegistry.getComponentsByCategory();

    ctx.body = { data: grouped };
  },

  /**
   * Search components
   */
  async search(ctx) {
    const { q } = ctx.query;

    if (!q || typeof q !== 'string') {
      return ctx.badRequest('Query parameter "q" is required');
    }

    const componentRegistry = strapi.plugin('mf-plugin').service('component-registry');
    const components = await componentRegistry.searchComponents(q);

    ctx.body = { data: components };
  },

  /**
   * Get a specific component by ID
   */
  async findOne(ctx) {
    const { id } = ctx.params;

    const componentRegistry = strapi.plugin('mf-plugin').service('component-registry');
    const component = await componentRegistry.findComponent(id);

    if (!component) {
      return ctx.notFound('Component not found');
    }

    ctx.body = { data: component };
  },
});

export default componentController;
