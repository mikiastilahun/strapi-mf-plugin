import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Box, Typography, Loader } from '@strapi/design-system';
import { useLayout } from '../hooks/useLayout';
import { useComponents } from '../hooks/useComponents';
import { ComponentPalette } from '../components/builder/ComponentPalette';
import { Canvas } from '../components/builder/Canvas';
import { PropertiesPanel } from '../components/builder/PropertiesPanel';
import { PreviewFrame } from '../components/builder/PreviewFrame';
import { Toolbar } from '../components/builder/Toolbar';
import type { ComponentWithSource, DragData } from '../types';

const TOOLBAR_HEIGHT = 56;
const SIDEBAR_HEADER_HEIGHT = 40;

export function BuilderPage() {
  const { id } = useParams<{ id: string }>();
  const {
    layout,
    items,
    gridConfig,
    selectedItemIds,
    isDirty,
    isLoading: isLayoutLoading,
    isSaving,
    error: layoutError,
    canUndo,
    canRedo,
    loadLayout,
    addItem,
    updateItem,
    removeItem,
    removeSelectedItems,
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
    save,
  } = useLayout();

  const { components, isLoading: isComponentsLoading, error: componentsError } = useComponents();

  const [activeDragItem, setActiveDragItem] = useState<ComponentWithSource | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (id) {
      loadLayout(id);
    }
  }, [id, loadLayout]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Delete selected items
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItemIds.length > 0) {
          e.preventDefault();
          removeSelectedItems();
        }
      }

      // Undo: Ctrl/Cmd + Z
      if (cmdKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((cmdKey && e.shiftKey && e.key === 'z') || (cmdKey && e.key === 'y')) {
        e.preventDefault();
        redo();
      }

      // Copy: Ctrl/Cmd + C
      if (cmdKey && e.key === 'c') {
        e.preventDefault();
        copySelectedItems();
      }

      // Cut: Ctrl/Cmd + X
      if (cmdKey && e.key === 'x') {
        e.preventDefault();
        cutSelectedItems();
      }

      // Paste: Ctrl/Cmd + V
      if (cmdKey && e.key === 'v') {
        e.preventDefault();
        pasteItems();
      }

      // Duplicate: Ctrl/Cmd + D
      if (cmdKey && e.key === 'd') {
        e.preventDefault();
        duplicateSelectedItems();
      }

      // Select All: Ctrl/Cmd + A
      if (cmdKey && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }

      // Escape: Clear selection
      if (e.key === 'Escape') {
        clearSelection();
      }

      // Save: Ctrl/Cmd + S
      if (cmdKey && e.key === 's') {
        e.preventDefault();
        if (isDirty) {
          save();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedItemIds,
    isDirty,
    removeSelectedItems,
    undo,
    redo,
    copySelectedItems,
    cutSelectedItems,
    pasteItems,
    duplicateSelectedItems,
    selectAll,
    clearSelection,
    save,
  ]);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData;
    if (data?.type === 'palette' && data.component) {
      setActiveDragItem(data.component);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over) return;

    const dragData = active.data.current as DragData;

    if (dragData?.type === 'palette' && dragData.component && over.id === 'canvas') {
      const component = dragData.component;
      addItem({
        componentId: component.id,
        mfSourceId: component.sourceId,
        gridColumn: `1 / span ${gridConfig.columns}`,
        gridRow: 'auto / span 1',
        props: {},
      });
    }

    if (dragData?.type === 'canvas' && dragData.itemId) {
      selectItem(dragData.itemId);
    }
  };

  const handleExport = async () => {
    if (!layout) return;
    try {
      const response = await fetch(`/mf-plugin/layouts/${layout.documentId}/export`, {
        credentials: 'include',
      });
      const exported = await response.json();
      const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${layout.slug || layout.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Get first selected item for properties panel
  const selectedItem =
    selectedItemIds.length > 0 ? items.find((item) => item.id === selectedItemIds[0]) : undefined;
  const selectedComponent = selectedItem
    ? components.find((c) => c.id === selectedItem.componentId)
    : undefined;

  const isLoading = isLayoutLoading || isComponentsLoading;
  const error = layoutError || componentsError;

  if (isLoading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <Loader>Loading builder...</Loader>
      </div>
    );
  }

  if (error) {
    return (
      <Box padding={8}>
        <Typography textColor="danger600">{error}</Typography>
      </Box>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#f6f6f9',
          zIndex: 10,
        }}
      >
        {/* Toolbar */}
        <div style={{ height: `${TOOLBAR_HEIGHT}px`, flexShrink: 0 }}>
          <Toolbar
            layout={layout}
            gridConfig={gridConfig}
            isDirty={isDirty}
            isSaving={isSaving}
            canUndo={canUndo}
            canRedo={canRedo}
            selectedCount={selectedItemIds.length}
            onSave={save}
            onPreview={() => setIsPreviewOpen(true)}
            onExport={handleExport}
            onGridConfigChange={updateGridConfig}
            onUndo={undo}
            onRedo={redo}
            onDuplicate={duplicateSelectedItems}
            onDelete={removeSelectedItems}
          />
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Left Sidebar */}
          <div
            style={{
              width: '260px',
              minWidth: '260px',
              background: '#ffffff',
              borderRight: '1px solid #dcdce4',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                background: '#f6f6f9',
                borderBottom: '1px solid #dcdce4',
                height: `${SIDEBAR_HEADER_HEIGHT}px`,
                boxSizing: 'border-box',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#666687',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Components
              </span>
            </div>
            {/* Scrollable component list */}
            <div
              style={{
                height: `calc(100vh - ${TOOLBAR_HEIGHT}px - ${SIDEBAR_HEADER_HEIGHT}px)`,
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
            >
              <ComponentPalette />
            </div>
          </div>

          {/* Canvas */}
          <div
            style={{
              flex: 1,
              padding: '20px',
              overflow: 'auto',
              background: '#f0f0f5',
            }}
          >
            <Canvas
              items={items}
              gridConfig={gridConfig}
              selectedItemIds={selectedItemIds}
              components={components}
              onSelectItem={selectItem}
              onRemoveItem={removeItem}
              onResizeItem={updateItem}
            />
          </div>

          {/* Right Sidebar */}
          <div
            style={{
              width: '300px',
              minWidth: '300px',
              background: '#ffffff',
              borderLeft: '1px solid #dcdce4',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                background: '#f6f6f9',
                borderBottom: '1px solid #dcdce4',
                height: `${SIDEBAR_HEADER_HEIGHT}px`,
                boxSizing: 'border-box',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#666687',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Properties{' '}
                {selectedItemIds.length > 1 ? `(${selectedItemIds.length} selected)` : ''}
              </span>
            </div>
            {/* Scrollable properties list */}
            <div
              style={{
                height: `calc(100vh - ${TOOLBAR_HEIGHT}px - ${SIDEBAR_HEADER_HEIGHT}px)`,
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
            >
              <PropertiesPanel
                item={selectedItem || null}
                component={selectedComponent}
                onUpdateItem={updateItem}
                selectedCount={selectedItemIds.length}
                onBringToFront={selectedItem ? () => bringToFront(selectedItem.id) : () => {}}
                onSendToBack={selectedItem ? () => sendToBack(selectedItem.id) : () => {}}
                onBringForward={selectedItem ? () => bringForward(selectedItem.id) : () => {}}
                onSendBackward={selectedItem ? () => sendBackward(selectedItem.id) : () => {}}
              />
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragItem && (
            <Box
              background="primary100"
              padding={3}
              hasRadius
              style={{
                border: '2px solid #4945ff',
                minWidth: '180px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              }}
            >
              <Typography variant="omega" fontWeight="bold" textColor="primary700">
                {activeDragItem.displayName}
              </Typography>
            </Box>
          )}
        </DragOverlay>

        {/* Preview Modal */}
        <PreviewFrame
          items={items}
          gridConfig={gridConfig}
          components={components}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      </div>
    </DndContext>
  );
}
