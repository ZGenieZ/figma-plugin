import { PLUGIN_ACTION, SITE_KEY_MAP } from '../constants';

type SiteKey = keyof typeof SITE_KEY_MAP;

type PluginAction = typeof PLUGIN_ACTION[keyof typeof PLUGIN_ACTION];

type PluginMessage<T> = {
  type: PluginAction;
  data?: T;
};

export { SiteKey, PluginMessage };
