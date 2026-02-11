import type { Core } from '@strapi/strapi';
import type { ParsedComponent, ComponentWithSource, MFSource } from '../types';

const PLUGIN_ID = 'plugin::mf-plugin';

const componentRegistryService = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Get all components from all active MF sources
   */
  async getAllComponents(): Promise<ComponentWithSource[]> {
    const sources = (await strapi.documents(`${PLUGIN_ID}.mf-source`).findMany({
      filters: { isActive: true },
    })) as any[];

    const allComponents: ComponentWithSource[] = [];

    sources.forEach((source: any) => {
      const components = (source.components as ParsedComponent[]) || [];

      components.forEach((component) => {
        allComponents.push({
          ...component,
          sourceId: source.id,
          sourceDocumentId: source.documentId,
          sourceName: source.name,
          remoteEntry: source.remoteEntry,
          scope: source.scope,
        });
      });
    });

    return allComponents;
  },

  /**
   * Get components grouped by category
   */
  async getComponentsByCategory(): Promise<Record<string, ComponentWithSource[]>> {
    const components = await this.getAllComponents();

    return components.reduce(
      (acc, component) => {
        const category = component.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(component);
        return acc;
      },
      {} as Record<string, ComponentWithSource[]>
    );
  },

  /**
   * Get components grouped by MF source
   */
  async getComponentsBySource(): Promise<
    Array<{
      sourceId: number;
      sourceDocumentId: string;
      sourceName: string;
      remoteEntry: string | null;
      scope: string | null;
      components: ParsedComponent[];
    }>
  > {
    const sources = (await strapi.documents(`${PLUGIN_ID}.mf-source`).findMany({
      filters: { isActive: true },
    })) as any[];

    return sources.map((source: any) => ({
      sourceId: source.id,
      sourceDocumentId: source.documentId,
      sourceName: source.name,
      remoteEntry: source.remoteEntry,
      scope: source.scope,
      components: (source.components as ParsedComponent[]) || [],
    }));
  },

  /**
   * Find a specific component by its ID
   */
  async findComponent(componentId: string): Promise<ComponentWithSource | null> {
    const components = await this.getAllComponents();
    return components.find((c) => c.id === componentId) || null;
  },

  /**
   * Search components by name or description
   */
  async searchComponents(query: string): Promise<ComponentWithSource[]> {
    const components = await this.getAllComponents();
    const lowerQuery = query.toLowerCase();

    return components.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.displayName.toLowerCase().includes(lowerQuery) ||
        c.description.toLowerCase().includes(lowerQuery)
    );
  },
});

export default componentRegistryService;
