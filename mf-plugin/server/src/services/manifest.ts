import type { Core } from '@strapi/strapi';
import type {
  MFExpose,
  MFManifest,
  ParsedComponent,
  ModulePropsFile,
  ModulePropDescriptor,
  ComponentPropDef,
} from '../types';

/** Filename of the prop-type sidecar a remote may publish next to its manifest. */
const MODULE_PROPS_FILENAME = 'module-props.json';

/** Strip the module-federation expose prefix ("./Customer/find" -> "Customer/find"). */
const stripExposePrefix = (name: string): string => name.replace(/^\.\//, '');

/**
 * Map a module-props `jsonType` to the editor `type` the builder's
 * PropertiesPanel understands (boolean | number | string | json).
 */
const jsonTypeToEditorType = (descriptor: ModulePropDescriptor): string => {
  switch (descriptor.jsonType) {
    case 'boolean':
      return 'boolean';
    case 'number':
      return 'number';
    case 'object':
    case 'array':
      return 'json';
    case 'function':
      // Not editable via a form field; surfaced as a (rarely-touched) string.
      return 'string';
    case 'string':
    default:
      return 'string';
  }
};

/**
 * Derive dropdown options from an inline string-literal union tsType
 * (e.g. `"a" | "b" | ""` -> ["a", "b"]). Named-type unions (e.g. `ModelProvider`)
 * cannot be resolved from the manifest alone and yield null.
 */
const deriveEnumOptions = (tsType: string): string[] | null => {
  if (!/\|/.test(tsType)) return null;
  const literals = [...tsType.matchAll(/"([^"]*)"/g)].map((m) => m[1]).filter((s) => s !== '');
  return literals.length ? literals : null;
};

/**
 * Convert a module-props `props` array into the builder's
 * `Record<propName, ComponentPropDef>` map shape.
 */
const descriptorsToPropDefs = (
  descriptors: ModulePropDescriptor[]
): Record<string, ComponentPropDef> => {
  const out: Record<string, ComponentPropDef> = {};
  for (const descriptor of descriptors) {
    // Prefer explicit options from the contract; fall back to deriving them
    // from an inline string-literal union tsType.
    const options =
      Array.isArray(descriptor.options) && descriptor.options.length
        ? descriptor.options
        : deriveEnumOptions(descriptor.tsType);
    const def: ComponentPropDef = {
      type: options ? 'enum' : jsonTypeToEditorType(descriptor),
      description: descriptor.description,
    };
    if (descriptor.required) def.required = true;
    if (Object.prototype.hasOwnProperty.call(descriptor, 'default')) def.default = descriptor.default;
    if (options) def.options = options;
    out[descriptor.name] = def;
  }
  return out;
};

/**
 * Build a lookup of expose-key (normalized, prefix stripped) -> prop-def map
 * from a module-props.json file.
 */
const buildModulePropsIndex = (
  moduleProps: ModulePropsFile
): Record<string, Record<string, ComponentPropDef>> => {
  const index: Record<string, Record<string, ComponentPropDef>> = {};
  for (const [key, entry] of Object.entries(moduleProps)) {
    if (!entry || !Array.isArray(entry.props)) continue;
    index[stripExposePrefix(key)] = descriptorsToPropDefs(entry.props);
  }
  return index;
};

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
   * Resolve the URL of the `module-props.json` sidecar that sits next to the
   * manifest (same directory).
   */
  getModulePropsUrl(manifestUrl: string): string {
    const base = new URL(manifestUrl);
    const baseDir = base.href.substring(0, base.href.lastIndexOf('/') + 1);
    return new URL(MODULE_PROPS_FILENAME, baseDir).toString();
  },

  /**
   * Fetch the optional `module-props.json` sidecar. Returns null when the
   * remote does not publish one (or it is unreachable) — prop metadata is
   * optional and must never break manifest parsing.
   */
  async fetchModuleProps(manifestUrl: string): Promise<ModulePropsFile | null> {
    const url = this.getModulePropsUrl(manifestUrl);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        strapi.log.info(`No module-props.json at ${url} (${response.status}); skipping prop schema.`);
        return null;
      }
      return (await response.json()) as ModulePropsFile;
    } catch (error) {
      strapi.log.warn(
        `Could not fetch module-props.json from ${url}: ${error instanceof Error ? error.message : 'unknown error'}`
      );
      return null;
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
   * Parse components from a manifest and enrich with metadata.
   *
   * Props precedence: an explicit `componentMetadata[...].props` embedded in the
   * manifest wins; otherwise props come from the `module-props.json` sidecar
   * (matched by expose key with the "./" prefix normalized away).
   */
  parseComponents(manifest: MFManifest, moduleProps?: ModulePropsFile | null): ParsedComponent[] {
    const exposes = this.parseExposes(manifest);
    const componentMetadata = manifest.componentMetadata || {};
    const modulePropsIndex = moduleProps ? buildModulePropsIndex(moduleProps) : {};

    return exposes.map((expose) => {
      const metadata = componentMetadata[expose.name] || {};
      const cleanName = expose.name.replace(/^\.\//, '');
      const sidecarProps = modulePropsIndex[cleanName] || null;

      return {
        id: `${manifest.name || manifest.id || 'unknown'}/${cleanName}`,
        name: cleanName,
        exposePath: expose.name,
        displayName: metadata.displayName || cleanName,
        description:
          metadata.description || `${cleanName} component from ${manifest.name || 'remote'}`,
        category: metadata.category || 'General',
        icon: metadata.icon || null,
        props: metadata.props || sidecarProps || null,
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
    const moduleProps = await this.fetchModuleProps(url);
    const components = this.parseComponents(manifest, moduleProps);
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
