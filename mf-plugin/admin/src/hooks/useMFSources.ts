import { useState, useEffect, useCallback } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';
import type { MFSource } from '../types';

const API_BASE = `/${PLUGIN_ID}`;

interface UseMFSourcesReturn {
  sources: MFSource[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createSource: (data: { name: string; manifestUrl: string }) => Promise<MFSource>;
  updateSource: (
    id: string,
    data: Partial<{ name: string; manifestUrl: string; isActive: boolean }>
  ) => Promise<MFSource>;
  refreshSource: (id: string) => Promise<MFSource>;
  deleteSource: (id: string) => Promise<void>;
}

interface ApiResponse<T> {
  data: T;
}

export function useMFSources(): UseMFSourcesReturn {
  const { get, post, put, del } = useFetchClient();

  const [sources, setSources] = useState<MFSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await get(`${API_BASE}/mf-sources`);
      setSources((data as ApiResponse<MFSource[]>).data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sources');
    } finally {
      setIsLoading(false);
    }
  }, [get]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createSource = useCallback(
    async (sourceData: { name: string; manifestUrl: string }) => {
      const { data } = await post(`${API_BASE}/mf-sources`, sourceData);
      const newSource = (data as ApiResponse<MFSource>).data;
      setSources((prev) => [newSource, ...prev]);
      return newSource;
    },
    [post]
  );

  const updateSource = useCallback(
    async (
      id: string,
      sourceData: Partial<{ name: string; manifestUrl: string; isActive: boolean }>
    ) => {
      const { data } = await put(`${API_BASE}/mf-sources/${id}`, sourceData);
      const updated = (data as ApiResponse<MFSource>).data;
      setSources((prev) => prev.map((s) => (s.documentId === id ? updated : s)));
      return updated;
    },
    [put]
  );

  const refreshSource = useCallback(
    async (id: string) => {
      const { data } = await post(`${API_BASE}/mf-sources/${id}/refresh`);
      const refreshed = (data as ApiResponse<MFSource>).data;
      setSources((prev) => prev.map((s) => (s.documentId === id ? refreshed : s)));
      return refreshed;
    },
    [post]
  );

  const deleteSource = useCallback(
    async (id: string) => {
      await del(`${API_BASE}/mf-sources/${id}`);
      setSources((prev) => prev.filter((s) => s.documentId !== id));
    },
    [del]
  );

  return {
    sources,
    isLoading,
    error,
    refetch,
    createSource,
    updateSource,
    refreshSource,
    deleteSource,
  };
}
