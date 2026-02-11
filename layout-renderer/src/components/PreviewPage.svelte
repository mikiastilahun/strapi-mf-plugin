<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { preloadRemotes } from '../mf-loader';
  import LayoutGrid from './LayoutGrid.svelte';
  import type { ExportedLayout, ComponentRenderInfo, GridConfig, LayoutItem } from '../types';

  let layoutData: ExportedLayout | null = null;
  let componentInfos: ComponentRenderInfo[] = [];
  let gridConfig: GridConfig = { columns: 12, gap: '16px', rowHeight: '100px' };
  let items: LayoutItem[] = [];
  let loading = true;
  let error: string | null = null;
  let waitingForData = true;

  function processLayoutData(data: ExportedLayout) {
    console.log('[PreviewPage] Processing layout data:', data);
    layoutData = data;
    gridConfig = data.grid;
    items = data.layout.items;

    // Build component render info from layout items and remotes
    componentInfos = data.layout.items.map(item => {
      const remote = data.remotes[item.mfSourceId];
      // Parse the componentId to extract the expose path
      // Format: "scope/Category/componentName" -> exposePath is "Category/componentName"
      const parts = item.componentId.split('/');
      const exposePath = parts.length > 1 ? parts.slice(1).join('/') : item.componentId;
      
      return {
        item,
        displayName: parts[parts.length - 1] || item.componentId,
        remoteEntry: remote?.remoteEntry || '',
        scope: remote?.scope || '',
        exposePath: `./${exposePath}`,
      };
    });

    // Preload all remote entries
    const remoteEntries = Object.values(data.remotes)
      .map(r => r.remoteEntry)
      .filter((entry): entry is string => !!entry);
    
    if (remoteEntries.length > 0) {
      console.log('[PreviewPage] Preloading remotes:', remoteEntries);
      preloadRemotes(remoteEntries).then(() => {
        loading = false;
        waitingForData = false;
      }).catch(err => {
        console.error('[PreviewPage] Failed to preload remotes:', err);
        loading = false;
        waitingForData = false;
      });
    } else {
      loading = false;
      waitingForData = false;
    }
  }

  function handleMessage(event: MessageEvent) {
    // Accept messages from any origin for preview
    const { type, data } = event.data || {};
    
    console.log('[PreviewPage] Received message:', type);

    if (type === 'PREVIEW_LAYOUT') {
      try {
        processLayoutData(data as ExportedLayout);
      } catch (err) {
        console.error('[PreviewPage] Failed to process layout data:', err);
        error = err instanceof Error ? err.message : 'Failed to process layout data';
        loading = false;
        waitingForData = false;
      }
    }

    if (type === 'PREVIEW_REFRESH') {
      // Re-process the same data to refresh components
      if (layoutData) {
        loading = true;
        componentInfos = [];
        setTimeout(() => {
          processLayoutData(layoutData!);
        }, 100);
      }
    }
  }

  onMount(() => {
    window.addEventListener('message', handleMessage);
    
    // Notify parent that we're ready to receive data
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
    }

    // Also check URL params for layout ID (for standalone preview)
    const urlParams = new URLSearchParams(window.location.search);
    const layoutId = urlParams.get('layoutId');
    if (layoutId) {
      // Fetch layout data if ID is provided
      import('../api').then(({ fetchLayoutById }) => {
        fetchLayoutById(layoutId)
          .then(data => processLayoutData(data))
          .catch(err => {
            error = err instanceof Error ? err.message : 'Failed to fetch layout';
            loading = false;
            waitingForData = false;
          });
      });
    }
  });

  onDestroy(() => {
    window.removeEventListener('message', handleMessage);
  });
</script>

<div class="preview-page">
  {#if waitingForData && !error}
    <div class="waiting">
      <div class="spinner"></div>
      <p>Waiting for layout data...</p>
    </div>
  {:else if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading components...</p>
    </div>
  {:else if error}
    <div class="error">
      <h2>Preview Error</h2>
      <p>{error}</p>
    </div>
  {:else if items.length > 0}
    <LayoutGrid {items} {gridConfig} {componentInfos} />
  {:else}
    <div class="empty">
      <p>No components in layout</p>
    </div>
  {/if}
</div>

<style>
  .preview-page {
    min-height: 100vh;
    background: #f6f6f9;
  }

  .waiting,
  .loading,
  .error,
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 20px;
    text-align: center;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #4945ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .waiting p,
  .loading p,
  .empty p {
    color: #666;
    font-size: 14px;
    margin: 0;
  }

  .error h2 {
    color: #d02b20;
    margin: 0 0 8px 0;
    font-size: 18px;
  }

  .error p {
    color: #666;
    margin: 0;
  }
</style>
