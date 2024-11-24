import axios from 'axios';

import { SiteKey } from '../../shared/types';
import { SITE_KEY_MAP } from '../../shared/constants';

// TODO: env 사용
const kurlyRequest = axios.create({
  baseURL: '',
});

const getKurlyProductList = async (
  site: SiteKey,
  keyword: string,
  isBestCollection: boolean,
) => {
  const { data } = await kurlyRequest.get('/searchKurlyProduct', {
    params: {
      site: site === SITE_KEY_MAP.MARKET ? 'market' : 'beauty',
      keyword,
      isBestCollection,
    },
  });

  return data;
};

export { getKurlyProductList };
