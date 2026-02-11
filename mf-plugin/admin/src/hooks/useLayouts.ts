import { useState, useEffect, useCallback } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';
import type { PageLayoutRecord, PageLayout, GridConfig } from '../types';

const API_BASE = `/${PLUGIN_ID}`;

interface ApiResponse<T> {
  data: T;
}

interface UseLayoutsReturn {
  layouts: PageLayoutRecord[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createLayout: (data: {
    name: string;
    slug?: string;
    description?: string;
    layout?: PageLayout;
    gridConfig?: GridConfig;
  }) => Promise<PageLayoutRecord>;
  updateLayout: (
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string;
      layout: PageLayout;
      gridConfig: GridConfig;
      isPublished: boolean;
    }>
  ) => Promise<PageLayoutRecord>;
  deleteLayout: (id: string) => Promise<void>;
  exportLayout: (id: string) => Promise<Record<string, unknown>>;
}

export function useLayouts(): UseLayoutsReturn {
  const { get, post, put, del } = useFetchClient();

  const [layouts, setLayouts] = useState<PageLayoutRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await get(`${API_BASE}/layouts`);
      setLayouts((data as ApiResponse<PageLayoutRecord[]>).data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch layouts');
    } finally {
      setIsLoading(false);
    }
  }, [get]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createLayout = useCallback(
    async (layoutData: {
      name: string;
      slug?: string;
      description?: string;
      layout?: PageLayout;
      gridConfig?: GridConfig;
    }) => {
      const { data } = await post(`${API_BASE}/layouts`, layoutData);
      const newLayout = (data as ApiResponse<PageLayoutRecord>).data;
      setLayouts((prev) => [newLayout, ...prev]);
      return newLayout;
    },
    [post]
  );

  const updateLayout = useCallback(
    async (
      id: string,
      layoutData: Partial<{
        name: string;
        slug: string;
        description: string;
        layout: PageLayout;
        gridConfig: GridConfig;
        isPublished: boolean;
      }>
    ) => {
      const { data } = await put(`${API_BASE}/layouts/${id}`, layoutData);
      const updated = (data as ApiResponse<PageLayoutRecord>).data;
      setLayouts((prev) => prev.map((l) => (l.documentId === id ? updated : l)));
      return updated;
    },
    [put]
  );

  const deleteLayout = useCallback(
    async (id: string) => {
      await del(`${API_BASE}/layouts/${id}`);
      setLayouts((prev) => prev.filter((l) => l.documentId !== id));
    },
    [del]
  );

  const exportLayout = useCallback(
    async (id: string) => {
      const { data } = await get(`${API_BASE}/layouts/${id}/export`);
      return data as Record<string, unknown>;
    },
    [get]
  );

  return {
    layouts,
    isLoading,
    error,
    refetch,
    createLayout,
    updateLayout,
    deleteLayout,
    exportLayout,
  };
}
