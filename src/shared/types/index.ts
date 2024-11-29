import { PLUGIN_ACTION, PRODUCT_TYPE_MAP, SITE_KEY_MAP } from '../constants';

type SiteKey = keyof typeof SITE_KEY_MAP;

type ProductType = keyof typeof PRODUCT_TYPE_MAP;

type PluginAction = typeof PLUGIN_ACTION[keyof typeof PLUGIN_ACTION];

type PluginMessage<T> = {
  type: PluginAction;
  data?: T;
};

export { SiteKey, ProductType, PluginMessage };
