import React, { useCallback, useMemo, useState } from 'react';

import './index.css';
import type { SiteKey } from '../shared/types';
import { getKurlySearchData } from './api';
import { SITE_KEY_MAP } from '../shared/constants';
import { requestToPlugin } from './lib/figma';
import { Loading } from '../shared/componenets/Loading/Loading';

function App() {
  const [site, setSite] = useState<SiteKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSubmitButtonDisabled = useMemo(
    () => site === null || isLoading,
    [site, isLoading],
  );

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getKurlySearchData(
        site,
        site === SITE_KEY_MAP.MARKET ? '과일' : '스킨',
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
  }, [site]);

  const handleClickSiteButton = useCallback(
    (value: SiteKey) => () => {
      setSite(value);
    },
    [],
  );

  return (
    <div className="flex flex-col justify-between  h-full pt-[24px] px-[12px] pb-[12px]">
      <main>
        <div className="flex flex-col gap-[16px]">
          <button
            className={`py-[14px] w-full rounded-[10px] ${
              isSubmitButtonDisabled
                ? 'bg-kurly_purple2 text-kurly_purple3'
                : 'bg-kurly_purple1 text-white'
            }`}
            type="submit"
            onClick={handleSearch}
            disabled={isSubmitButtonDisabled}
          >
            랜덤으로 삽입하기
          </button>
          <div className="flex gap-[12px]">
            <button
              className={`flex justify-center items-center ${
                site === SITE_KEY_MAP.MARKET ? 'bg-kurly_gray_4' : 'bg-white'
              } border border-kurly_gray rounded-[12px] w-full h-[125px] hover:bg-kurly_gray_4`}
              type="button"
              onClick={handleClickSiteButton(SITE_KEY_MAP.MARKET)}
              disabled={isLoading}
            >
              {site === SITE_KEY_MAP.MARKET && isLoading ? (
                <div className="flex flex-col gap-[20px]">
                  <Loading />
                  <span>마켓</span>
                </div>
              ) : (
                '마켓'
              )}
            </button>
            <button
              className={`flex justify-center items-center ${
                site === SITE_KEY_MAP.BEAUTY ? 'bg-kurly_gray_4' : 'bg-white'
              } border border-kurly_gray rounded-[12px] w-full h-[125px] hover:bg-kurly_gray_4`}
              type="button"
              onClick={handleClickSiteButton(SITE_KEY_MAP.BEAUTY)}
              disabled={isLoading}
            >
              {site === SITE_KEY_MAP.BEAUTY && isLoading ? (
                <div className="flex flex-col gap-[20px]">
                  <Loading />
                  <span>뷰티</span>
                </div>
              ) : (
                '뷰티'
              )}
            </button>
          </div>
        </div>
      </main>
      <footer className="flex justify-between pt-[16px] border-t-2 border-kurly_gray_3">
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
