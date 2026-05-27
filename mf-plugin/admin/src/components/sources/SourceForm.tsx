import { useState, useEffect } from 'react';
import { Box, Button, TextInput, Field, Modal, Flex, Typography } from '@strapi/design-system';

interface SourceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; manifestUrl: string }) => Promise<void>;
  initialData?: { name: string; manifestUrl: string };
  isEditing?: boolean;
}

export function SourceForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}: SourceFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [manifestUrl, setManifestUrl] = useState(initialData?.manifestUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form state when initialData changes (fixes edit not prepopulating on first click)
  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setManifestUrl(initialData?.manifestUrl || '');
      setError(null);
    }
  }, [isOpen, initialData?.name, initialData?.manifestUrl]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!manifestUrl.trim()) {
      setError('Manifest URL is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onSubmit({ name: name.trim(), manifestUrl: manifestUrl.trim() });
      onClose();
      setName('');
      setManifestUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setName(initialData?.name || '');
    setManifestUrl(initialData?.manifestUrl || '');
    setError(null);
  };

  return (
    <Modal.Root open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
      <Modal.Content style={{ maxWidth: '680px', width: '100%' }}>
        <Modal.Header>
          <Typography variant="beta">{isEditing ? 'Edit MF Source' : 'Add MF Source'}</Typography>
        </Modal.Header>
        <Modal.Body>
          <Box style={{ width: '100%' }}>
            <Flex direction="column" gap={4} style={{ width: '100%' }}>
              {error && (
                <Box background="danger100" padding={3} hasRadius>
                  <Typography textColor="danger600">{error}</Typography>
                </Box>
              )}

              <Field.Root style={{ width: '100%' }}>
                <Field.Label>Name</Field.Label>
                <TextInput
                  placeholder="My Remote App"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  style={{ width: '100%' }}
                />
                <Field.Hint>A friendly name for this Module Federation source</Field.Hint>
              </Field.Root>

              <Field.Root style={{ width: '100%' }}>
                <Field.Label>Manifest URL</Field.Label>
                <TextInput
                  placeholder="https://example.com/mf-manifest.json"
                  value={manifestUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setManifestUrl(e.target.value)
                  }
                  style={{ width: '100%' }}
                />
                <Field.Hint>URL to the module-federation.json or mf-manifest.json file</Field.Hint>
              </Field.Root>
            </Flex>
          </Box>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClose} variant="tertiary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isLoading}>
            {isEditing ? 'Update' : 'Add Source'}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
