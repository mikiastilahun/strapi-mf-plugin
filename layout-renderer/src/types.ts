/**
 * Layout item representing a component placement in the grid
 */
export interface LayoutItem {
  id: string;
  componentId: string;
  mfSourceId: number;
  gridColumn: string;
  gridRow: string;
  props: Record<string, unknown>;
}

/**
 * Grid configuration for the layout
 */
export interface GridConfig {
  columns: number;
  gap: string;
  rowHeight: string;
}

/**
 * Page layout as returned from Strapi API (list endpoint)
 */
export interface PageLayout {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description?: string;
  layout: {
    items: LayoutItem[];
  };
  gridConfig: GridConfig;
  metadata?: Record<string, unknown>;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * MF Remote info from export
 */
export interface MFRemote {
  name: string;
  remoteEntry: string;
  scope: string;
}

/**
 * Exported layout format from /layouts/:id/export endpoint
 */
export interface ExportedLayout {
  version: string;
  exportedAt: string;
  page: {
    name: string;
    slug: string;
    description?: string;
    metadata?: Record<string, unknown>;
  };
  grid: GridConfig;
  layout: {
    items: LayoutItem[];
  };
  remotes: Record<number, MFRemote>;
}

/**
 * Component info for rendering (derived from layout item + remote)
 */
export interface ComponentRenderInfo {
  item: LayoutItem;
  displayName: string;
  remoteEntry: string;
  scope: string;
  exposePath: string;
}
