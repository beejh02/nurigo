import type {
  MarketBoundary,
  MarketSummary,
} from '../types';


export type ListMarketsOptions = {
  regionCode?: string;
};


export interface MarketBoundaryRepository {
  listMarkets(
    options?: ListMarketsOptions,
  ): Promise<MarketSummary[]>;

  getBoundary(
    marketId: string,
  ): Promise<MarketBoundary | null>;
}
