import type { Core } from '@strapi/strapi';

const PLUGIN_ID = 'plugin::mf-plugin';

const mfSourceController = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * List all MF sources
   */
  async find(ctx) {
    const sources = await strapi.documents(`${PLUGIN_ID}.mf-source`).findMany({
      sort: { createdAt: 'desc' },
    });

    ctx.body = { data: sources };
  },

  /**
   * Get a single MF source
   */
  async findOne(ctx) {
    const { id } = ctx.params;

    const source = await strapi.documents(`${PLUGIN_ID}.mf-source`).findOne({
      documentId: id,
    });

    if (!source) {
      return ctx.notFound('MF Source not found');
    }

    ctx.body = { data: source };
  },

  /**
   * Create a new MF source by fetching its manifest
   */
  async create(ctx) {
    const { name, manifestUrl } = ctx.request.body;

    if (!name || !manifestUrl) {
      return ctx.badRequest('Name and manifestUrl are required');
    }

    try {
      // Fetch and parse the manifest
      const manifestService = strapi.plugin('mf-plugin').service('manifest');
      const parsed = await manifestService.fetchAndParse(manifestUrl);

      // Create the MF source
      const source = await strapi.documents(`${PLUGIN_ID}.mf-source`).create({
        data: {
          name,
          manifestUrl,
          remoteEntry: parsed.remoteEntry,
          scope: parsed.scope,
          components: parsed.components,
          metadata: parsed.metadata,
          lastFetched: new Date(),
          isActive: true,
        },
      });

      ctx.body = { data: source };
    } catch (error) {
      strapi.log.error('Error creating MF source:', error);
      return ctx.badRequest(
        `Failed to fetch manifest: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Update an MF source
   */
  async update(ctx) {
    const { id } = ctx.params;
    const { name, manifestUrl, isActive } = ctx.request.body;

    const existing = await strapi.documents(`${PLUGIN_ID}.mf-source`).findOne({
      documentId: id,
    });

    if (!existing) {
      return ctx.notFound('MF Source not found');
    }

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;

    // If manifestUrl changed, re-fetch the manifest
    if (manifestUrl && manifestUrl !== existing.manifestUrl) {
      try {
        const manifestService = strapi.plugin('mf-plugin').service('manifest');
        const parsed = await manifestService.fetchAndParse(manifestUrl);

        updateData.manifestUrl = manifestUrl;
        updateData.remoteEntry = parsed.remoteEntry;
        updateData.scope = parsed.scope;
        updateData.components = parsed.components;
        updateData.metadata = parsed.metadata;
        updateData.lastFetched = new Date();
      } catch (error) {
        return ctx.badRequest(
          `Failed to fetch manifest: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    const source = await strapi.documents(`${PLUGIN_ID}.mf-source`).update({
      documentId: id,
      data: updateData as any,
    });

    ctx.body = { data: source };
  },

  /**
   * Refresh an MF source by re-fetching its manifest
   */
  async refresh(ctx) {
    const { id } = ctx.params;

    const existing = await strapi.documents(`${PLUGIN_ID}.mf-source`).findOne({
      documentId: id,
    });

    if (!existing) {
      return ctx.notFound('MF Source not found');
    }

    try {
      const manifestService = strapi.plugin('mf-plugin').service('manifest');
      const parsed = await manifestService.fetchAndParse(existing.manifestUrl);

      const source = await strapi.documents(`${PLUGIN_ID}.mf-source`).update({
        documentId: id,
        data: {
          remoteEntry: parsed.remoteEntry,
          scope: parsed.scope,
          components: parsed.components,
          metadata: parsed.metadata,
          lastFetched: new Date(),
        } as any,
      });

      ctx.body = { data: source };
    } catch (error) {
      strapi.log.error('Error refreshing MF source:', error);
      return ctx.badRequest(
        `Failed to refresh manifest: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Delete an MF source
   */
  async delete(ctx) {
    const { id } = ctx.params;

    const existing = await strapi.documents(`${PLUGIN_ID}.mf-source`).findOne({
      documentId: id,
    });

    if (!existing) {
      return ctx.notFound('MF Source not found');
    }

    await strapi.documents(`${PLUGIN_ID}.mf-source`).delete({
      documentId: id,
    });

    ctx.body = { data: { success: true } };
  },
});

export default mfSourceController;
