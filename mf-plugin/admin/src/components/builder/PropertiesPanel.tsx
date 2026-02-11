import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Typography,
  TextInput,
  Textarea,
  Toggle,
  Button,
  Field,
  Divider,
  Badge,
  IconButton,
} from '@strapi/design-system';
import { PuzzlePiece, ChevronUp, ChevronDown } from '@strapi/icons';
import type { LayoutItem, ComponentWithSource, ComponentProp } from '../../types';

interface PropertiesPanelProps {
  item: LayoutItem | null;
  component: ComponentWithSource | undefined;
  selectedCount: number;
  onUpdateItem: (id: string, updates: Partial<LayoutItem>) => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

interface PropEditorProps {
  name: string;
  value: unknown;
  propDef: ComponentProp | null;
  onChange: (name: string, value: unknown) => void;
}

function PropEditor({ name, value, propDef, onChange }: PropEditorProps) {
  const type = propDef?.type || 'string';

  if (type === 'boolean') {
    return (
      <Field.Root>
        <Field.Label>{name}</Field.Label>
        <Toggle checked={Boolean(value)} onChange={() => onChange(name, !value)} />
        {propDef?.description && <Field.Hint>{propDef.description}</Field.Hint>}
      </Field.Root>
    );
  }

  if (type === 'number') {
    return (
      <Field.Root>
        <Field.Label>{name}</Field.Label>
        <TextInput
          type="number"
          value={(value as number) || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(name, parseFloat(e.target.value) || 0)
          }
          size="S"
        />
        {propDef?.description && <Field.Hint>{propDef.description}</Field.Hint>}
      </Field.Root>
    );
  }

  if (type === 'enum' && propDef?.options) {
    return (
      <Field.Root>
        <Field.Label>{name}</Field.Label>
        <select
          value={(value as string) || ''}
          onChange={(e) => onChange(name, e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #dcdce4',
            fontSize: '14px',
            background: '#ffffff',
          }}
        >
          <option value="">Select...</option>
          {propDef.options.map((opt) => (
            <option key={String(opt)} value={String(opt)}>
              {String(opt)}
            </option>
          ))}
        </select>
        {propDef?.description && <Field.Hint>{propDef.description}</Field.Hint>}
      </Field.Root>
    );
  }

  // Default: string input
  return (
    <Field.Root>
      <Field.Label>{name}</Field.Label>
      <TextInput
        value={(value as string) || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(name, e.target.value)}
        size="S"
      />
      {propDef?.description && <Field.Hint>{propDef.description}</Field.Hint>}
    </Field.Root>
  );
}

function JsonEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}) {
  const [jsonString, setJsonString] = useState(JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setJsonString(JSON.stringify(value, null, 2));
    setError(null);
  }, [value]);

  const handleBlur = () => {
    try {
      const parsed = JSON.parse(jsonString);
      setError(null);
      onChange(parsed);
    } catch (e) {
      setError('Invalid JSON');
    }
  };

  return (
    <Field.Root>
      <Field.Label>Props (JSON)</Field.Label>
      <Textarea
        value={jsonString}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJsonString(e.target.value)}
        onBlur={handleBlur}
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
          fontSize: '12px',
          minHeight: '160px',
        }}
      />
      {error && <Field.Error>{error}</Field.Error>}
      <Field.Hint>Edit component props as JSON</Field.Hint>
    </Field.Root>
  );
}

