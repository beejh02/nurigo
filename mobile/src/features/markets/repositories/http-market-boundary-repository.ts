import type {
  Coordinate,
  MarketBoundary,
  MarketBoundaryGeometry,
  MarketSummary,
} from '../types';

import {
  getNurigoApiBaseUrl,
} from './api-base-url';

import type {
  ListMarketsOptions,
  MarketBoundaryRepository,
} from './market-boundary-repository';


type ApiErrorResponse = {
  message?: unknown;
};


type MarketsResponse = {
  markets?: unknown;
};


type BoundaryFeatureResponse = {
  type?: unknown;
  properties?: unknown;
  geometry?: unknown;
};


function requireRecord(
  value: unknown,
  path: string,
): Record<string, unknown> {
  if (
    typeof value !== 'object'
    || value === null
    || Array.isArray(value)
  ) {
    throw new Error(
      `${path} 형식이 올바르지 않습니다.`,
    );
  }


  return value as Record<string, unknown>;
}


function requireString(
  value: unknown,
  path: string,
): string {
  if (
    typeof value !== 'string'
    || !value.trim()
  ) {
    throw new Error(
      `${path} 문자열이 필요합니다.`,
    );
  }


  return value;
}


function requireRevision(
  value: unknown,
  path: string,
): number {
  if (
    typeof value !== 'number'
    || !Number.isInteger(value)
    || value < 1
  ) {
    throw new Error(
      `${path}는 1 이상의 정수여야 합니다.`,
    );
  }


  return value;
}


function parsePosition(
  value: unknown,
  path: string,
): Coordinate {
  if (
    !Array.isArray(value)
    || value.length < 2
  ) {
    throw new Error(
      `${path}는 [longitude, latitude]여야 합니다.`,
    );
  }


  const longitude =
    value[0];

  const latitude =
    value[1];


  if (
    typeof longitude !== 'number'
    || !Number.isFinite(longitude)
    || longitude < -180
    || longitude > 180
    || typeof latitude !== 'number'
    || !Number.isFinite(latitude)
    || latitude < -90
    || latitude > 90
  ) {
    throw new Error(
      `${path} 좌표 범위가 올바르지 않습니다.`,
    );
  }


  return {
    latitude,
    longitude,
  };
}


function parseRing(
  value: unknown,
  path: string,
): Coordinate[] {
  if (
    !Array.isArray(value)
    || value.length < 4
  ) {
    throw new Error(
      `${path} LinearRing은 위치가 4개 이상이어야 합니다.`,
    );
  }


  return value.map(
    (position, positionIndex) =>
      parsePosition(
        position,
        `${path}[${positionIndex}]`,
      ),
  );
}


function parsePolygonCoordinates(
  value: unknown,
  path: string,
): Coordinate[][] {
  if (
    !Array.isArray(value)
    || value.length === 0
  ) {
    throw new Error(
      `${path} Polygon ring이 필요합니다.`,
    );
  }


  return value.map(
    (ring, ringIndex) =>
      parseRing(
        ring,
        `${path}[${ringIndex}]`,
      ),
  );
}


function parseGeometry(
  value: unknown,
): MarketBoundaryGeometry {
  const geometry =
    requireRecord(
      value,
      'geometry',
    );

  const type =
    geometry.type;


  if (type === 'Polygon') {
    return {
      type,
      rings:
        parsePolygonCoordinates(
          geometry.coordinates,
          'geometry.coordinates',
        ),
    };
  }


  if (type === 'MultiPolygon') {
    if (
      !Array.isArray(geometry.coordinates)
      || geometry.coordinates.length === 0
    ) {
      throw new Error(
        'geometry.coordinates MultiPolygon이 비어 있습니다.',
      );
    }


    return {
      type,
      polygons:
        geometry.coordinates.map(
          (polygon, polygonIndex) =>
            parsePolygonCoordinates(
              polygon,
              `geometry.coordinates[${polygonIndex}]`,
            ),
        ),
    };
  }


  throw new Error(
    '지원하지 않는 시장 경계 geometry입니다.',
  );
}


function parseMarketSummary(
  value: unknown,
  index: number,
): MarketSummary {
  const market =
    requireRecord(
      value,
      `markets[${index}]`,
    );


  return {
    id:
      requireString(
        market.id,
        `markets[${index}].id`,
      ),

    name:
      requireString(
        market.name,
        `markets[${index}].name`,
      ),

    regionCode:
      requireString(
        market.regionCode,
        `markets[${index}].regionCode`,
      ),

    boundaryRevision:
      requireRevision(
        market.boundaryRevision,
        `markets[${index}].boundaryRevision`,
      ),
  };
}


function parseBoundary(
  value: BoundaryFeatureResponse,
  requestedMarketId: string,
): MarketBoundary {
  if (value.type !== 'Feature') {
    throw new Error(
      '시장 경계 응답이 GeoJSON Feature가 아닙니다.',
    );
  }


  const properties =
    requireRecord(
      value.properties,
      'properties',
    );

  const marketId =
    requireString(
      properties.marketId,
      'properties.marketId',
    );


  if (marketId !== requestedMarketId) {
    throw new Error(
      '요청한 시장과 다른 경계가 반환되었습니다.',
    );
  }


  if (properties.status !== 'verified') {
    throw new Error(
      '검수되지 않은 시장 경계가 반환되었습니다.',
    );
  }


  return {
    marketId,

    name:
      requireString(
        properties.name,
        'properties.name',
      ),

    regionCode:
      requireString(
        properties.regionCode,
        'properties.regionCode',
      ),

    revision:
      requireRevision(
        properties.revision,
        'properties.revision',
      ),

    geometry:
      parseGeometry(
        value.geometry,
      ),
  };
}


async function readErrorMessage(
  response: Response,
): Promise<string> {
  try {
    const error =
      await response.json() as ApiErrorResponse;


    if (
      typeof error.message === 'string'
      && error.message.trim()
    ) {
      return error.message;
    }
  } catch {
    // The HTTP status fallback below also handles non-JSON responses.
  }


  return `시장 경계 요청이 실패했습니다. (HTTP ${response.status})`;
}


export const httpMarketBoundaryRepository:
  MarketBoundaryRepository = {
    async listMarkets(
      options?: ListMarketsOptions,
    ) {
      const query =
        options?.regionCode
          ? `?regionCode=${encodeURIComponent(options.regionCode)}`
          : '';

      const response =
        await fetch(
          `${getNurigoApiBaseUrl()}/v1/markets${query}`,
          {
            headers: {
              Accept:
                'application/json',
            },
          },
        );


      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
          ),
        );
      }


      const result =
        await response.json() as MarketsResponse;


      if (!Array.isArray(result.markets)) {
        throw new Error(
          '시장 목록 응답 형식이 올바르지 않습니다.',
        );
      }


      return result.markets.map(
        parseMarketSummary,
      );
    },


    async getBoundary(
      marketId: string,
    ) {
      const response =
        await fetch(
          `${getNurigoApiBaseUrl()}/v1/markets/${encodeURIComponent(marketId)}/boundary`,
          {
            headers: {
              Accept:
                'application/geo+json',
            },
          },
        );


      if (response.status === 404) {
        return null;
      }


      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
          ),
        );
      }


      const result =
        await response.json() as BoundaryFeatureResponse;


      return parseBoundary(
        result,
        marketId,
      );
    },
  };
