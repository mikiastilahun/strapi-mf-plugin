import { useDroppable } from '@dnd-kit/core';
import { Box, Typography } from '@strapi/design-system';
import { PuzzlePiece } from '@strapi/icons';
import { GridItem } from './GridItem';
import type { LayoutItem, GridConfig, ComponentWithSource } from '../../types';

interface CanvasProps {
  items: LayoutItem[];
  gridConfig: GridConfig;
  selectedItemIds: string[];
  components: ComponentWithSource[];
  onSelectItem: (id: string | null, addToSelection?: boolean) => void;
  onRemoveItem: (id: string) => void;
  onResizeItem: (id: string, updates: Partial<LayoutItem>) => void;
}

export function Canvas({
  items,
  gridConfig,
  selectedItemIds,
  components,
  onSelectItem,
  onRemoveItem,
  onResizeItem,
}: CanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  });

  const componentMap = new Map(components.map((c) => [c.id, c]));

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)`,
    gap: gridConfig.gap,
    minHeight: '500px',
    gridAutoRows: gridConfig.rowHeight,
    background: isOver ? 'rgba(73, 69, 255, 0.03)' : '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    border: `2px dashed ${isOver ? '#4945ff' : '#dcdce4'}`,
    position: 'relative',
    boxShadow: '0 1px 4px rgba(33, 33, 52, 0.1)',
    transition: 'background 0.15s ease, border-color 0.15s ease',
  };

  return (
    <div ref={setNodeRef} style={gridStyle} onClick={() => onSelectItem(null)}>
      {items.length === 0 && (
        <Box
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <Box
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              background: isOver ? 'rgba(73, 69, 255, 0.1)' : '#f0f0f5',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PuzzlePiece width={32} height={32} fill={isOver ? '#4945ff' : '#a5a5ba'} />
          </Box>
          <Typography variant="delta" textColor={isOver ? 'primary600' : 'neutral500'}>
            {isOver ? 'Drop here' : 'Drag components here'}
          </Typography>
          <Box marginTop={1}>
            <Typography variant="pi" textColor="neutral400">
              Build your layout by dragging components from the left panel
            </Typography>
          </Box>
        </Box>
      )}

      {items.map((item) => (
        <GridItem
          key={item.id}
          item={item}
          component={componentMap.get(item.componentId)}
          isSelected={selectedItemIds.includes(item.id)}
          gridColumns={gridConfig.columns}
          onSelect={(addToSelection?: boolean) => onSelectItem(item.id, addToSelection)}
          onRemove={() => onRemoveItem(item.id)}
          onResize={onResizeItem}
        />
      ))}

      {/* Grid overlay for visual guidance when dragging */}
      {isOver && items.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)`,
            gap: gridConfig.gap,
            padding: '20px',
            pointerEvents: 'none',
          }}
        >
          {Array.from({ length: gridConfig.columns }).map((_, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(73, 69, 255, 0.04)',
                borderRadius: '4px',
                border: '1px dashed rgba(73, 69, 255, 0.15)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
