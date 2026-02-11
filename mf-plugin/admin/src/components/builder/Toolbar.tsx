import {
  Box,
  Flex,
  Typography,
  Button,
  TextInput,
  Field,
  Popover,
  Badge,
  IconButton,
} from '@strapi/design-system';
import { Eye, Download, Check, ArrowLeft, Trash, Duplicate } from '@strapi/icons';
import { Link } from 'react-router-dom';
import { PLUGIN_ID } from '../../pluginId';
import type { GridConfig, PageLayoutRecord } from '../../types';

// Version for debugging - update this when making changes
const PLUGIN_VERSION = 'v2.1.0';

// Custom icons for undo/redo
const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 10h10a5 5 0 0 1 5 5v2" />
    <polyline points="3 10 7 6 3 10 7 14" />
  </svg>
);

const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10H11a5 5 0 0 0-5 5v2" />
    <polyline points="21 10 17 6 21 10 17 14" />
  </svg>
);

interface ToolbarProps {
  layout: PageLayoutRecord | null;
  gridConfig: GridConfig;
  isDirty: boolean;
  isSaving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  selectedCount: number;
  onSave: () => void;
  onPreview: () => void;
  onExport: () => void;
  onGridConfigChange: (config: Partial<GridConfig>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function Toolbar({
  layout,
  gridConfig,
  isDirty,
  isSaving,
  canUndo,
  canRedo,
  selectedCount,
  onSave,
  onPreview,
  onExport,
  onGridConfigChange,
  onUndo,
  onRedo,
  onDuplicate,
  onDelete,
}: ToolbarProps) {
  return (
    <Box
      background="neutral0"
      paddingTop={3}
      paddingBottom={3}
      paddingLeft={4}
      paddingRight={4}
      borderColor="neutral200"
      style={{ borderBottom: '1px solid #dcdce4' }}
    >
      <Flex justifyContent="space-between" alignItems="center">
        {/* Left: Navigation & Title */}
        <Flex gap={3} alignItems="center">
          <Link to={`/plugins/${PLUGIN_ID}/layouts`} style={{ textDecoration: 'none' }}>
            <Button variant="ghost" startIcon={<ArrowLeft />}>
              Back
            </Button>
          </Link>
          <Box>
            <Typography variant="beta" tag="h1">
              {layout?.name || 'New Layout'}
            </Typography>
            {layout?.slug && (
              <Typography variant="pi" textColor="neutral500">
                /{layout.slug}
              </Typography>
            )}
          </Box>
          {isDirty && (
            <Badge backgroundColor="warning100" textColor="warning700">
              Unsaved changes
            </Badge>
          )}
          <Badge backgroundColor="neutral150" textColor="neutral600" style={{ fontSize: '10px' }}>
            {PLUGIN_VERSION}
          </Badge>
        </Flex>

        {/* Center: History & Edit Actions */}
        <Flex gap={2} alignItems="center">
          {/* Undo/Redo */}
          <Flex gap={1} style={{ marginRight: '8px' }}>
            <IconButton onClick={onUndo} disabled={!canUndo} label="Undo (Ctrl+Z)" variant="ghost">
              <UndoIcon />
            </IconButton>
            <IconButton
              onClick={onRedo}
              disabled={!canRedo}
              label="Redo (Ctrl+Shift+Z)"
              variant="ghost"
            >
              <RedoIcon />
            </IconButton>
          </Flex>

          {/* Selection actions */}
          {selectedCount > 0 && (
            <Flex gap={1} style={{ marginRight: '8px' }}>
              <IconButton onClick={onDuplicate} label="Duplicate (Ctrl+D)" variant="ghost">
                <Duplicate />
              </IconButton>
              <IconButton onClick={onDelete} label="Delete (Del)" variant="ghost">
                <Trash fill="#d02b20" />
              </IconButton>
              <Badge
                backgroundColor="primary100"
                textColor="primary700"
                style={{ marginLeft: '4px' }}
              >
                {selectedCount} selected
              </Badge>
            </Flex>
          )}

          {/* Grid Config */}
          <Popover.Root>
            <Popover.Trigger>
              <Button variant="ghost" size="S">
                Grid: {gridConfig.columns} cols
              </Button>
            </Popover.Trigger>
            <Popover.Content>
              <Box padding={4} style={{ minWidth: '220px' }}>
                <Box marginBottom={4}>
                  <Typography variant="delta">Grid Settings</Typography>
                </Box>
                <Flex direction="column" gap={4}>
                  <Field.Root>
                    <Field.Label>Columns</Field.Label>
                    <TextInput
                      type="number"
                      min={1}
                      max={24}
                      value={gridConfig.columns}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onGridConfigChange({ columns: parseInt(e.target.value) || 12 })
                      }
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Gap</Field.Label>
                    <TextInput
                      value={gridConfig.gap}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onGridConfigChange({ gap: e.target.value })
                      }
                      placeholder="16px"
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Row Height</Field.Label>
                    <TextInput
                      value={gridConfig.rowHeight}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onGridConfigChange({ rowHeight: e.target.value })
                      }
                      placeholder="100px"
                    />
                  </Field.Root>
                </Flex>
              </Box>
            </Popover.Content>
          </Popover.Root>
        </Flex>

        {/* Right: Actions */}
        <Flex gap={2}>
          <Button variant="secondary" startIcon={<Eye />} onClick={onPreview}>
            Preview
          </Button>
          <Button variant="secondary" startIcon={<Download />} onClick={onExport}>
            Export
          </Button>
          <Button
            variant="default"
            startIcon={<Check />}
            onClick={onSave}
            loading={isSaving}
            disabled={!isDirty || isSaving}
          >
            Save
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
