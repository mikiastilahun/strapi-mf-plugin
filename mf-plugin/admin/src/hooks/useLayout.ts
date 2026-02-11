import { useState, useCallback, useEffect, useRef } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';
import type { PageLayoutRecord, PageLayout, GridConfig, LayoutItem } from '../types';

const API_BASE = `/${PLUGIN_ID}`;

interface ApiResponse<T> {
  data: T;
}

interface HistoryState {
  items: LayoutItem[];
  gridConfig: GridConfig;
}

interface UseLayoutReturn {
  layout: PageLayoutRecord | null;
  items: LayoutItem[];
  gridConfig: GridConfig;
  selectedItemIds: string[];
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // History
  canUndo: boolean;
  canRedo: boolean;

  // Clipboard
  clipboardItems: LayoutItem[];

  // Layout operations
  loadLayout: (id: string) => Promise<void>;
  createNewLayout: (name: string) => Promise<PageLayoutRecord>;
  save: () => Promise<void>;
  reset: () => void;

  // Item operations
  addItem: (item: Omit<LayoutItem, 'id'>) => void;
  updateItem: (id: string, updates: Partial<LayoutItem>) => void;
  removeItem: (id: string) => void;
  removeSelectedItems: () => void;
  moveItem: (id: string, gridColumn: string, gridRow: string) => void;

  // Selection
  selectItem: (id: string | null, addToSelection?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Clipboard operations
  copySelectedItems: () => void;
  cutSelectedItems: () => void;
  pasteItems: () => void;
  duplicateSelectedItems: () => void;

  // History operations
  undo: () => void;
  redo: () => void;

  // Grid config
  updateGridConfig: (config: Partial<GridConfig>) => void;

  // Layer ordering
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
}

const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: 12,
  gap: '16px',
  rowHeight: '100px',
};

const MAX_HISTORY_SIZE = 50;

