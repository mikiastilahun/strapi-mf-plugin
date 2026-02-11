import type { Core } from '@strapi/strapi';

const pageLayoutController = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * List all page layouts
   */
  async find(ctx) {
    const layoutService = strapi.plugin('mf-plugin').service('layout');
    const layouts = await layoutService.findAll();

    ctx.body = { data: layouts };
  },

  /**
   * Get a single page layout
   */
  async findOne(ctx) {
    const { id } = ctx.params;
    const layoutService = strapi.plugin('mf-plugin').service('layout');
    const layout = await layoutService.findOne(id);

    if (!layout) {
      return ctx.notFound('Page layout not found');
    }

    ctx.body = { data: layout };
  },

  /**
   * Get a page layout by slug
   */
  async findBySlug(ctx) {
    const { slug } = ctx.params;
    const layoutService = strapi.plugin('mf-plugin').service('layout');
    const layout = await layoutService.findBySlug(slug);

    if (!layout) {
      return ctx.notFound('Page layout not found');
    }

    ctx.body = { data: layout };
  },

  /**
   * Create a new page layout
   */
  async create(ctx) {
    const { name, slug, description, layout, gridConfig, metadata } = ctx.request.body;

    if (!name) {
      return ctx.badRequest('Name is required');
    }

    const layoutService = strapi.plugin('mf-plugin').service('layout');

    // Validate layout if provided
    if (layout) {
      const validation = layoutService.validateLayout(layout);
      if (!validation.valid) {
        return ctx.badRequest(`Invalid layout: ${validation.errors.join(', ')}`);
      }
    }

    const pageLayout = await layoutService.create({
      name,
      slug,
      description,
      layout: layout || { items: [] },
      gridConfig: gridConfig || { columns: 12, gap: '16px', rowHeight: '100px' },
      metadata,
    });

    ctx.body = { data: pageLayout };
  },

  /**
   * Update a page layout
   */
  async update(ctx) {
    const { id } = ctx.params;
    const { name, slug, description, layout, gridConfig, metadata, isPublished } = ctx.request.body;

    const layoutService = strapi.plugin('mf-plugin').service('layout');
    const existing = await layoutService.findOne(id);

    if (!existing) {
      return ctx.notFound('Page layout not found');
    }

    // Validate layout if provided
    if (layout) {
      const validation = layoutService.validateLayout(layout);
      if (!validation.valid) {
        return ctx.badRequest(`Invalid layout: ${validation.errors.join(', ')}`);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (layout !== undefined) updateData.layout = layout;
    if (gridConfig !== undefined) updateData.gridConfig = gridConfig;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const pageLayout = await layoutService.update(id, updateData);

    ctx.body = { data: pageLayout };
  },

  /**
   * Delete a page layout
   */
  async delete(ctx) {
    const { id } = ctx.params;

    const layoutService = strapi.plugin('mf-plugin').service('layout');
    const existing = await layoutService.findOne(id);

    if (!existing) {
      return ctx.notFound('Page layout not found');
    }

    await layoutService.delete(id);

    ctx.body = { data: { success: true } };
  },

  /**
   * Export a page layout as JSON
   */
  async export(ctx) {
    const { id } = ctx.params;

    const layoutService = strapi.plugin('mf-plugin').service('layout');

    try {
      const exported = await layoutService.exportLayout(id);
      ctx.body = exported;
    } catch (error) {
      if ((error as Error).message === 'Layout not found') {
        return ctx.notFound('Page layout not found');
      }
      throw error;
    }
  },
});

export default pageLayoutController;
