// Component types
export interface ComponentProp {
  type: string;
  required?: boolean;
  default?: unknown;
  options?: unknown[];
  description?: string;
}

export interface ParsedComponent {
  id: string;
  name: string;
  exposePath: string;
  displayName: string;
  description: string;
  category: string;
  icon: string | null;
  props: Record<string, ComponentProp> | null;
}

export interface ComponentWithSource extends ParsedComponent {
  sourceId: number;
  sourceDocumentId: string;
  sourceName: string;
  remoteEntry: string | null;
  scope: string | null;
}

// MF Source types
export interface MFSource {
  id: number;
  documentId: string;
  name: string;
  manifestUrl: string;
  remoteEntry: string | null;
  scope: string | null;
  components: ParsedComponent[] | null;
  metadata: Record<string, unknown> | null;
  lastFetched: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface PageLayout {
  items: LayoutItem[];
}

export interface PageLayoutRecord {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description: string | null;
  layout: PageLayout;
  gridConfig: GridConfig;
  metadata: Record<string, unknown> | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// Builder state types
export interface BuilderState {
  layout: PageLayout;
  gridConfig: GridConfig;
  selectedItemId: string | null;
  isDirty: boolean;
}

// Grouped components
export interface ComponentsBySource {
  sourceId: number;
  sourceDocumentId: string;
  sourceName: string;
  remoteEntry: string | null;
  scope: string | null;
  components: ParsedComponent[];
}

// API Response types
export interface ApiResponse<T> {
  data: T;
}

// Drag and drop types
export interface DragData {
  type: 'palette' | 'canvas';
  component?: ComponentWithSource;
  itemId?: string;
}
