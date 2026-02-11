/**
 * Module Federation dynamic loader
 * Handles loading remote entries and components at runtime
 */

// Track loaded remote entries
const loadedRemotes = new Map<string, Promise<void>>();
const initializedContainers = new Set<string>();

// Extend window type for federated containers
declare global {
  interface Window {
    [key: string]: any;
  }
}

/**
 * Load a remote entry script dynamically
 */
export function loadRemoteEntry(remoteEntry: string): Promise<void> {
  if (loadedRemotes.has(remoteEntry)) {
    return loadedRemotes.get(remoteEntry)!;
  }

  const promise = new Promise<void>((resolve, reject) => {
    // Check if script already exists
    const existingScript = document.querySelector(
      `script[src="${remoteEntry}"]`,
    );
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = remoteEntry;
    script.type = "text/javascript";
    script.async = true;
    script.crossOrigin = "anonymous";

    script.onload = () => {
      console.log("[MF] Remote entry loaded:", remoteEntry);
      resolve();
    };

    script.onerror = () => {
      console.error("[MF] Failed to load remote entry:", remoteEntry);
      loadedRemotes.delete(remoteEntry);
      reject(new Error(`Failed to load remote entry: ${remoteEntry}`));
    };

    document.head.appendChild(script);
  });

  loadedRemotes.set(remoteEntry, promise);
  return promise;
}

/**
 * Initialize a federated container
 */
async function initContainer(scope: string): Promise<any> {
  const container = window[scope];

  if (!container) {
    throw new Error(`Container "${scope}" not found on window`);
  }

  if (initializedContainers.has(scope)) {
    return container;
  }

  // Create a minimal shared scope for Svelte
  const sharedScope: Record<string, any> = {};

  try {
    await container.init(sharedScope);
    initializedContainers.add(scope);
    console.log("[MF] Container initialized:", scope);
  } catch (e: any) {
    // Container might already be initialized
    if (!e.message?.includes("already been initialized")) {
      throw e;
    }
    initializedContainers.add(scope);
  }

  return container;
}

/**
 * Load a component from a federated module with timeout
 */
export async function loadFederatedComponent(
  scope: string,
  exposePath: string,
  remoteEntry: string,
  timeoutMs: number = 15000,
): Promise<any> {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error(`Timeout loading component after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });

  const loadPromise = async () => {
    // Load the remote entry
    console.log("[MF] Loading remote entry:", remoteEntry);
    await loadRemoteEntry(remoteEntry);
    console.log("[MF] Remote entry loaded, initializing container:", scope);

    // Initialize the container
    const container = await initContainer(scope);
    console.log("[MF] Container ready, getting component:", exposePath);

    // Normalize the expose path - ensure it starts with ./
    const normalizedPath = exposePath.startsWith("./")
      ? exposePath
      : `./${exposePath}`;

    console.log("[MF] Fetching module:", scope, normalizedPath);

    try {
      const factory = await container.get(normalizedPath);
      console.log("[MF] Got factory, creating module");
      const module = factory();
      console.log(
        "[MF] Component loaded successfully:",
        scope,
        normalizedPath,
        module,
      );
      return module.default || module;
    } catch (e) {
      console.error("[MF] Failed to get component:", normalizedPath, e);
      throw e;
    }
  };

  return Promise.race([loadPromise(), timeoutPromise]);
}

/**
 * Preload multiple remote entries in parallel
 */
export async function preloadRemotes(remoteEntries: string[]): Promise<void> {
  const uniqueEntries = [...new Set(remoteEntries)];
  await Promise.all(uniqueEntries.map(loadRemoteEntry));
}
