import axios from 'axios';

import type { SiteKey } from '@/shared/types';
import { SITE_KEY_MAP } from '@/shared/constants';

const kurlyRequest = axios.create({
  baseURL: 'https://figma-api.kurly.services',
});

const getKurlyProductList = async (
  site: SiteKey,
  categoryId: number,
  isBestCollection: boolean,
) => {
  const { data } = await kurlyRequest.get('/figma-kard', {
    params: {
      site:
        site === SITE_KEY_MAP.MARKET
          ? SITE_KEY_MAP.MARKET.toLowerCase()
          : SITE_KEY_MAP.BEAUTY.toLowerCase(),
      ...(!isBestCollection && { categoryId }),
      isBestCollection,
    },
  });
  return data;
};

export { getKurlyProductList };
