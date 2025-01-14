import React, { useCallback, useState } from 'react';

import type { ProductType, SiteKey } from '@/shared/types';
import {
  PLUGIN_ACTION,
  PRODUCT_TYPE_MAP,
  SITE_KEY_MAP,
} from '@/shared/constants';
import { requestToPlugin } from '@/shared/lib/figma/message';
import { Loading } from '@/shared/componenets';
import fruitIcon from '@/public/images/fruit_icon.png';
import skinIcon from '@/public/images/skin_icon.png';
import infoIcon from '@/public/images/info_icon.svg';
import { getKurlyProductList } from '@/ui/api';
import './index.css';

const SITE_KEY_LIST = [SITE_KEY_MAP.MARKET, SITE_KEY_MAP.BEAUTY];

function App() {
  const [site, setSite] = useState<SiteKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [productType, setProductType] = useState<ProductType | null>(null);

  const getSearchKeyword = useCallback(
    (key: SiteKey) => (key === SITE_KEY_MAP.MARKET ? '과일' : '스킨'),
    [],
  );

  const validateHandleSearch = useCallback(
    (type: ProductType, key?: SiteKey) => () => {
      setSite(key ?? null);
      setProductType(type);
      requestToPlugin({
        type: PLUGIN_ACTION.VALIDATE_NODE_SELECTED,
      });
    },
    [],
  );

  const handleSearch = useCallback(
    async (type: ProductType) => {
      setIsLoading(true);
      const randomIndex = Math.random() < 0.5 ? 0 : 1;
      const randomSiteKey = site ? null : SITE_KEY_LIST[randomIndex];

      try {
        const result = await getKurlyProductList(
          randomSiteKey ?? site,
          randomSiteKey
            ? getSearchKeyword(randomSiteKey)
            : getSearchKeyword(site),
          type === PRODUCT_TYPE_MAP.BEST_COLLECTION,
        );

        if (!result) {
          return;
        }

        const { type: dataType, data } = result;

        let randomProductList = [];

        if (dataType === PRODUCT_TYPE_MAP.SEARCH) {
          randomProductList = data
            .map(({ name, productVerticalMediumUrl }) => ({
              name,
              imageUrl: productVerticalMediumUrl,
            }))
            .sort(() => Math.random() - 0.5);
        }

        if (dataType === PRODUCT_TYPE_MAP.BEST_COLLECTION) {
          randomProductList = data
            .map(({ name, product_vertical_medium_url }) => ({
              name,
              imageUrl: product_vertical_medium_url,
            }))
            .sort(() => Math.random() - 0.5);
        }

        if (randomProductList.length === 0) {
          return;
        }

        requestToPlugin<{
          randomProductList: { name: string; imageUrl: string }[];
        }>({
          type: PLUGIN_ACTION.RANDOM_KURLY_PRODUCT_CARD,
          data: { randomProductList },
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
        setSite(null);
      }
    },
    [site],
  );

  window.onmessage = ({
    data: {
      pluginMessage: {
        type,
        data: { success },
      },
    },
    // eslint-disable-next-line consistent-return
  }) => {
    if (type === PLUGIN_ACTION.VALIDATE_NODE_SELECTED) {
      if (success) {
        return handleSearch(productType);
      }
      setSite(null);
      setProductType(null);
    }
  };

  return (
    <div className="flex flex-col justify-between h-full px-[16px] pb-[12px]">
      <main>
        <div className="flex gap-[8px] px-[16px] py-[12px] bg-kurly_gray_4 mx-[-32px] translate-x-[16px]">
          <img src={infoIcon} alt="정보_아이콘" />
          <div className="flex justify-center items-center text-kurly_gray_5 text-[12px]">
            레이어명: 부모프레임&nbsp;
            <span className="text-kurly_gray_5 font-semibold">prdCard</span>
            &nbsp;· 상품이미지&nbsp;
            <span className="text-kurly_gray_5 font-semibold">prdImage</span>
            &nbsp;· 상품명&nbsp;
            <span className="text-kurly_gray_5 font-semibold">prdName</span>
          </div>
        </div>
        <div className="flex flex-col gap-[16px] mt-[20px]">
          <button
            className={`py-[14px] w-full rounded-[10px] ${
              isLoading
                ? 'bg-kurly_purple2 text-kurly_purple3'
                : 'bg-kurly_purple1 text-white'
            }`}
            type="submit"
            onClick={validateHandleSearch(
              PRODUCT_TYPE_MAP.BEST_COLLECTION,
              SITE_KEY_MAP.MARKET,
            )}
            disabled={isLoading}
          >
            <span className="font-semibold">랜덤으로 삽입하기</span>
          </button>
          <div className="flex gap-[12px]">
            <button
              className={`flex justify-center items-center border border-kurly_gray_1 rounded-[12px] w-full h-[125px] ${
                !isLoading && 'hover:bg-kurly_gray_4'
              }`}
              type="button"
              onClick={validateHandleSearch(
                PRODUCT_TYPE_MAP.SEARCH,
                SITE_KEY_MAP.MARKET,
              )}
              disabled={isLoading}
            >
              {site === SITE_KEY_MAP.MARKET &&
              productType === PRODUCT_TYPE_MAP.SEARCH &&
              isLoading ? (
                <div className="flex flex-col gap-[8px]">
                  <div className="h-[40px] flex items-center">
                    <Loading />
                  </div>
                  <span className="text-kurly_gray_6 font-semibold leading-[20px]">
                    과일
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-[8px]">
                  <img
                    className={`w-[40px] ${isLoading && 'opacity-30'}`}
                    src={fruitIcon}
                    alt="과일_아이콘"
                  />
                  <span
                    className={`font-semibold leading-[20px] ${
                      isLoading ? 'text-kurly_gray_6' : 'text-kurly_black_1'
                    }`}
                  >
                    과일
                  </span>
                </div>
              )}
            </button>
            <button
              type="button"
              className={`flex justify-center items-center  border border-kurly_gray_1 rounded-[12px] w-full h-[125px]  ${
                !isLoading && 'hover:bg-kurly_gray_4'
              }`}
              onClick={validateHandleSearch(
                PRODUCT_TYPE_MAP.SEARCH,
                SITE_KEY_MAP.BEAUTY,
              )}
              disabled={isLoading}
            >
              {site === SITE_KEY_MAP.BEAUTY &&
              productType === PRODUCT_TYPE_MAP.SEARCH &&
              isLoading ? (
                <div className="flex flex-col gap-[8px]">
                  <div className="h-[40px] flex items-center">
                    <Loading />
                  </div>
                  <span className="text-kurly_gray_6 font-semibold leading-[20px]">
                    스킨
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-[8px]">
                  <img
                    className={`w-[40px] ${isLoading && 'opacity-30'}`}
                    src={skinIcon}
                    alt="스킨_아이콘"
                  />
                  <span
                    className={`font-semibold leading-[20px] ${
                      isLoading ? 'text-kurly_gray_6' : 'text-kurly_black_1'
                    }`}
                  >
                    스킨
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>
      </main>
      <footer className="flex justify-between pt-[12px] border-t border-kurly_gray_3">
        <span className="text-kurly_gray_2 text-[12px]">
          문의 Yang Hwasu · Lee Jinhee
        </span>
        <a
          className="text-[#2177D3] text-[12px] hover:underline underline-offset-2"
          href="https://forms.gle/LxQxoFL18crUTgqT7"
          target="_blank"
          rel="noreferrer"
        >
          의견 보내기
        </a>
      </footer>
    </div>
  );
}

export default App;
