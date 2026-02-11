import { useState, useEffect, useCallback } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';
import type { ComponentWithSource, ComponentsBySource } from '../types';

const API_BASE = `/${PLUGIN_ID}`;

interface ApiResponse<T> {
  data: T;
}

interface UseComponentsReturn {
  components: ComponentWithSource[];
  componentsBySource: ComponentsBySource[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  search: (query: string) => Promise<ComponentWithSource[]>;
}

export function useComponents(): UseComponentsReturn {
  const { get } = useFetchClient();

  const [components, setComponents] = useState<ComponentWithSource[]>([]);
  const [componentsBySource, setComponentsBySource] = useState<ComponentsBySource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [componentsRes, bySourceRes] = await Promise.all([
        get(`${API_BASE}/components`),
        get(`${API_BASE}/components/by-source`),
      ]);
      setComponents((componentsRes.data as ApiResponse<ComponentWithSource[]>).data);
      setComponentsBySource((bySourceRes.data as ApiResponse<ComponentsBySource[]>).data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch components');
    } finally {
      setIsLoading(false);
    }
  }, [get]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        return components;
      }
      const { data } = await get(`${API_BASE}/components/search?q=${encodeURIComponent(query)}`);
      return (data as ApiResponse<ComponentWithSource[]>).data;
    },
    [get, components]
  );

  return {
    components,
    componentsBySource,
    isLoading,
    error,
    refetch,
    search,
  };
}
