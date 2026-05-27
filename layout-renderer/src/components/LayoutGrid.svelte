<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import ComponentRenderer from './ComponentRenderer.svelte';
  import type { LayoutItem, GridConfig, ComponentRenderInfo } from '../types';

  export let items: LayoutItem[];
  export let gridConfig: GridConfig;
  export let componentInfos: ComponentRenderInfo[];

  // Create a map for quick component lookup by item id
  $: componentMap = new Map(componentInfos.map(c => [c.item.id, c]));

  // Responsive breakpoints
  let windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  
  // Calculate responsive columns based on window width
  $: responsiveColumns = (() => {
    if (windowWidth < 640) return Math.min(4, gridConfig.columns); // Mobile: max 4 columns
    if (windowWidth < 1024) return Math.min(8, gridConfig.columns); // Tablet: max 8 columns
    return gridConfig.columns; // Desktop: full columns
  })();

  // Scale factor for responsive column spans
  $: columnScale = responsiveColumns / gridConfig.columns;

  // Build grid style from config - use minmax to allow rows to grow
  $: gridStyle = `
    display: grid;
    grid-template-columns: repeat(${responsiveColumns}, 1fr);
    gap: ${gridConfig.gap};
    grid-auto-rows: minmax(${gridConfig.rowHeight}, auto);
    padding: 16px;
    min-height: 100%;
    background: #f6f6f9;
  `;

  // Scale a grid column value for responsive layout.
  // We work in 0-indexed offsets (start - 1, end - 1) so adjacent items at
  // 1/span 4 and 5/span 4 stay non-overlapping after scaling.
  function scaleGridColumn(gridColumn: string): string {
    if (columnScale === 1) return gridColumn;

    const parts = gridColumn.split('/').map(p => p.trim());
    if (parts.length !== 2) return gridColumn;

    const start = parseInt(parts[0]) || 1;
    const isSpan = parts[1].startsWith('span');
    const rawEnd = isSpan
      ? start + (parseInt(parts[1].replace('span', '').trim()) || 1)
      : (parseInt(parts[1]) || start + 1);

    // Scale offsets from origin, then convert back to 1-indexed grid lines.
    const scaledStart = Math.max(1, Math.round((start - 1) * columnScale) + 1);
    let scaledEnd = Math.max(scaledStart + 1, Math.round((rawEnd - 1) * columnScale) + 1);
    scaledEnd = Math.min(scaledEnd, responsiveColumns + 1);
    const scaledSpan = Math.max(1, scaledEnd - scaledStart);

    return isSpan ? `${scaledStart} / span ${scaledSpan}` : `${scaledStart} / ${scaledEnd}`;
  }

  function handleResize() {
    windowWidth = window.innerWidth;
  }

  onMount(() => {
    window.addEventListener('resize', handleResize);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize);
    }
  });
</script>

<div class="layout-grid" style={gridStyle}>
  {#each items as item (item.id)}
    {@const componentInfo = componentMap.get(item.id)}
    {@const scaledColumn = scaleGridColumn(item.gridColumn)}
    <div 
      class="grid-item"
      style="grid-column: {scaledColumn}; grid-row: {item.gridRow};"
    >
      {#if componentInfo}
        <ComponentRenderer {componentInfo} />
      {:else}
        <div class="not-found">
          Component not found: {item.componentId}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .layout-grid {
    width: 100%;
    box-sizing: border-box;
  }

  .grid-item {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    overflow: visible;
    min-height: 0;
    transition: all 0.2s ease;
  }

  .not-found {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 16px;
    color: #d02b20;
    text-align: center;
    font-size: 14px;
  }

  /* Mobile adjustments */
  @media (max-width: 640px) {
    .layout-grid {
      padding: 8px;
      gap: 8px;
    }

    .grid-item {
      border-radius: 6px;
    }
  }
</style>
