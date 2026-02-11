import { Box } from '@strapi/design-system';
import { SourceList } from '../components/sources/SourceList';

export function SourcesPage() {
  return (
    <Box padding={8} background="neutral100">
      <SourceList />
    </Box>
  );
}
