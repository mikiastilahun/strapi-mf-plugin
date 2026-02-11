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
  Card,
  CardBody,
} from '@strapi/design-system';
import { Trash, ArrowClockwise, Plus, Pencil } from '@strapi/icons';
import { useMFSources } from '../../hooks/useMFSources';
import { SourceForm } from './SourceForm';
import type { MFSource } from '../../types';

export function SourceList() {
  const { sources, isLoading, error, createSource, updateSource, refreshSource, deleteSource } =
    useMFSources();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<MFSource | null>(null);
  const [deletingSource, setDeletingSource] = useState<MFSource | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);

  const handleCreate = async (data: { name: string; manifestUrl: string }) => {
    await createSource(data);
  };

  const handleEdit = async (data: { name: string; manifestUrl: string }) => {
    if (editingSource) {
      await updateSource(editingSource.documentId, data);
      setEditingSource(null);
    }
  };

  const handleRefresh = async (source: MFSource) => {
    try {
      setIsRefreshing(source.documentId);
      await refreshSource(source.documentId);
    } finally {
      setIsRefreshing(null);
    }
  };

  const handleDelete = async () => {
    if (deletingSource) {
      await deleteSource(deletingSource.documentId);
      setDeletingSource(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="400px">
        <Loader>Loading sources...</Loader>
      </Flex>
    );
  }

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="flex-start" marginBottom={6}>
        <Box>
          <Typography variant="alpha" tag="h1">
            MF Sources
          </Typography>
          <Box marginTop={2}>
            <Typography variant="epsilon" textColor="neutral600">
              Manage your Module Federation remote sources
            </Typography>
          </Box>
        </Box>
        <Button startIcon={<Plus />} onClick={() => setIsFormOpen(true)}>
          Add Source
        </Button>
      </Flex>

      {error && (
        <Box background="danger100" padding={4} hasRadius marginBottom={4}>
          <Typography textColor="danger600">{error}</Typography>
        </Box>
      )}

      {sources.length === 0 ? (
        <Card>
          <CardBody>
            <Box padding={8} style={{ textAlign: 'center' }}>
              <Typography variant="delta" textColor="neutral600">
                No MF sources configured
              </Typography>
              <Box marginTop={2}>
                <Typography variant="epsilon" textColor="neutral500">
                  Add a Module Federation source to start building layouts
                </Typography>
              </Box>
              <Box marginTop={4}>
                <Button startIcon={<Plus />} onClick={() => setIsFormOpen(true)}>
                  Add Your First Source
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
                  <Typography variant="sigma">Manifest URL</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Components</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Last Fetched</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Status</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Actions</Typography>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {sources.map((source) => (
                <Tr key={source.documentId}>
                  <Td>
                    <Typography variant="omega" fontWeight="bold">
                      {source.name}
                    </Typography>
                  </Td>
                  <Td>
                    <Typography
                      variant="pi"
                      textColor="neutral600"
                      ellipsis
                      style={{ maxWidth: '300px', display: 'block' }}
                    >
                      {source.manifestUrl}
                    </Typography>
                  </Td>
                  <Td>
                    <Badge>{(source.components as unknown[])?.length || 0} components</Badge>
                  </Td>
                  <Td>
                    <Typography variant="pi" textColor="neutral500">
                      {formatDate(source.lastFetched)}
                    </Typography>
                  </Td>
                  <Td>
                    <Badge active={source.isActive}>
                      {source.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    <Flex gap={1}>
                      <IconButton
                        onClick={() => handleRefresh(source)}
                        label="Refresh"
                        disabled={isRefreshing === source.documentId}
                      >
                        {isRefreshing === source.documentId ? <Loader small /> : <ArrowClockwise />}
                      </IconButton>
                      <IconButton onClick={() => setEditingSource(source)} label="Edit">
                        <Pencil />
                      </IconButton>
                      <IconButton onClick={() => setDeletingSource(source)} label="Delete">
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

      {/* Add Source Modal */}
      <SourceForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Edit Source Modal */}
      <SourceForm
        isOpen={!!editingSource}
        onClose={() => setEditingSource(null)}
        onSubmit={handleEdit}
        initialData={
          editingSource
            ? { name: editingSource.name, manifestUrl: editingSource.manifestUrl }
            : undefined
        }
        isEditing
      />

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={!!deletingSource}
        onOpenChange={(open: boolean) => !open && setDeletingSource(null)}
      >
        <Dialog.Content>
          <Dialog.Header>Delete MF Source</Dialog.Header>
          <Dialog.Body>
            <Typography>
              Are you sure you want to delete "{deletingSource?.name}"? This action cannot be
              undone.
            </Typography>
          </Dialog.Body>
          <Dialog.Footer>
            <Button onClick={() => setDeletingSource(null)} variant="tertiary">
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
