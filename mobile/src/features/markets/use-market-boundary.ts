import { useEffect, useState } from 'react';

import type {
  MarketBoundaryRepository,
} from './repositories/market-boundary-repository';

import type {
  MarketBoundary,
} from './types';


type UseMarketBoundaryOptions = {
  regionCode?: string;
};


type MarketBoundaryState = {
  boundary: MarketBoundary | null;
  error: string | null;
  isLoading: boolean;
};


export function useMarketBoundary(
  repository: MarketBoundaryRepository,
  options?: UseMarketBoundaryOptions,
): MarketBoundaryState {
  const [boundary, setBoundary] =
    useState<MarketBoundary | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const regionCode =
    options?.regionCode;


  useEffect(() => {
    let isActive = true;


    async function loadBoundary() {
      try {
        const markets =
          await repository.listMarkets({
            regionCode,
          });


        const firstMarket =
          markets[0];


        if (!firstMarket) {
          throw new Error(
            '등록된 전통시장 경계가 없습니다.',
          );
        }


        const loadedBoundary =
          await repository.getBoundary(
            firstMarket.id,
          );


        if (!loadedBoundary) {
          throw new Error(
            '전통시장 경계를 불러올 수 없습니다.',
          );
        }


        if (isActive) {
          setBoundary(
            loadedBoundary,
          );
        }
      } catch (loadError) {
        console.error(
          '전통시장 경계 불러오기 실패:',
          loadError,
        );


        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : '전통시장 경계를 불러올 수 없습니다.',
          );
        }
      }
    }


    loadBoundary();


    return () => {
      isActive = false;
    };
  }, [
    regionCode,
    repository,
  ]);


  return {
    boundary,
    error,
    isLoading:
      !boundary && !error,
  };
}
