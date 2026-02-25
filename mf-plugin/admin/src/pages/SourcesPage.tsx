import { Box } from '@strapi/design-system';
import { SourceList } from '../components/sources/SourceList';
import { SubNav } from '../components/SubNav';

export function SourcesPage() {
  return (
    <Box background="neutral100">
      <SubNav />
      <Box padding={8}>
        <SourceList />
      </Box>
    </Box>
  );
}
