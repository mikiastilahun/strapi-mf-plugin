import { useState, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Box, Flex, Typography, IconButton } from '@strapi/design-system';
import { Trash, Drag } from '@strapi/icons';
import type { LayoutItem, ComponentWithSource } from '../../types';

interface GridItemProps {
  item: LayoutItem;
  component: ComponentWithSource | undefined;
  isSelected: boolean;
  gridColumns: number;
  onSelect: (addToSelection?: boolean) => void;
  onRemove: () => void;
  onResize: (id: string, updates: Partial<LayoutItem>) => void;
}

// Parse grid column/row value like "1 / span 6" or "1 / 7"
function parseGridValue(value: string): { start: number; span: number } {
  const parts = value.split('/').map((p) => p.trim());
  const start = parseInt(parts[0]) || 1;

  if (parts[1]?.startsWith('span')) {
    const span = parseInt(parts[1].replace('span', '').trim()) || 1;
    return { start, span };
  } else if (parts[1]) {
    const end = parseInt(parts[1]) || start + 1;
    return { start, span: end - start };
  }

  return { start, span: 1 };
}

export function GridItem({
  item,
  component,
  isSelected,
  gridColumns,
  onSelect,
  onRemove,
  onResize,
}: GridItemProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; span: number } | null>(
    null
  );

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `canvas-${item.id}`,
    data: {
      type: 'canvas',
      itemId: item.id,
    },
  });

  const currentColumn = parseGridValue(item.gridColumn);
  const currentRow = parseGridValue(item.gridRow);

  // Handle resize drag
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, direction: 'horizontal' | 'vertical' | 'both') => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        span: direction === 'vertical' ? currentRow.span : currentColumn.span,
      });

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - e.clientX;
        const deltaY = moveEvent.clientY - e.clientY;
        const cellWidth = 80; // Approximate cell width in pixels
        const cellHeight = 100; // Approximate cell height in pixels

        if (direction === 'horizontal' || direction === 'both') {
          const spanDelta = Math.round(deltaX / cellWidth);
          const newSpan = Math.max(
            1,
            Math.min(gridColumns - currentColumn.start + 1, currentColumn.span + spanDelta)
          );
          onResize(item.id, { gridColumn: `${currentColumn.start} / span ${newSpan}` });
        }

        if (direction === 'vertical' || direction === 'both') {
          const spanDelta = Math.round(deltaY / cellHeight);
          const newSpan = Math.max(1, currentRow.span + spanDelta);
          onResize(item.id, { gridRow: `${currentRow.start} / span ${newSpan}` });
        }
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        setResizeStart(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [item.id, currentColumn, currentRow, gridColumns, onResize]
  );

  const style: React.CSSProperties = {
    gridColumn: item.gridColumn,
    gridRow: item.gridRow,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1000 : isSelected ? 10 : 1,
    background: isSelected ? '#f0f0ff' : '#ffffff',
    border: `2px solid ${isSelected ? '#4945ff' : '#e0e0e6'}`,
    borderRadius: '8px',
    padding: '16px',
    position: 'relative',
    cursor: 'pointer',
    boxShadow: isSelected
      ? '0 4px 14px rgba(73, 69, 255, 0.15)'
      : '0 1px 4px rgba(33, 33, 52, 0.1)',
    transition: isResizing ? 'none' : 'box-shadow 0.15s ease, border-color 0.15s ease',
    minHeight: '80px',
  };

  const resizeHandleBase: React.CSSProperties = {
    position: 'absolute',
    background: isSelected ? '#4945ff' : 'transparent',
    opacity: isSelected ? 1 : 0,
    transition: 'opacity 0.15s ease',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        // Pass true if Shift or Cmd/Ctrl is held for multi-select
        onSelect(e.shiftKey || e.metaKey || e.ctrlKey);
      }}
    >
      {/* Drag Handle */}
      <Box
        {...listeners}
        {...attributes}
        style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          cursor: 'grab',
          padding: '4px 6px',
          background: isSelected ? '#e0e0ff' : '#f0f0f5',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Drag width={12} height={12} fill={isSelected ? '#4945ff' : '#666687'} />
      </Box>

      {/* Size indicator */}
      {isSelected && (
        <Box
          style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '2px 8px',
            background: '#4945ff',
            borderRadius: '4px',
            fontSize: '10px',
            color: 'white',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {currentColumn.span} x {currentRow.span}
        </Box>
      )}

      {/* Remove Button */}
      <Box style={{ position: 'absolute', top: '6px', right: '6px' }}>
        <IconButton
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onRemove();
          }}
          label="Remove"
          variant="ghost"
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            width: '28px',
            height: '28px',
          }}
        >
          <Trash width={14} height={14} fill="#d02b20" />
        </IconButton>
      </Box>

      {/* Resize handle - Right edge (horizontal) */}
      <div
        style={{
          ...resizeHandleBase,
          right: '-4px',
          top: '20%',
          bottom: '20%',
          width: '8px',
          cursor: 'ew-resize',
          borderRadius: '4px',
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'horizontal')}
      />

      {/* Resize handle - Bottom edge (vertical) */}
      <div
        style={{
          ...resizeHandleBase,
          bottom: '-4px',
          left: '20%',
          right: '20%',
          height: '8px',
          cursor: 'ns-resize',
          borderRadius: '4px',
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'vertical')}
      />

      {/* Resize handle - Corner (both) */}
      <div
        style={{
          ...resizeHandleBase,
          right: '-4px',
          bottom: '-4px',
          width: '12px',
          height: '12px',
          cursor: 'nwse-resize',
          borderRadius: '4px',
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'both')}
      />

      {/* Content */}
      <Flex
        direction="column"
        alignItems="center"
        justifyContent="center"
        style={{ height: '100%', paddingTop: '20px' }}
      >
        <Typography
          variant="omega"
          fontWeight="bold"
          textColor={isSelected ? 'primary700' : 'neutral800'}
          style={{ textAlign: 'center' }}
        >
          {component?.displayName || 'Unknown Component'}
        </Typography>
        {component && (
          <Box marginTop={1}>
            <Typography variant="pi" textColor="neutral500">
              {component.sourceName}
            </Typography>
          </Box>
        )}
      </Flex>
    </div>
  );
}
