<script lang="ts">
  import { navigate } from 'svelte-navigator';

  export let message: string = "Page not found";
  export let slug: string = "";

  function goHome() {
    navigate('/');
  }
</script>

<div class="not-found">
  <div class="content">
    <h1>404</h1>
    <h2>{message}</h2>
    {#if slug}
      <p class="slug">/{slug}</p>
    {/if}
    <p class="description">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <button on:click={goHome}>
      Go to Home
    </button>
  </div>
</div>

<style>
  .not-found {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
  }

  .content {
    text-align: center;
    background: white;
    padding: 48px 64px;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 500px;
  }

  h1 {
    font-size: 120px;
    font-weight: 800;
    color: #4945ff;
    margin: 0;
    line-height: 1;
    opacity: 0.8;
  }

  h2 {
    font-size: 24px;
    color: #32324d;
    margin: 16px 0 8px;
  }

  .slug {
    font-family: monospace;
    font-size: 16px;
    color: #666687;
    background: #f6f6f9;
    padding: 8px 16px;
    border-radius: 4px;
    display: inline-block;
    margin: 8px 0 16px;
  }

  .description {
    color: #666687;
    font-size: 16px;
    margin: 0 0 24px;
  }

  button {
    padding: 12px 32px;
    background: #4945ff;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  button:hover {
    background: #3b38cc;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(73, 69, 255, 0.4);
  }
</style>
