import { Box, Flex, Typography, Button, Card, CardBody } from '@strapi/design-system';
import { Plus, PuzzlePiece, Layout } from '@strapi/icons';
import { Link } from 'react-router-dom';
import { useLayouts } from '../hooks/useLayouts';
import { useMFSources } from '../hooks/useMFSources';
import { PLUGIN_ID } from '../pluginId';

export function HomePage() {
  const { layouts, isLoading: isLayoutsLoading } = useLayouts();
  const { sources, isLoading: isSourcesLoading } = useMFSources();

  const recentLayouts = layouts.slice(0, 3);
  const activeSources = sources.filter((s) => s.isActive);
  const totalComponents = activeSources.reduce(
    (acc, source) => acc + ((source.components as unknown[])?.length || 0),
    0
  );

  return (
    <Box padding={8} background="neutral100">
      {/* Header */}
      <Flex justifyContent="space-between" alignItems="flex-start" marginBottom={6}>
        <Box>
          <Typography variant="alpha" tag="h1">
            Visual Page Builder
          </Typography>
          <Box marginTop={2}>
            <Typography variant="epsilon" textColor="neutral600">
              Build pages using Module Federation components
            </Typography>
          </Box>
        </Box>
        <Flex gap={2}>
          <Link to={`/plugins/${PLUGIN_ID}/sources`}>
            <Button variant="secondary" startIcon={<PuzzlePiece />}>
              Manage Sources
            </Button>
          </Link>
          <Link to={`/plugins/${PLUGIN_ID}/layouts`}>
            <Button startIcon={<Plus />}>Create Layout</Button>
          </Link>
        </Flex>
      </Flex>

      {/* Stats Cards */}
      <Flex gap={4} marginBottom={6}>
        <Box flex="1">
          <Card>
            <CardBody>
              <Box padding={4}>
                <Typography variant="pi" textColor="neutral600" tag="p">
                  Total Layouts
                </Typography>
                <Box marginTop={2}>
                  <Typography variant="alpha" tag="h2">
                    {isLayoutsLoading ? '...' : layouts.length}
                  </Typography>
                </Box>
              </Box>
            </CardBody>
          </Card>
        </Box>
        <Box flex="1">
          <Card>
            <CardBody>
              <Box padding={4}>
                <Typography variant="pi" textColor="neutral600" tag="p">
                  Active Sources
                </Typography>
                <Box marginTop={2}>
                  <Typography variant="alpha" tag="h2">
                    {isSourcesLoading ? '...' : activeSources.length}
                  </Typography>
                </Box>
              </Box>
            </CardBody>
          </Card>
        </Box>
        <Box flex="1">
          <Card>
            <CardBody>
              <Box padding={4}>
                <Typography variant="pi" textColor="neutral600" tag="p">
                  Available Components
                </Typography>
                <Box marginTop={2}>
                  <Typography variant="alpha" tag="h2">
                    {isSourcesLoading ? '...' : totalComponents}
                  </Typography>
                </Box>
              </Box>
            </CardBody>
          </Card>
        </Box>
      </Flex>

      {/* Quick Actions */}
      <Flex gap={6}>
        {/* Recent Layouts */}
        <Box flex="1">
          <Card>
            <CardBody>
              <Box padding={4}>
                <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
                  <Typography variant="delta" tag="h3">
                    Recent Layouts
                  </Typography>
                  <Link to={`/plugins/${PLUGIN_ID}/layouts`}>
                    <Button variant="ghost" size="S">
                      View All
                    </Button>
                  </Link>
                </Flex>

                {recentLayouts.length === 0 ? (
                  <Box
                    background="neutral100"
                    padding={6}
                    hasRadius
                    style={{ textAlign: 'center' }}
                  >
                    <Layout width={32} height={32} fill="neutral500" />
                    <Box marginTop={2}>
                      <Typography variant="omega" textColor="neutral600">
                        No layouts yet
                      </Typography>
                    </Box>
                    <Box marginTop={3}>
                      <Link to={`/plugins/${PLUGIN_ID}/layouts`}>
                        <Button variant="secondary" size="S" startIcon={<Plus />}>
                          Create Layout
                        </Button>
                      </Link>
                    </Box>
                  </Box>
                ) : (
                  <Flex direction="column" gap={2}>
                    {recentLayouts.map((layout) => (
                      <Link
                        key={layout.documentId}
                        to={`/plugins/${PLUGIN_ID}/builder/${layout.documentId}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <Box
                          padding={3}
                          background="neutral100"
                          hasRadius
                          style={{ cursor: 'pointer' }}
                        >
                          <Typography variant="omega" fontWeight="bold" textColor="neutral800">
                            {layout.name}
                          </Typography>
                          <Box marginTop={1}>
                            <Typography variant="pi" textColor="neutral500">
                              /{layout.slug} - {layout.layout?.items?.length || 0} components
                            </Typography>
                          </Box>
                        </Box>
                      </Link>
                    ))}
                  </Flex>
                )}
              </Box>
            </CardBody>
          </Card>
        </Box>

        {/* MF Sources */}
        <Box flex="1">
          <Card>
            <CardBody>
              <Box padding={4}>
                <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
                  <Typography variant="delta" tag="h3">
                    Module Federation Sources
                  </Typography>
                  <Link to={`/plugins/${PLUGIN_ID}/sources`}>
                    <Button variant="ghost" size="S">
                      Manage
                    </Button>
                  </Link>
                </Flex>

                {activeSources.length === 0 ? (
                  <Box
                    background="neutral100"
                    padding={6}
                    hasRadius
                    style={{ textAlign: 'center' }}
                  >
                    <PuzzlePiece width={32} height={32} fill="neutral500" />
                    <Box marginTop={2}>
                      <Typography variant="omega" textColor="neutral600">
                        No sources configured
                      </Typography>
                    </Box>
                    <Box marginTop={3}>
                      <Link to={`/plugins/${PLUGIN_ID}/sources`}>
                        <Button variant="secondary" size="S" startIcon={<Plus />}>
                          Add Source
                        </Button>
                      </Link>
                    </Box>
                  </Box>
                ) : (
                  <Flex direction="column" gap={2}>
                    {activeSources.slice(0, 3).map((source) => (
                      <Box key={source.documentId} padding={3} background="neutral100" hasRadius>
                        <Typography variant="omega" fontWeight="bold" textColor="neutral800">
                          {source.name}
                        </Typography>
                        <Box marginTop={1}>
                          <Typography variant="pi" textColor="neutral500">
                            {(source.components as unknown[])?.length || 0} components
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Flex>
                )}
              </Box>
            </CardBody>
          </Card>
        </Box>
      </Flex>
    </Box>
  );
}
