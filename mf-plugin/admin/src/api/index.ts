import { PLUGIN_ID } from '../pluginId';
import type {
  MFSource,
  PageLayoutRecord,
  ComponentWithSource,
  ComponentsBySource,
  ApiResponse,
  PageLayout,
  GridConfig,
} from '../types';

// Admin API routes are accessed via /mf-plugin/ path
const API_BASE = `/${PLUGIN_ID}`;

// Type for the fetch client from Strapi
type FetchClient = {
  get: (url: string, config?: Record<string, unknown>) => Promise<{ data: unknown }>;
  post: (
    url: string,
    data?: unknown,
    config?: Record<string, unknown>
  ) => Promise<{ data: unknown }>;
  put: (
    url: string,
    data?: unknown,
    config?: Record<string, unknown>
  ) => Promise<{ data: unknown }>;
  del: (url: string, config?: Record<string, unknown>) => Promise<{ data: unknown }>;
};

// Create API factory that uses Strapi's fetch client
export function createMFSourcesApi(fetchClient: FetchClient) {
  return {
    async findAll(): Promise<MFSource[]> {
      const { data } = await fetchClient.get(`${API_BASE}/mf-sources`);
      return (data as ApiResponse<MFSource[]>).data;
    },

    async findOne(id: string): Promise<MFSource> {
      const { data } = await fetchClient.get(`${API_BASE}/mf-sources/${id}`);
      return (data as ApiResponse<MFSource>).data;
    },

    async create(sourceData: { name: string; manifestUrl: string }): Promise<MFSource> {
      const { data } = await fetchClient.post(`${API_BASE}/mf-sources`, sourceData);
      return (data as ApiResponse<MFSource>).data;
    },

    async update(
      id: string,
      sourceData: Partial<{ name: string; manifestUrl: string; isActive: boolean }>
    ): Promise<MFSource> {
      const { data } = await fetchClient.put(`${API_BASE}/mf-sources/${id}`, sourceData);
      return (data as ApiResponse<MFSource>).data;
    },

    async refresh(id: string): Promise<MFSource> {
      const { data } = await fetchClient.post(`${API_BASE}/mf-sources/${id}/refresh`);
      return (data as ApiResponse<MFSource>).data;
    },

    async delete(id: string): Promise<void> {
      await fetchClient.del(`${API_BASE}/mf-sources/${id}`);
    },
  };
}

// Create Layouts API factory
export function createLayoutsApi(fetchClient: FetchClient) {
  return {
    async findAll(): Promise<PageLayoutRecord[]> {
      const { data } = await fetchClient.get(`${API_BASE}/layouts`);
      return (data as ApiResponse<PageLayoutRecord[]>).data;
    },

    async findOne(id: string): Promise<PageLayoutRecord> {
      const { data } = await fetchClient.get(`${API_BASE}/layouts/${id}`);
      return (data as ApiResponse<PageLayoutRecord>).data;
    },

    async create(layoutData: {
      name: string;
      slug?: string;
      description?: string;
      layout?: PageLayout;
      gridConfig?: GridConfig;
      metadata?: Record<string, unknown>;
    }): Promise<PageLayoutRecord> {
      const { data } = await fetchClient.post(`${API_BASE}/layouts`, layoutData);
      return (data as ApiResponse<PageLayoutRecord>).data;
    },

    async update(
      id: string,
      layoutData: Partial<{
        name: string;
        slug: string;
        description: string;
        layout: PageLayout;
        gridConfig: GridConfig;
        metadata: Record<string, unknown>;
        isPublished: boolean;
      }>
    ): Promise<PageLayoutRecord> {
      const { data } = await fetchClient.put(`${API_BASE}/layouts/${id}`, layoutData);
      return (data as ApiResponse<PageLayoutRecord>).data;
    },

    async delete(id: string): Promise<void> {
      await fetchClient.del(`${API_BASE}/layouts/${id}`);
    },

    async export(id: string): Promise<Record<string, unknown>> {
      const { data } = await fetchClient.get(`${API_BASE}/layouts/${id}/export`);
      return data as Record<string, unknown>;
    },
  };
}

// Create Components API factory
export function createComponentsApi(fetchClient: FetchClient) {
  return {
    async findAll(): Promise<ComponentWithSource[]> {
      const { data } = await fetchClient.get(`${API_BASE}/components`);
      return (data as ApiResponse<ComponentWithSource[]>).data;
    },

    async findBySource(): Promise<ComponentsBySource[]> {
      const { data } = await fetchClient.get(`${API_BASE}/components/by-source`);
      return (data as ApiResponse<ComponentsBySource[]>).data;
    },

    async findByCategory(): Promise<Record<string, ComponentWithSource[]>> {
      const { data } = await fetchClient.get(`${API_BASE}/components/by-category`);
      return (data as ApiResponse<Record<string, ComponentWithSource[]>>).data;
    },

    async search(query: string): Promise<ComponentWithSource[]> {
      const { data } = await fetchClient.get(
        `${API_BASE}/components/search?q=${encodeURIComponent(query)}`
      );
      return (data as ApiResponse<ComponentWithSource[]>).data;
    },
  };
}

// Types for the API factories return values
export type MFSourcesApiType = ReturnType<typeof createMFSourcesApi>;
export type LayoutsApiType = ReturnType<typeof createLayoutsApi>;
export type ComponentsApiType = ReturnType<typeof createComponentsApi>;
