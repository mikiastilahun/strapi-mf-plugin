import type { Core } from '@strapi/strapi';
import type { MFExpose, MFManifest, ParsedComponent } from '../types';

const manifestService = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Fetch a Module Federation manifest from a URL
   */
  async fetchManifest(url: string): Promise<MFManifest> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
      }

      const manifest = await response.json();
      return manifest as MFManifest;
    } catch (error) {
      strapi.log.error(`Error fetching MF manifest from ${url}:`, error);
      throw new Error(
        `Failed to fetch Module Federation manifest: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Parse exposes from manifest - handles both array and object formats
   */
  parseExposes(manifest: MFManifest): MFExpose[] {
    const exposes = manifest.exposes;

    if (!exposes) {
      return [];
    }

    // Handle array format: [{ name: "./Button", path: "./src/Button.tsx" }]
    if (Array.isArray(exposes)) {
      return exposes.map((expose) => ({
        name: expose.name,
        path: expose.path,
      }));
    }

    // Handle object format: { "./Button": "./src/Button.tsx" }
    if (typeof exposes === 'object') {
      return Object.entries(exposes).map(([name, path]) => ({
        name,
        path: path as string,
      }));
    }

    return [];
  },

  /**
   * Parse components from a manifest and enrich with metadata
   */
  parseComponents(manifest: MFManifest): ParsedComponent[] {
    const exposes = this.parseExposes(manifest);
    const componentMetadata = manifest.componentMetadata || {};

    return exposes.map((expose) => {
      const metadata = componentMetadata[expose.name] || {};
      const cleanName = expose.name.replace(/^\.\//, '');

      return {
        id: `${manifest.name || manifest.id || 'unknown'}/${cleanName}`,
        name: cleanName,
        exposePath: expose.name,
        displayName: metadata.displayName || cleanName,
        description:
          metadata.description || `${cleanName} component from ${manifest.name || 'remote'}`,
        category: metadata.category || 'General',
        icon: metadata.icon || null,
        props: metadata.props || null,
      };
    });
  },

  /**
   * Get remote entry URL from manifest
   */
  getRemoteEntry(manifest: MFManifest, baseUrl: string): string | null {
    // Get the base URL (directory containing the manifest)
    const base = new URL(baseUrl);
    const baseDir = base.href.substring(0, base.href.lastIndexOf('/') + 1);

    // Check metaData.remoteEntry first
    if (manifest.metaData?.remoteEntry) {
      const remoteEntryMeta = manifest.metaData.remoteEntry;
      // Construct path from path + name
      const entryPath = remoteEntryMeta.path
        ? `${remoteEntryMeta.path}/${remoteEntryMeta.name}`
        : remoteEntryMeta.name;

      if (entryPath) {
        // If it's an absolute URL, use it directly
        if (entryPath.startsWith('http')) {
          return entryPath;
        }
        // Otherwise, construct from base URL directory
        return new URL(entryPath, baseDir).toString();
      }
    }

    // Check top-level remoteEntry
    if (manifest.remoteEntry) {
      if (manifest.remoteEntry.startsWith('http')) {
        return manifest.remoteEntry;
      }
      return new URL(manifest.remoteEntry, baseDir).toString();
    }

    // Default: assume remoteEntry.js in same directory as manifest
    return new URL('remoteEntry.js', baseDir).toString();
  },

  /**
   * Fetch and parse a manifest, returning structured component data
   */
  async fetchAndParse(url: string) {
    const manifest = await this.fetchManifest(url);
    const components = this.parseComponents(manifest);
    const remoteEntry = this.getRemoteEntry(manifest, url);

    return {
      name: manifest.name || manifest.id || 'unknown',
      scope: manifest.name || manifest.id,
      remoteEntry,
      components,
      metadata: {
        publicPath: manifest.metaData?.publicPath,
        type: manifest.metaData?.type,
        buildInfo: manifest.metaData?.buildInfo,
      },
      rawManifest: manifest,
    };
  },
});

export default manifestService;
