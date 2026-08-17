import type {
  Coordinate,
  SubmittedMarketBoundaryDraft,
} from '../types';


export type CreateMarketBoundaryDraftInput = {
  marketName: string;
  regionCode: string;
  points: Coordinate[];
  adminToken: string;
};


export interface MarketBoundaryDraftWriter {
  createDraft(
    input: CreateMarketBoundaryDraftInput,
  ): Promise<SubmittedMarketBoundaryDraft>;
}
