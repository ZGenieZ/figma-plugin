import { SITE_KEY_MAP } from '../constants';

type SiteKey = keyof typeof SITE_KEY_MAP;

type PluginAction = 'randomKurlyProductImage';

type PluginMessage<T> = {
  type: PluginAction;
  data: T;
};

export { SiteKey, PluginMessage };