export function PropertiesPanel({
  item,
  component,
  selectedCount,
  onUpdateItem,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
}: PropertiesPanelProps) {
  const [useJsonEditor, setUseJsonEditor] = useState(false);

  if (!item) {
    return (
      <Box padding={4} style={{ textAlign: 'center' }}>
        <Box
          style={{
            width: '48px',
            height: '48px',
            margin: '24px auto 12px',
            background: '#f0f0f5',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PuzzlePiece width={24} height={24} fill="#a5a5ba" />
        </Box>
        <Typography variant="pi" textColor="neutral500">
          Select a component on the canvas to edit its properties
        </Typography>
      </Box>
    );
  }

  // Show multi-select message when more than one item is selected
  if (selectedCount > 1) {
    return (
      <Box padding={4} style={{ textAlign: 'center' }}>
        <Box
          style={{
            width: '48px',
            height: '48px',
            margin: '24px auto 12px',
            background: '#e0e0ff',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PuzzlePiece width={24} height={24} fill="#4945ff" />
        </Box>
        <Typography variant="omega" fontWeight="bold" textColor="primary700">
          {selectedCount} items selected
        </Typography>
        <Box marginTop={2}>
          <Typography variant="pi" textColor="neutral500">
            Use keyboard shortcuts or toolbar to manage multiple items
          </Typography>
        </Box>
        <Box marginTop={4}>
          <Typography
            variant="sigma"
            textColor="neutral600"
            textTransform="uppercase"
            style={{ marginBottom: '12px', display: 'block' }}
          >
            Layer Order
          </Typography>
          <Flex gap={2} justifyContent="center">
            <Button variant="tertiary" size="S" onClick={onBringToFront}>
              Bring to Front
            </Button>
            <Button variant="tertiary" size="S" onClick={onSendToBack}>
              Send to Back
            </Button>
          </Flex>
        </Box>
      </Box>
    );
  }

  const propDefs = component?.props || {};
  const hasKnownProps = Object.keys(propDefs).length > 0;

  const handlePropChange = (name: string, value: unknown) => {
    onUpdateItem(item.id, {
      props: {
        ...item.props,
        [name]: value,
      },
    });
  };

  const handleJsonChange = (newProps: Record<string, unknown>) => {
    onUpdateItem(item.id, { props: newProps });
  };

  const handleGridChange = (field: 'gridColumn' | 'gridRow', value: string) => {
    onUpdateItem(item.id, { [field]: value });
  };

  return (
    <Box padding={3}>
      {/* Component Info */}
      {component && (
        <Box
          marginBottom={4}
          padding={3}
          background="primary100"
          hasRadius
          style={{ border: '1px solid #d9d8ff' }}
        >
          <Flex gap={2} alignItems="center" marginBottom={1}>
            <Box
              style={{
                width: '28px',
                height: '28px',
                background: '#4945ff',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PuzzlePiece width={14} height={14} fill="#ffffff" />
            </Box>
            <Typography variant="omega" fontWeight="bold" textColor="primary700">
              {component.displayName}
            </Typography>
          </Flex>
          <Typography variant="pi" textColor="neutral600">
            {component.sourceName}
          </Typography>
        </Box>
      )}

      {/* Grid Position */}
      <Box marginBottom={4}>
        <Typography variant="sigma" textColor="neutral600" textTransform="uppercase">
          Size & Position
        </Typography>

        {/* Quick size presets */}
        <Box marginTop={2} marginBottom={3}>
          <Typography
            variant="pi"
            textColor="neutral500"
            style={{ marginBottom: '8px', display: 'block' }}
          >
            Quick sizes (columns)
          </Typography>
          <Flex gap={1} wrap="wrap">
            {[
              { label: 'Full', span: 12 },
              { label: '1/2', span: 6 },
              { label: '1/3', span: 4 },
              { label: '1/4', span: 3 },
              { label: '2/3', span: 8 },
              { label: '3/4', span: 9 },
            ].map(({ label, span }) => (
              <Button
                key={span}
                variant="tertiary"
                size="S"
                onClick={() => handleGridChange('gridColumn', `1 / span ${span}`)}
                style={{
                  padding: '4px 10px',
                  minWidth: 'auto',
                  fontSize: '12px',
                }}
              >
                {label}
              </Button>
            ))}
          </Flex>
        </Box>

        {/* Row height presets */}
        <Box marginBottom={3}>
          <Typography
            variant="pi"
            textColor="neutral500"
            style={{ marginBottom: '8px', display: 'block' }}
          >
            Height (rows)
          </Typography>
          <Flex gap={1}>
            {[1, 2, 3, 4].map((rows) => (
              <Button
                key={rows}
                variant="tertiary"
                size="S"
                onClick={() => handleGridChange('gridRow', `auto / span ${rows}`)}
                style={{
                  padding: '4px 10px',
                  minWidth: 'auto',
                  fontSize: '12px',
                }}
              >
                {rows}
              </Button>
            ))}
          </Flex>
        </Box>

        {/* Manual input */}
        <Box marginTop={2}>
          <Flex gap={2}>
            <Box style={{ flex: 1 }}>
              <Field.Root>
                <Field.Label>Column</Field.Label>
                <TextInput
                  value={item.gridColumn}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleGridChange('gridColumn', e.target.value)
                  }
                  placeholder="1 / span 6"
                  size="S"
                />
              </Field.Root>
            </Box>
            <Box style={{ flex: 1 }}>
              <Field.Root>
                <Field.Label>Row</Field.Label>
                <TextInput
                  value={item.gridRow}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleGridChange('gridRow', e.target.value)
                  }
                  placeholder="1 / span 2"
                  size="S"
                />
              </Field.Root>
            </Box>
          </Flex>
        </Box>
      </Box>

      <Divider />

      {/* Layer Order */}
      <Box marginTop={4} marginBottom={4}>
        <Typography variant="sigma" textColor="neutral600" textTransform="uppercase">
          Layer Order
        </Typography>
        <Box marginTop={2}>
          <Flex gap={2} wrap="wrap">
            <Button variant="tertiary" size="S" onClick={onBringToFront} style={{ flex: 1 }}>
              <Flex gap={1} alignItems="center">
                <ChevronUp width={12} height={12} />
                <ChevronUp width={12} height={12} style={{ marginLeft: '-8px' }} />
                <span>Front</span>
              </Flex>
            </Button>
            <Button variant="tertiary" size="S" onClick={onBringForward} style={{ flex: 1 }}>
              <Flex gap={1} alignItems="center">
                <ChevronUp width={12} height={12} />
                <span>Forward</span>
              </Flex>
            </Button>
          </Flex>
          <Flex gap={2} wrap="wrap" marginTop={1}>
            <Button variant="tertiary" size="S" onClick={onSendToBack} style={{ flex: 1 }}>
              <Flex gap={1} alignItems="center">
                <ChevronDown width={12} height={12} />
                <ChevronDown width={12} height={12} style={{ marginLeft: '-8px' }} />
                <span>Back</span>
              </Flex>
            </Button>
            <Button variant="tertiary" size="S" onClick={onSendBackward} style={{ flex: 1 }}>
              <Flex gap={1} alignItems="center">
                <ChevronDown width={12} height={12} />
                <span>Backward</span>
              </Flex>
            </Button>
          </Flex>
        </Box>
      </Box>

      <Divider />

      {/* Component Props */}
      <Box marginTop={4}>
        <Flex justifyContent="space-between" alignItems="center" marginBottom={3}>
          <Typography variant="sigma" textColor="neutral600" textTransform="uppercase">
            Component Props
          </Typography>
          <Button
            variant="ghost"
            size="S"
            onClick={() => setUseJsonEditor(!useJsonEditor)}
            style={{ padding: '4px 8px' }}
          >
            {useJsonEditor ? 'Form' : 'JSON'}
          </Button>
        </Flex>

        {useJsonEditor || !hasKnownProps ? (
          <JsonEditor value={item.props} onChange={handleJsonChange} />
        ) : (
          <Flex direction="column" gap={3}>
            {Object.entries(propDefs).map(([propName, propDef]) => (
              <PropEditor
                key={propName}
                name={propName}
                value={item.props[propName]}
                propDef={propDef}
                onChange={handlePropChange}
              />
            ))}
          </Flex>
        )}

        {!hasKnownProps && !useJsonEditor && (
          <Box marginTop={2}>
            <Badge size="S" backgroundColor="warning100" textColor="warning700">
              No props schema available
            </Badge>
          </Box>
        )}
      </Box>
    </Box>
  );
}
