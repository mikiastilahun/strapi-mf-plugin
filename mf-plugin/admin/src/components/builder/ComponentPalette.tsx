import { useState, useEffect, useRef, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { TextInput, Loader } from '@strapi/design-system';
import { Search, PuzzlePiece, ChevronDown, ChevronRight } from '@strapi/icons';
import { useComponents } from '../../hooks/useComponents';
import type { ComponentWithSource, ComponentsBySource } from '../../types';

interface DraggableComponentProps {
  component: ComponentWithSource;
}

function DraggableComponent({ component }: DraggableComponentProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${component.id}`,
    data: {
      type: 'palette',
      component,
    },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        padding: '8px 10px',
        marginBottom: '4px',
        background: '#ffffff',
        borderRadius: '4px',
        border: '1px solid #e0e0e6',
      }}
      {...listeners}
      {...attributes}
    >
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div
          style={{
            width: '24px',
            height: '24px',
            minWidth: '24px',
            background: '#f0f0ff',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PuzzlePiece width={12} height={12} fill="#4945ff" />
        </div>
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#32324d',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {component.displayName}
          </div>
          {component.description && (
            <div
              style={{
                fontSize: '11px',
                color: '#8e8ea9',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {component.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ComponentGroupProps {
  source: ComponentsBySource;
  searchQuery: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function ComponentGroup({ source, searchQuery, isExpanded, onToggle }: ComponentGroupProps) {
  const filteredComponents = source.components.filter(
    (c) =>
      !searchQuery ||
      c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredComponents.length === 0) return null;

  return (
    <div style={{ marginBottom: '4px' }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          background: '#f6f6f9',
          borderRadius: '4px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isExpanded ? (
            <ChevronDown width={12} height={12} fill="#666687" />
          ) : (
            <ChevronRight width={12} height={12} fill="#666687" />
          )}
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#32324d' }}>
            {source.sourceName}
          </span>
        </div>
        <span
          style={{
            fontSize: '11px',
            padding: '2px 6px',
            background: '#dcdce4',
            borderRadius: '10px',
            color: '#666687',
          }}
        >
          {filteredComponents.length}
        </span>
      </div>

      {isExpanded && (
        <div style={{ padding: '8px 0 0 0' }}>
          {filteredComponents.map((component) => (
            <DraggableComponent
              key={component.id}
              component={{
                ...component,
                sourceId: source.sourceId,
                sourceDocumentId: source.sourceDocumentId,
                sourceName: source.sourceName,
                remoteEntry: source.remoteEntry,
                scope: source.scope,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ComponentPalette() {
  const { componentsBySource, isLoading, error } = useComponents();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  // Refs and state for dynamic height calculation - must be before any early returns
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [listMaxHeight, setListMaxHeight] = useState<number | undefined>(undefined);

  const recalcHeight = useCallback(() => {
    if (containerRef.current) {
      const containerTop = containerRef.current.getBoundingClientRect().top;
      const searchHeight = searchRef.current?.getBoundingClientRect().height ?? 0;
      // Available = viewport bottom minus container top minus search bar height minus small buffer
      const available = window.innerHeight - containerTop - searchHeight - 4;
      setListMaxHeight(Math.max(available, 200));
    }
  }, []);

  // Auto-expand all sources on load
  useEffect(() => {
    if (componentsBySource.length > 0 && expandedSources.size === 0) {
      setExpandedSources(new Set(componentsBySource.map((s) => s.sourceDocumentId)));
    }
  }, [componentsBySource]);

  useEffect(() => {
    recalcHeight();
    window.addEventListener('resize', recalcHeight);
    return () => window.removeEventListener('resize', recalcHeight);
  }, [recalcHeight]);

  // Recalculate after components load
  useEffect(() => {
    recalcHeight();
  }, [componentsBySource, recalcHeight]);

  const toggleSource = (sourceId: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(sourceId)) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }
      return next;
    });
  };

  // Expand all when searching
  const effectiveExpanded = searchQuery
    ? new Set(componentsBySource.map((s) => s.sourceDocumentId))
    : expandedSources;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
        <Loader small>Loading...</Loader>
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: '12px', color: '#d02b20', fontSize: '13px' }}>{error}</div>;
  }

  if (componentsBySource.length === 0) {
    return (
      <div style={{ padding: '12px', color: '#8e8ea9', fontSize: '13px' }}>
        No components available. Add an MF source to get started.
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Search */}
      <div
        ref={searchRef}
        style={{
          padding: '8px',
          background: '#ffffff',
          borderBottom: '1px solid #eaeaef',
          flexShrink: 0,
        }}
      >
        <TextInput
          placeholder="Search..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          startAction={<Search width={14} height={14} />}
          aria-label="Search components"
          size="S"
        />
      </div>

      {/* Scrollable Component List */}
      <div
        style={{
          padding: '8px',
          overflowY: 'auto',
          overflowX: 'hidden',
          maxHeight: listMaxHeight ? `${listMaxHeight}px` : 'calc(100vh - 200px)',
        }}
      >
        {componentsBySource.map((source) => (
          <ComponentGroup
            key={source.sourceDocumentId}
            source={source}
            searchQuery={searchQuery}
            isExpanded={effectiveExpanded.has(source.sourceDocumentId)}
            onToggle={() => toggleSource(source.sourceDocumentId)}
          />
        ))}
      </div>
    </div>
  );
}
