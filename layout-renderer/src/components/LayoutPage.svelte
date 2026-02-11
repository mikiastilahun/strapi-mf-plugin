<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchLayoutById } from '../api';
  import { preloadRemotes } from '../mf-loader';
  import LayoutGrid from './LayoutGrid.svelte';
  import type { ExportedLayout, ComponentRenderInfo } from '../types';

  export let layoutId: string;

  let layoutData: ExportedLayout | null = null;
  let componentInfos: ComponentRenderInfo[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    await loadLayout();
  });

  async function loadLayout() {
    loading = true;
    error = null;

    try {
      console.log('[LayoutPage] Fetching layout:', layoutId);
      layoutData = await fetchLayoutById(layoutId);
      console.log('[LayoutPage] Layout loaded:', layoutData.page.name);

      // Build component render info from layout items and remotes
      componentInfos = layoutData.layout.items.map(item => {
        const remote = layoutData!.remotes[item.mfSourceId];
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

      // Preload all remote entries for faster component loading
      const remoteEntries = Object.values(layoutData.remotes)
        .map(r => r.remoteEntry)
        .filter((entry): entry is string => !!entry);
      
      if (remoteEntries.length > 0) {
        console.log('[LayoutPage] Preloading remotes:', remoteEntries);
        await preloadRemotes(remoteEntries);
      }

      loading = false;
    } catch (err) {
      console.error('[LayoutPage] Failed to load layout:', err);
      error = err instanceof Error ? err.message : 'Failed to load layout';
      loading = false;
    }
  }

  function handleRefresh() {
    loadLayout();
  }
</script>

<div class="layout-page">
  {#if loading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading layout...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <div class="error-content">
        <h2>Error Loading Layout</h2>
        <p>{error}</p>
        <button on:click={handleRefresh}>Try Again</button>
      </div>
    </div>
  {:else if layoutData}
    <header class="layout-header">
      <h1>{layoutData.page.name}</h1>
      {#if layoutData.page.description}
        <p>{layoutData.page.description}</p>
      {/if}
      <button class="refresh-btn" on:click={handleRefresh}>Refresh</button>
    </header>
    
    <main class="layout-content">
      <LayoutGrid 
        items={layoutData.layout.items}
        gridConfig={layoutData.grid}
        {componentInfos}
      />
    </main>
  {:else}
    <div class="empty-container">
      <p>No layout data available</p>
    </div>
  {/if}
</div>

<style>
  .layout-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .loading-container,
  .error-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 20px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #4945ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-container p {
    color: #666;
    font-size: 16px;
  }

  .error-content {
    text-align: center;
    max-width: 400px;
  }

  .error-content h2 {
    color: #d02b20;
    margin-bottom: 16px;
  }

  .error-content p {
    color: #666;
    margin-bottom: 24px;
  }

  .error-content button {
    padding: 12px 24px;
    background: #4945ff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .error-content button:hover {
    background: #3b38cc;
  }

  .layout-header {
    background: white;
    border-bottom: 1px solid #dcdce4;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .layout-header h1 {
    font-size: 24px;
    color: #32324d;
    margin: 0;
  }

  .layout-header p {
    color: #666687;
    margin: 0;
    flex: 1;
  }

  .refresh-btn {
    padding: 8px 16px;
    background: #f6f6f9;
    border: 1px solid #dcdce4;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    color: #32324d;
  }

  .refresh-btn:hover {
    background: #eaeaef;
  }

  .layout-content {
    flex: 1;
    overflow: auto;
  }

  .empty-container p {
    color: #666;
    font-size: 16px;
  }
</style>
