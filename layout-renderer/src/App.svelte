<script lang="ts">
  import { Router, Route, navigate } from 'svelte-navigator';
  import LayoutPage from './components/LayoutPage.svelte';
  import PreviewPage from './components/PreviewPage.svelte';
  import SlugPage from './components/SlugPage.svelte';
  import NotFound from './components/NotFound.svelte';
  import { fetchAllLayouts } from './api';
  import { onMount } from 'svelte';
  import type { PageLayout } from './types';

  let layouts: PageLayout[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      const result = await fetchAllLayouts();
      // Ensure layouts is always an array
      layouts = Array.isArray(result) ? result : [];
      loading = false;
    } catch (err) {
      console.error('[App] Failed to fetch layouts:', err);
      error = err instanceof Error ? err.message : 'Failed to load layouts';
      layouts = []; // Ensure layouts is an empty array on error
      loading = false;
    }
  });

  function handleLayoutClick(slug: string) {
    navigate(`/${slug}`);
  }

  function handleLayoutIdClick(documentId: string) {
    navigate(`/layout/${documentId}`);
  }
</script>

<Router>
  <div class="app">
    <!-- Preview route for iframe embedding -->
    <Route path="/preview">
      <PreviewPage />
    </Route>
    
    <!-- Layout by document ID (for backward compatibility) -->
    <Route path="/layout/:id" let:params>
      <LayoutPage layoutId={params.id} />
    </Route>
    
    <!-- Admin/Home page - list all layouts -->
    <Route path="/_admin">
      <div class="home">
        <header class="home-header">
          <h1>Layout Renderer</h1>
          <p>Select a layout to preview</p>
        </header>
        
        <main class="home-content">
          {#if loading}
            <div class="loading">
              <div class="spinner"></div>
              <p>Loading layouts...</p>
            </div>
          {:else if error}
            <div class="error">
              <p>{error}</p>
            </div>
          {:else if layouts.length === 0}
            <div class="empty">
              <p>No layouts available</p>
              <small>Create layouts in the Strapi admin panel</small>
            </div>
          {:else}
            <div class="layout-list">
              {#each layouts as layout (layout.documentId)}
                <button 
                  class="layout-card"
                  on:click={() => handleLayoutClick(layout.slug)}
                >
                  <h3>{layout.name}</h3>
                  <span class="slug">/{layout.slug}</span>
                  {#if layout.description}
                    <p>{layout.description}</p>
                  {/if}
                  <div class="meta">
                    <span class="status" class:published={layout.isPublished}>
                      {layout.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <span class="items">
                      {layout.layout?.items?.length || 0} components
                    </span>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </main>
      </div>
    </Route>

    <!-- Home page redirects to _admin for now -->
    <Route path="/">
      <div class="home">
        <header class="home-header">
          <h1>Layout Renderer</h1>
          <p>Select a layout to preview</p>
        </header>
        
        <main class="home-content">
          {#if loading}
            <div class="loading">
              <div class="spinner"></div>
              <p>Loading layouts...</p>
            </div>
          {:else if error}
            <div class="error">
              <p>{error}</p>
            </div>
          {:else if layouts.length === 0}
            <div class="empty">
              <p>No layouts available</p>
              <small>Create layouts in the Strapi admin panel</small>
            </div>
          {:else}
            <div class="layout-list">
              {#each layouts as layout (layout.documentId)}
                <button 
                  class="layout-card"
                  on:click={() => handleLayoutClick(layout.slug)}
                >
                  <h3>{layout.name}</h3>
                  <span class="slug">/{layout.slug}</span>
                  {#if layout.description}
                    <p>{layout.description}</p>
                  {/if}
                  <div class="meta">
                    <span class="status" class:published={layout.isPublished}>
                      {layout.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <span class="items">
                      {layout.layout?.items?.length || 0} components
                    </span>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </main>
      </div>
    </Route>

    <!-- Catch-all route for slug-based pages -->
    <Route path="/:slug" let:params>
      <SlugPage slug={params.slug} />
    </Route>
  </div>
</Router>

<style>
  .app {
    min-height: 100vh;
  }

  .home {
    min-height: 100vh;
    background: #f6f6f9;
  }

  .home-header {
    background: white;
    border-bottom: 1px solid #dcdce4;
    padding: 32px 24px;
    text-align: center;
  }

  .home-header h1 {
    font-size: 32px;
    color: #32324d;
    margin: 0 0 8px 0;
  }

  .home-header p {
    color: #666687;
    margin: 0;
    font-size: 16px;
  }

  .home-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px 24px;
  }

  .loading,
  .error,
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
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

  .loading p,
  .error p,
  .empty p {
    color: #666;
    font-size: 16px;
    margin: 0;
  }

  .error p {
    color: #d02b20;
  }

  .empty small {
    color: #999;
    margin-top: 8px;
  }

  .layout-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
  }

  .layout-card {
    background: white;
    border: 1px solid #dcdce4;
    border-radius: 8px;
    padding: 24px;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .layout-card:hover {
    border-color: #4945ff;
    box-shadow: 0 4px 12px rgba(73, 69, 255, 0.15);
  }

  .layout-card h3 {
    font-size: 18px;
    color: #32324d;
    margin: 0;
  }

  .layout-card .slug {
    font-size: 14px;
    color: #666687;
    font-family: monospace;
  }

  .layout-card p {
    font-size: 14px;
    color: #666687;
    margin: 0;
    line-height: 1.4;
  }

  .meta {
    display: flex;
    gap: 12px;
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid #eaeaef;
  }

  .status {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    background: #fdf4dc;
    color: #be5d01;
  }

  .status.published {
    background: #c6f0c2;
    color: #328048;
  }

  .items {
    font-size: 12px;
    color: #666687;
  }
</style>
