import { Page } from '@strapi/strapi/admin';
import { Routes, Route } from 'react-router-dom';
import { DesignSystemProvider } from '@strapi/design-system';

import { HomePage } from './HomePage';
import { LayoutsPage } from './LayoutsPage';
import { SourcesPage } from './SourcesPage';
import { BuilderPage } from './BuilderPage';

const App = () => {
  return (
    <DesignSystemProvider locale="en">
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="layouts" element={<LayoutsPage />} />
        <Route path="sources" element={<SourcesPage />} />
        <Route path="builder/:id" element={<BuilderPage />} />
        <Route path="*" element={<Page.Error />} />
      </Routes>
    </DesignSystemProvider>
  );
};

export { App };
