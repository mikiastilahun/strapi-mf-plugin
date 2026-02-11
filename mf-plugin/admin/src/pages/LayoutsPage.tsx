import { useState } from 'react';
import {
  Box,
  Flex,
  Typography,
  Button,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Loader,
  Dialog,
  Modal,
  TextInput,
  Textarea,
  Field,
  Card,
  CardBody,
} from '@strapi/design-system';
import { Trash, Plus, Pencil, Download } from '@strapi/icons';
import { useNavigate } from 'react-router-dom';
import { useLayouts } from '../hooks/useLayouts';
import { PLUGIN_ID } from '../pluginId';
import type { PageLayoutRecord } from '../types';

export function LayoutsPage() {
  const navigate = useNavigate();
  const { layouts, isLoading, error, createLayout, deleteLayout, exportLayout } = useLayouts();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [newLayoutDesc, setNewLayoutDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingLayout, setDeletingLayout] = useState<PageLayoutRecord | null>(null);

  const handleCreate = async () => {
    if (!newLayoutName.trim()) {
      setCreateError('Name is required');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);
      const layout = await createLayout({
        name: newLayoutName.trim(),
        description: newLayoutDesc.trim() || undefined,
      });
      setIsCreateOpen(false);
      setNewLayoutName('');
      setNewLayoutDesc('');
      navigate(`/plugins/${PLUGIN_ID}/builder/${layout.documentId}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create layout');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (deletingLayout) {
      await deleteLayout(deletingLayout.documentId);
      setDeletingLayout(null);
    }
  };

  const handleExport = async (layout: PageLayoutRecord) => {
    try {
      const exported = await exportLayout(layout.documentId);
      const blob = new Blob([JSON.stringify(exported, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${layout.slug || layout.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="400px">
        <Loader>Loading layouts...</Loader>
      </Flex>
    );
  }

  return (
    <Box padding={8} background="neutral100">
      <Flex justifyContent="space-between" alignItems="flex-start" marginBottom={6}>
        <Box>
          <Typography variant="alpha" tag="h1">
            Page Layouts
          </Typography>
          <Box marginTop={2}>
            <Typography variant="epsilon" textColor="neutral600">
              Create and manage your page layouts
            </Typography>
          </Box>
        </Box>
        <Button startIcon={<Plus />} onClick={() => setIsCreateOpen(true)}>
          Create Layout
        </Button>
      </Flex>

      {error && (
        <Box background="danger100" padding={4} hasRadius marginBottom={4}>
          <Typography textColor="danger600">{error}</Typography>
        </Box>
      )}

      {layouts.length === 0 ? (
        <Card>
          <CardBody>
            <Box padding={8} style={{ textAlign: 'center' }}>
              <Typography variant="delta" textColor="neutral600">
                No layouts created yet
              </Typography>
              <Box marginTop={2}>
                <Typography variant="epsilon" textColor="neutral500">
                  Create your first layout to start building pages
                </Typography>
              </Box>
              <Box marginTop={4}>
                <Button startIcon={<Plus />} onClick={() => setIsCreateOpen(true)}>
                  Create Your First Layout
                </Button>
              </Box>
            </Box>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <Table>
            <Thead>
              <Tr>
                <Th>
                  <Typography variant="sigma">Name</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Slug</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Components</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Status</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Updated</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Actions</Typography>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {layouts.map((layout) => (
                <Tr
                  key={layout.documentId}
                  onClick={() => navigate(`/plugins/${PLUGIN_ID}/builder/${layout.documentId}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <Td>
                    <Box>
                      <Typography variant="omega" fontWeight="bold">
                        {layout.name}
                      </Typography>
                      {layout.description && (
                        <Box marginTop={1}>
                          <Typography variant="pi" textColor="neutral500">
                            {layout.description}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Td>
                  <Td>
                    <Typography variant="omega" textColor="neutral600">
                      /{layout.slug}
                    </Typography>
                  </Td>
                  <Td>
                    <Badge>{layout.layout?.items?.length || 0} items</Badge>
                  </Td>
                  <Td>
                    <Badge active={layout.isPublished}>
                      {layout.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </Td>
                  <Td>
                    <Typography variant="pi" textColor="neutral500">
                      {formatDate(layout.updatedAt)}
                    </Typography>
                  </Td>
                  <Td>
                    <Flex gap={1} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <IconButton
                        onClick={() =>
                          navigate(`/plugins/${PLUGIN_ID}/builder/${layout.documentId}`)
                        }
                        label="Edit"
                      >
                        <Pencil />
                      </IconButton>
                      <IconButton onClick={() => handleExport(layout)} label="Export">
                        <Download />
                      </IconButton>
                      <IconButton onClick={() => setDeletingLayout(layout)} label="Delete">
                        <Trash />
                      </IconButton>
                    </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* Create Layout Modal */}
      <Modal.Root
        open={isCreateOpen}
        onOpenChange={(open: boolean) => !open && setIsCreateOpen(false)}
      >
        <Modal.Content>
          <Modal.Header>
            <Typography variant="beta">Create New Layout</Typography>
          </Modal.Header>
          <Modal.Body>
            <Flex direction="column" gap={4}>
              {createError && (
                <Box background="danger100" padding={3} hasRadius>
                  <Typography textColor="danger600">{createError}</Typography>
                </Box>
              )}

              <Field.Root>
                <Field.Label>Name</Field.Label>
                <TextInput
                  placeholder="My Page Layout"
                  value={newLayoutName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewLayoutName(e.target.value)
                  }
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Description (optional)</Field.Label>
                <Textarea
                  placeholder="A brief description of this layout..."
                  value={newLayoutDesc}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewLayoutDesc(e.target.value)
                  }
                />
              </Field.Root>
            </Flex>
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={() => {
                setIsCreateOpen(false);
                setNewLayoutName('');
                setNewLayoutDesc('');
                setCreateError(null);
              }}
              variant="tertiary"
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={isCreating}>
              Create & Open Builder
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={!!deletingLayout}
        onOpenChange={(open: boolean) => !open && setDeletingLayout(null)}
      >
        <Dialog.Content>
          <Dialog.Header>Delete Layout</Dialog.Header>
          <Dialog.Body>
            <Typography>
              Are you sure you want to delete "{deletingLayout?.name}"? This action cannot be
              undone.
            </Typography>
          </Dialog.Body>
          <Dialog.Footer>
            <Button onClick={() => setDeletingLayout(null)} variant="tertiary">
              Cancel
            </Button>
            <Button onClick={handleDelete} variant="danger">
              Delete
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
}
