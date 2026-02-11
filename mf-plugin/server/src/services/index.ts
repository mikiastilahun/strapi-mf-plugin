import service from './service';
import manifest from './manifest';
import layout from './layout';
import componentRegistry from './component-registry';

const services: Record<string, unknown> = {
  service,
  manifest,
  layout,
  'component-registry': componentRegistry,
};

export default services;
