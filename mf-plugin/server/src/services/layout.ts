import type { Core } from '@strapi/strapi';
import type { LayoutItem, GridConfig, PageLayoutData } from '../types';

const PLUGIN_ID = 'plugin::mf-plugin';

const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: 12,
  gap: '16px',
  rowHeight: '100px',
};

const layoutService = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Find all page layouts
   */
  async findAll(params?: { isPublished?: boolean }): Promise<any[]> {
    const filters: Record<string, unknown> = {};

    if (params?.isPublished !== undefined) {
      filters.isPublished = params.isPublished;
    }

    return strapi.documents(`${PLUGIN_ID}.page-layout`).findMany({
      filters,
      sort: { createdAt: 'desc' },
    });
  },

  /**
   * Find a page layout by ID
   */
  async findOne(documentId: string): Promise<any> {
    return strapi.documents(`${PLUGIN_ID}.page-layout`).findOne({
      documentId,
    });
  },

  /**
   * Find a page layout by slug
   */
  async findBySlug(slug: string): Promise<any> {
    const results = await strapi.documents(`${PLUGIN_ID}.page-layout`).findMany({
      filters: { slug },
      limit: 1,
    });

    return results[0] || null;
  },

  /**
   * Create a new page layout
   */
  async create(data: PageLayoutData): Promise<any> {
    // Generate slug if not provided
    if (!data.slug) {
      data.slug = this.generateSlug(data.name);
    }

    // Set default grid config
    if (!data.gridConfig) {
      data.gridConfig = DEFAULT_GRID_CONFIG;
    }

    // Set default layout
    if (!data.layout) {
      data.layout = { items: [] };
    }

    return strapi.documents(`${PLUGIN_ID}.page-layout`).create({
      data,
    });
  },

  /**
   * Update a page layout
   */
  async update(documentId: string, data: Partial<PageLayoutData>): Promise<any> {
    return strapi.documents(`${PLUGIN_ID}.page-layout`).update({
      documentId,
      data: data as any,
    });
  },

  /**
   * Delete a page layout
   */
  async delete(documentId: string): Promise<any> {
    return strapi.documents(`${PLUGIN_ID}.page-layout`).delete({
      documentId,
    });
  },

  /**
   * Export layout as JSON for external consumption
   */
  async exportLayout(documentId: string): Promise<Record<string, unknown>> {
    const layout = await this.findOne(documentId);

    if (!layout) {
      throw new Error('Layout not found');
    }

    // Get MF sources for each component in the layout
    const mfSourceIds = new Set<number>();
    const layoutItems = (layout.layout as { items: LayoutItem[] })?.items || [];

    layoutItems.forEach((item: LayoutItem) => {
      if (item.mfSourceId) {
        mfSourceIds.add(item.mfSourceId);
      }
    });

    // Fetch MF source details
    const mfSources = await Promise.all(
      Array.from(mfSourceIds).map((id) =>
        strapi.documents(`${PLUGIN_ID}.mf-source`).findFirst({
          filters: { id },
        })
      )
    );

    const mfSourceMap = mfSources.reduce(
      (acc, source) => {
        if (source) {
          acc[source.id] = {
            name: source.name,
            remoteEntry: source.remoteEntry,
            scope: source.scope,
          };
        }
        return acc;
      },
      {} as Record<number, { name: string; remoteEntry: string; scope: string }>
    );

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      page: {
        name: layout.name,
        slug: layout.slug,
        description: layout.description,
        metadata: layout.metadata,
      },
      grid: layout.gridConfig,
      layout: layout.layout,
      remotes: mfSourceMap,
    };
  },

  /**
   * Generate a URL-safe slug from a name
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  /**
   * Validate layout data structure
   */
  validateLayout(layout: { items: LayoutItem[] }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!layout || typeof layout !== 'object') {
      errors.push('Layout must be an object');
      return { valid: false, errors };
    }

    if (!Array.isArray(layout.items)) {
      errors.push('Layout must have an items array');
      return { valid: false, errors };
    }

    layout.items.forEach((item, index) => {
      if (!item.id) {
        errors.push(`Item at index ${index} is missing an id`);
      }
      if (!item.componentId) {
        errors.push(`Item at index ${index} is missing a componentId`);
      }
      if (!item.gridColumn) {
        errors.push(`Item at index ${index} is missing gridColumn`);
      }
      if (!item.gridRow) {
        errors.push(`Item at index ${index} is missing gridRow`);
      }
    });

    return { valid: errors.length === 0, errors };
  },
});

export default layoutService;
