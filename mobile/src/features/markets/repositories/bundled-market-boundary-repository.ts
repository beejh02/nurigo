import bundledMarketData
  from '../../../data/Daejeon_Jungang_Market.json';

import type {
  Coordinate,
  MarketBoundary,
  SavedMarketPolygon,
} from '../types';

import type {
  ListMarketsOptions,
  MarketBoundaryRepository,
} from './market-boundary-repository';


const REGION_CODE =
  'daejeon';


const legacyMarket =
  bundledMarketData as SavedMarketPolygon;


const boundary: MarketBoundary = {
  marketId:
    legacyMarket.id,

  name:
    legacyMarket.name,

  regionCode:
    REGION_CODE,

  revision:
    1,

  geometry: {
    type:
      'Polygon',

    rings: [
      legacyMarket.points.map(
        (point): Coordinate => ({
          latitude:
            point.latitude,

          longitude:
            point.longitude,
        }),
      ),
    ],
  },
};


export const bundledMarketBoundaryRepository:
  MarketBoundaryRepository = {
    async listMarkets(
      options?: ListMarketsOptions,
    ) {
      if (
        options?.regionCode
        && options.regionCode !== REGION_CODE
      ) {
        return [];
      }


      return [
        {
          id:
            boundary.marketId,

          name:
            boundary.name,

          regionCode:
            boundary.regionCode,

          boundaryRevision:
            boundary.revision,
        },
      ];
    },


    async getBoundary(
      marketId: string,
    ) {
      if (marketId !== boundary.marketId) {
        return null;
      }


      return boundary;
    },
  };
