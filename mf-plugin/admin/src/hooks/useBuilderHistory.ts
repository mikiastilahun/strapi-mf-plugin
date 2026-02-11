import { useState, useCallback, useRef } from 'react';
import type { LayoutItem, GridConfig } from '../types';

interface HistoryState {
  items: LayoutItem[];
  gridConfig: GridConfig;
}

interface UseBuilderHistoryReturn {
  // History state
  canUndo: boolean;
  canRedo: boolean;
  historyIndex: number;
  historyLength: number;

  // History actions
  pushState: (state: HistoryState) => void;
  undo: () => HistoryState | null;
  redo: () => HistoryState | null;
  reset: (initialState: HistoryState) => void;
}

const MAX_HISTORY_SIZE = 50;

export function useBuilderHistory(initialState?: HistoryState): UseBuilderHistoryReturn {
  const [history, setHistory] = useState<HistoryState[]>(initialState ? [initialState] : []);
  const [currentIndex, setCurrentIndex] = useState(initialState ? 0 : -1);

  // Debounce timer for batching rapid changes
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingState = useRef<HistoryState | null>(null);

  const pushState = useCallback(
    (state: HistoryState) => {
      // Clear any pending debounced push
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      pendingState.current = state;

      // Debounce rapid changes (like dragging)
      debounceTimer.current = setTimeout(() => {
        if (!pendingState.current) return;

        const newState = pendingState.current;
        pendingState.current = null;

        setHistory((prev) => {
          // Remove any redo states (everything after current index)
          const newHistory = prev.slice(0, currentIndex + 1);

          // Don't push if state is identical to current
          const current = newHistory[newHistory.length - 1];
          if (current && JSON.stringify(current) === JSON.stringify(newState)) {
            return prev;
          }

          // Add new state
          newHistory.push(newState);

          // Limit history size
          if (newHistory.length > MAX_HISTORY_SIZE) {
            newHistory.shift();
          }

          return newHistory;
        });

        setCurrentIndex((prev) => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
      }, 300);
    },
    [currentIndex]
  );

  const undo = useCallback((): HistoryState | null => {
    if (currentIndex <= 0) return null;

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return history[newIndex] || null;
  }, [currentIndex, history]);

  const redo = useCallback((): HistoryState | null => {
    if (currentIndex >= history.length - 1) return null;

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return history[newIndex] || null;
  }, [currentIndex, history]);

  const reset = useCallback((initialState: HistoryState) => {
    setHistory([initialState]);
    setCurrentIndex(0);
  }, []);

  return {
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    historyIndex: currentIndex,
    historyLength: history.length,
    pushState,
    undo,
    redo,
    reset,
  };
}
