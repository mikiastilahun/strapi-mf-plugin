<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchLayoutBySlug, fetchLayoutById } from '../api';
  import { preloadRemotes } from '../mf-loader';
  import LayoutGrid from './LayoutGrid.svelte';
  import NotFound from './NotFound.svelte';
  import type { ExportedLayout, ComponentRenderInfo } from '../types';

  export let slug: string;

  let layoutData: ExportedLayout | null = null;
  let componentInfos: ComponentRenderInfo[] = [];
  let loading = true;
  let notFound = false;
  let error: string | null = null;

  // Reactive: reload when slug changes
  $: if (slug) {
    loadLayout(slug);
  }

  async function loadLayout(layoutSlug: string) {
    loading = true;
    notFound = false;
    error = null;
    componentInfos = [];
    layoutData = null;

    try {
      console.log('[SlugPage] Fetching layout by slug:', layoutSlug);
      
      const data = await fetchLayoutBySlug(layoutSlug);
      
      if (!data) {
        notFound = true;
        loading = false;
        return;
      }

      layoutData = data;
      console.log('[SlugPage] Layout loaded:', layoutData.page.name);

      // Build component render info from layout items and remotes
      componentInfos = layoutData.layout.items.map(item => {
        const remote = layoutData!.remotes[item.mfSourceId];
        // Parse the componentId to extract the expose path
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
        console.log('[SlugPage] Preloading remotes:', remoteEntries);
        await preloadRemotes(remoteEntries);
      }

      loading = false;
    } catch (err) {
      console.error('[SlugPage] Failed to load layout:', err);
      error = err instanceof Error ? err.message : 'Failed to load layout';
      loading = false;
    }
  }

  function handleRefresh() {
    loadLayout(slug);
  }
</script>

<svelte:head>
  {#if layoutData}
    <title>{layoutData.page.name}</title>
    {#if layoutData.page.description}
      <meta name="description" content={layoutData.page.description} />
    {/if}
  {:else if notFound}
    <title>Page Not Found</title>
  {:else}
    <title>Loading...</title>
  {/if}
</svelte:head>

<div class="slug-page">
  {#if loading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading page...</p>
    </div>
  {:else if notFound}
    <NotFound message="Page not found" {slug} />
  {:else if error}
    <div class="error-container">
      <div class="error-content">
        <h2>Error Loading Page</h2>
        <p>{error}</p>
        <button on:click={handleRefresh}>Try Again</button>
      </div>
    </div>
  {:else if layoutData}
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
  .slug-page {
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
    background: #f6f6f9;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e0e0e6;
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
    color: #666687;
    font-size: 16px;
  }

  .error-content {
    text-align: center;
    max-width: 400px;
    background: white;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .error-content button:hover {
    background: #3b38cc;
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
