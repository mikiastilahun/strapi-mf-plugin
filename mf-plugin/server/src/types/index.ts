// MF Manifest types
export interface MFExpose {
  name: string;
  path: string;
}

export interface MFManifest {
  id?: string;
  name: string;
  exposes?: Array<{ name: string; path: string }> | Record<string, string>;
  remoteEntry?: string;
  shared?: Record<string, unknown>;
  metaData?: {
    publicPath?: string;
    name?: string;
    type?: string;
    buildInfo?: Record<string, unknown>;
    remoteEntry?: {
      name?: string;
      path?: string;
      type?: string;
    };
    types?: {
      path?: string;
      name?: string;
    };
  };
  componentMetadata?: Record<
    string,
    {
      displayName?: string;
      description?: string;
      category?: string;
      icon?: string;
      props?: Record<
        string,
        {
          type: string;
          required?: boolean;
          default?: unknown;
          options?: unknown[];
          description?: string;
        }
      >;
    }
  >;
}

export interface ParsedComponent {
  id: string;
  name: string;
  exposePath: string;
  displayName: string;
  description: string;
  category: string;
  icon: string | null;
  props: Record<string, unknown> | null;
}

export interface ComponentWithSource extends ParsedComponent {
  sourceId: number;
  sourceDocumentId: string;
  sourceName: string;
  remoteEntry: string | null;
  scope: string | null;
}

// Layout types
export interface LayoutItem {
  id: string;
  componentId: string;
  mfSourceId: number;
  gridColumn: string;
  gridRow: string;
  props: Record<string, unknown>;
}

export interface GridConfig {
  columns: number;
  gap: string;
  rowHeight: string;
}

export interface PageLayoutData {
  name: string;
  slug: string;
  description?: string;
  layout: {
    items: LayoutItem[];
  };
  gridConfig: GridConfig;
  metadata?: Record<string, unknown>;
  isPublished?: boolean;
}

export interface MFSource {
  id: number;
  documentId: string;
  name: string;
  manifestUrl: string;
  remoteEntry: string | null;
  scope: string | null;
  components: ParsedComponent[] | null;
  isActive: boolean;
}
