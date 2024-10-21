const SITE_KEY_MAP = {
  MARKET: 'MARKET',
  BEAUTY: 'BEAUTY',
} as const;

const PLUGIN_ACTION = {
  RANDOM_KURLY_PRODUCT_IMAGE: 'randomKurlyProductImage',
  VALIDATE_NODE_SELECTED: 'validateNodeSelected',
} as const;

export { SITE_KEY_MAP, PLUGIN_ACTION };