export function useLayout(): UseLayoutReturn {
  const { get, post, put } = useFetchClient();

  const [layout, setLayout] = useState<PageLayoutRecord | null>(null);
  const [items, setItems] = useState<LayoutItem[]>([]);
  const [gridConfig, setGridConfig] = useState<GridConfig>(DEFAULT_GRID_CONFIG);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoing = useRef(false);

  // Clipboard state
  const [clipboardItems, setClipboardItems] = useState<LayoutItem[]>([]);

  const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Push state to history
  const pushToHistory = useCallback(
    (newItems: LayoutItem[], newGridConfig: GridConfig) => {
      if (isUndoRedoing.current) return;

      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push({
          items: JSON.parse(JSON.stringify(newItems)),
          gridConfig: { ...newGridConfig },
        });

        if (newHistory.length > MAX_HISTORY_SIZE) {
          newHistory.shift();
          return newHistory;
        }
        return newHistory;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
    },
    [historyIndex]
  );

  const loadLayout = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const { data } = await get(`${API_BASE}/layouts/${id}`);
        const layoutData = (data as ApiResponse<PageLayoutRecord>).data;
        setLayout(layoutData);
        const loadedItems = layoutData.layout?.items || [];
        const loadedGridConfig = layoutData.gridConfig || DEFAULT_GRID_CONFIG;
        setItems(loadedItems);
        setGridConfig(loadedGridConfig);
        setIsDirty(false);
        setSelectedItemIds([]);
        // Initialize history
        setHistory([
          { items: JSON.parse(JSON.stringify(loadedItems)), gridConfig: { ...loadedGridConfig } },
        ]);
        setHistoryIndex(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load layout');
      } finally {
        setIsLoading(false);
      }
    },
    [get]
  );

  const createNewLayout = useCallback(
    async (name: string) => {
      const { data } = await post(`${API_BASE}/layouts`, {
        name,
        layout: { items: [] },
        gridConfig: DEFAULT_GRID_CONFIG,
      });
      const newLayout = (data as ApiResponse<PageLayoutRecord>).data;
      setLayout(newLayout);
      setItems([]);
      setGridConfig(DEFAULT_GRID_CONFIG);
      setIsDirty(false);
      setSelectedItemIds([]);
      setHistory([{ items: [], gridConfig: DEFAULT_GRID_CONFIG }]);
      setHistoryIndex(0);
      return newLayout;
    },
    [post]
  );

  const addItem = useCallback(
    (item: Omit<LayoutItem, 'id'>) => {
      const newItem: LayoutItem = {
        ...item,
        id: generateId(),
      };
      setItems((prev) => {
        const newItems = [...prev, newItem];
        pushToHistory(newItems, gridConfig);
        return newItems;
      });
      setIsDirty(true);
      setSelectedItemIds([newItem.id]);
    },
    [gridConfig, pushToHistory]
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<LayoutItem>) => {
      setItems((prev) => {
        const newItems = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
        pushToHistory(newItems, gridConfig);
        return newItems;
      });
      setIsDirty(true);
    },
    [gridConfig, pushToHistory]
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const newItems = prev.filter((item) => item.id !== id);
        pushToHistory(newItems, gridConfig);
        return newItems;
      });
      setIsDirty(true);
      setSelectedItemIds((prev) => prev.filter((selectedId) => selectedId !== id));
    },
    [gridConfig, pushToHistory]
  );

  const removeSelectedItems = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    setItems((prev) => {
      const newItems = prev.filter((item) => !selectedItemIds.includes(item.id));
      pushToHistory(newItems, gridConfig);
      return newItems;
    });
    setIsDirty(true);
    setSelectedItemIds([]);
  }, [selectedItemIds, gridConfig, pushToHistory]);

  const moveItem = useCallback(
    (id: string, gridColumn: string, gridRow: string) => {
      setItems((prev) => {
        const newItems = prev.map((item) =>
          item.id === id ? { ...item, gridColumn, gridRow } : item
        );
        pushToHistory(newItems, gridConfig);
        return newItems;
      });
      setIsDirty(true);
    },
    [gridConfig, pushToHistory]
  );

  // Selection
  const selectItem = useCallback((id: string | null, addToSelection = false) => {
    if (id === null) {
      setSelectedItemIds([]);
    } else if (addToSelection) {
      setSelectedItemIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setSelectedItemIds([id]);
    }
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItemIds(items.map((item) => item.id));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedItemIds([]);
  }, []);

  // Clipboard operations
  const copySelectedItems = useCallback(() => {
    const selectedItems = items.filter((item) => selectedItemIds.includes(item.id));
    setClipboardItems(JSON.parse(JSON.stringify(selectedItems)));
  }, [items, selectedItemIds]);

  const cutSelectedItems = useCallback(() => {
    copySelectedItems();
    removeSelectedItems();
  }, [copySelectedItems, removeSelectedItems]);

  const pasteItems = useCallback(() => {
    if (clipboardItems.length === 0) return;

    const newItems = clipboardItems.map((item) => ({
      ...item,
      id: generateId(),
      // Offset pasted items slightly
      gridColumn: item.gridColumn,
      gridRow: 'auto / span 1',
    }));

    setItems((prev) => {
      const updated = [...prev, ...newItems];
      pushToHistory(updated, gridConfig);
      return updated;
    });
    setIsDirty(true);
    setSelectedItemIds(newItems.map((item) => item.id));
  }, [clipboardItems, gridConfig, pushToHistory]);

  const duplicateSelectedItems = useCallback(() => {
    const selectedItems = items.filter((item) => selectedItemIds.includes(item.id));
    if (selectedItems.length === 0) return;

    const newItems = selectedItems.map((item) => ({
      ...item,
      id: generateId(),
      gridRow: 'auto / span 1',
    }));

    setItems((prev) => {
      const updated = [...prev, ...newItems];
      pushToHistory(updated, gridConfig);
      return updated;
    });
    setIsDirty(true);
    setSelectedItemIds(newItems.map((item) => item.id));
  }, [items, selectedItemIds, gridConfig, pushToHistory]);

  // History operations
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;

    isUndoRedoing.current = true;
    const newIndex = historyIndex - 1;
    const state = history[newIndex];

    if (state) {
      setItems(JSON.parse(JSON.stringify(state.items)));
      setGridConfig({ ...state.gridConfig });
      setHistoryIndex(newIndex);
      setIsDirty(true);
    }

    setTimeout(() => {
      isUndoRedoing.current = false;
    }, 0);
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    isUndoRedoing.current = true;
    const newIndex = historyIndex + 1;
    const state = history[newIndex];

    if (state) {
      setItems(JSON.parse(JSON.stringify(state.items)));
      setGridConfig({ ...state.gridConfig });
      setHistoryIndex(newIndex);
      setIsDirty(true);
    }

    setTimeout(() => {
      isUndoRedoing.current = false;
    }, 0);
  }, [historyIndex, history]);

  const updateGridConfig = useCallback(
    (config: Partial<GridConfig>) => {
      setGridConfig((prev) => {
        const newConfig = { ...prev, ...config };
        pushToHistory(items, newConfig);
        return newConfig;
      });
      setIsDirty(true);
    },
    [items, pushToHistory]
  );

  // Layer ordering
  const bringToFront = useCallback(
    (id: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.id === id);
        if (!item) return prev;
        const newItems = [...prev.filter((i) => i.id !== id), item];
        pushToHistory(newItems, gridConfig);
        return newItems;
      });
      setIsDirty(true);
    },
    [gridConfig, pushToHistory]
  );

  const sendToBack = useCallback(
    (id: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.id === id);
        if (!item) return prev;
        const newItems = [item, ...prev.filter((i) => i.id !== id)];
        pushToHistory(newItems, gridConfig);
        return newItems;
      });
      setIsDirty(true);
    },
    [gridConfig, pushToHistory]
  );

  const bringForward = useCallback(
    (id: string) => {
      setItems((prev) => {
        const index = prev.findIndex((i) => i.id === id);
        if (index === -1 || index === prev.length - 1) return prev;
        const newItems = [...prev];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        pushToHistory(newItems, gridConfig);
        return newItems;
      });
      setIsDirty(true);
    },
    [gridConfig, pushToHistory]
  );

  const sendBackward = useCallback(
    (id: string) => {
      setItems((prev) => {
        const index = prev.findIndex((i) => i.id === id);
        if (index <= 0) return prev;
        const newItems = [...prev];
        [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
        pushToHistory(newItems, gridConfig);
        return newItems;
      });
      setIsDirty(true);
    },
    [gridConfig, pushToHistory]
  );

  const save = useCallback(async () => {
    if (!layout) return;

    try {
      setIsSaving(true);
      setError(null);
      const pageLayout: PageLayout = { items };
      const { data } = await put(`${API_BASE}/layouts/${layout.documentId}`, {
        layout: pageLayout,
        gridConfig,
      });
      const updated = (data as ApiResponse<PageLayoutRecord>).data;
      setLayout(updated);
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save layout');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [put, layout, items, gridConfig]);

  const reset = useCallback(() => {
    if (layout) {
      const resetItems = layout.layout?.items || [];
      const resetGridConfig = layout.gridConfig || DEFAULT_GRID_CONFIG;
      setItems(resetItems);
      setGridConfig(resetGridConfig);
      setIsDirty(false);
      setSelectedItemIds([]);
      setHistory([
        { items: JSON.parse(JSON.stringify(resetItems)), gridConfig: { ...resetGridConfig } },
      ]);
      setHistoryIndex(0);
    }
  }, [layout]);

  return {
    layout,
    items,
    gridConfig,
    selectedItemIds,
    isDirty,
    isLoading,
    isSaving,
    error,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    clipboardItems,
    loadLayout,
    createNewLayout,
    save,
    reset,
    addItem,
    updateItem,
    removeItem,
    removeSelectedItems,
    moveItem,
    selectItem,
    selectAll,
    clearSelection,
    copySelectedItems,
    cutSelectedItems,
    pasteItems,
    duplicateSelectedItems,
    undo,
    redo,
    updateGridConfig,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
  };
}
