import React, { useCallback, useState } from 'react';

import './index.css';
import type { SiteKey } from '../shared/types';
import { getKurlySearchData } from './api';
import { SITE_KEY_MAP } from '../shared/constants';
import { requestToPlugin } from './lib/figma';
import { Loading } from '../shared/componenets/Loading/Loading';
import marketIcon from '../../public/images/market_icon.jpg';
import beautyIcon from '../../public/images/beauty_icon.jpg';

const SITE_KEY_LIST = [SITE_KEY_MAP.MARKET, SITE_KEY_MAP.BEAUTY];

function App() {
  const [site, setSite] = useState<SiteKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getSearchKeyword = useCallback(
    (key: SiteKey) => (key === SITE_KEY_MAP.MARKET ? '과일' : '스킨'),
    [],
  );

  const handleSearch = useCallback(
    (key?: SiteKey) => async () => {
      const randomIndex = Math.random() < 0.5 ? 0 : 1;
      setIsLoading(true);
      setSite(key ?? null);
      try {
        const randomSiteKey = key ? null : SITE_KEY_LIST[randomIndex];
        const result = await getKurlySearchData(
          randomSiteKey ?? key,
          randomSiteKey
            ? getSearchKeyword(randomSiteKey)
            : getSearchKeyword(key),
        );

        if (!result) {
          return;
        }

        const randomProductImageList = result.data.listSections[0].data.items
          .map((product) => product.productVerticalMediumUrl)
          .sort(() => Math.random() - 0.5);

        requestToPlugin<any>({
          type: 'randomKurlyProductImage',
          data: randomProductImageList,
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

  return (
    <div className="flex flex-col justify-between  h-full pt-[24px] px-[12px] pb-[12px]">
      <main>
        <div className="flex flex-col gap-[16px]">
          <button
            className={`py-[14px] w-full rounded-[10px] ${
              isLoading
                ? 'bg-kurly_purple2 text-kurly_purple3'
                : 'bg-kurly_purple1 text-white'
            }`}
            type="submit"
            onClick={handleSearch()}
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
              onClick={handleSearch(SITE_KEY_MAP.MARKET)}
              disabled={isLoading}
            >
              {site === SITE_KEY_MAP.MARKET && isLoading ? (
                <div className="flex flex-col gap-[8px]">
                  <div className="h-[40px] flex items-center">
                    <Loading />
                  </div>
                  <span className="text-gray-400 font-semibold leading-[20px]">
                    마켓
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-[8px]">
                  <img
                    className={`w-[40px] ${isLoading && 'opacity-30'}`}
                    src={marketIcon}
                    alt="마켓_아이콘"
                  />
                  <span
                    className={`${
                      isLoading && 'text-gray-400'
                    } font-semibold leading-[20px]`}
                  >
                    마켓
                  </span>
                </div>
              )}
            </button>
            <button
              type="button"
              className={`flex justify-center items-center  border border-kurly_gray_1 rounded-[12px] w-full h-[125px]  ${
                !isLoading && 'hover:bg-kurly_gray_4'
              }`}
              onClick={handleSearch(SITE_KEY_MAP.BEAUTY)}
              disabled={isLoading}
            >
              {site === SITE_KEY_MAP.BEAUTY && isLoading ? (
                <div className="flex flex-col gap-[8px]">
                  <div className="h-[40px] flex items-center">
                    <Loading />
                  </div>
                  <span className="text-gray-400 font-semibold leading-[20px]">
                    뷰티
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-[8px]">
                  <img
                    className={`w-[40px] ${isLoading && 'opacity-30'}`}
                    src={beautyIcon}
                    alt="뷰티_아이콘"
                  />
                  <span
                    className={`${
                      isLoading && 'text-gray-400'
                    } font-semibold leading-[20px]`}
                  >
                    뷰티
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>
      </main>
      <footer className="flex justify-between pt-[16px] border-t border-kurly_gray_3">
        <div className="text-kurly_gray_2 text-[12px]">
          문의 Yang Hwasu · Lee Jinhee
        </div>
        <a
          className="text-kurly_gray_2 text-[12px] hover:underline underline-offset-2"
          href="https://www.kurly.com"
          target="_blank"
          rel="noreferrer"
        >
          컬리몰
        </a>
      </footer>
    </div>
  );
}

export default App;
