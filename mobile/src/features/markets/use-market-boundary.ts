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
  boundaries: MarketBoundary[];
  error: string | null;
  isLoading: boolean;
};


export function useMarketBoundary(
  repository: MarketBoundaryRepository,
  options?: UseMarketBoundaryOptions,
): MarketBoundaryState {
  const [boundaries, setBoundaries] =
    useState<MarketBoundary[]>([]);

  const [error, setError] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const regionCode =
    options?.regionCode;


  useEffect(() => {
    let isActive = true;


    async function loadBoundary() {
      setIsLoading(
        true,
      );

      setError(
        null,
      );


      try {
        const markets =
          await repository.listMarkets({
            regionCode,
          });


        const loadedBoundaries =
          await Promise.all(
            markets.map(
              async (market) => {
                const loadedBoundary =
                  await repository.getBoundary(
                    market.id,
                  );


                if (!loadedBoundary) {
                  throw new Error(
                    `${market.name} 경계를 불러올 수 없습니다.`,
                  );
                }


                return loadedBoundary;
              },
            ),
          );


        if (isActive) {
          setBoundaries(
            loadedBoundaries,
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
      } finally {
        if (isActive) {
          setIsLoading(
            false,
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
    boundaries,
    error,
    isLoading,
  };
}
