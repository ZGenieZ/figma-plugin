const SITE_KEY_MAP = {
  MARKET: 'MARKET',
  BEAUTY: 'BEAUTY',
} as const;

const PLUGIN_ACTION = {
  RANDOM_KURLY_PRODUCT_CARD: 'randomKurlyProductCard',
  VALIDATE_NODE_SELECTED: 'validateNodeSelected',
} as const;

const NODE_NAME_MAP = {
  PRODUCT_CARD_NODE: 'prdCard',
  PRODUCT_IMAGE_NODE: 'prdImage',
  PRODUCT_NAME_NODE: 'prdName',
} as const;

export { SITE_KEY_MAP, PLUGIN_ACTION, NODE_NAME_MAP };
