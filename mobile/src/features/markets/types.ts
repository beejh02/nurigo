export type Coordinate = {
  latitude: number;
  longitude: number;
};


export type SavedMarketPolygon = {
  id: string;
  name: string;
  createdAt: string;
  points: Coordinate[];
};


export type PolygonBoundaryGeometry = {
  type: 'Polygon';
  rings: Coordinate[][];
};


export type MultiPolygonBoundaryGeometry = {
  type: 'MultiPolygon';
  polygons: Coordinate[][][];
};


export type MarketBoundaryGeometry =
  | PolygonBoundaryGeometry
  | MultiPolygonBoundaryGeometry;


export type MarketBoundary = {
  marketId: string;
  name: string;
  regionCode: string;
  revision: number;
  geometry: MarketBoundaryGeometry;
};


export type MarketSummary = {
  id: string;
  name: string;
  regionCode: string;
  boundaryRevision: number;
};
