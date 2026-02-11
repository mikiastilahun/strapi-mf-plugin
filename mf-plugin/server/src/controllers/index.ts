import controller from './controller';
import mfSource from './mf-source';
import pageLayout from './page-layout';
import component from './component';

const controllers: Record<string, unknown> = {
  controller,
  'mf-source': mfSource,
  'page-layout': pageLayout,
  component,
};

export default controllers;
