import type {
  Coordinate,
  SubmittedMarketBoundaryDraft,
} from '../types';

import type {
  CreateMarketBoundaryDraftInput,
  MarketBoundaryDraftWriter,
} from './market-boundary-draft-writer';

import {
  getNurigoApiBaseUrl,
} from './api-base-url';


type DraftFeatureResponse = {
  properties?: {
    marketId?: unknown;
    name?: unknown;
    revision?: unknown;
    status?: unknown;
  };
};


type ApiErrorResponse = {
  message?: unknown;
};


function closeRing(
  points: Coordinate[],
): number[][] {
  const positions =
    points.map(
      (point) => [
        point.longitude,
        point.latitude,
      ],
    );

  const first =
    positions[0];

  const last =
    positions[positions.length - 1];


  if (
    first
    && last
    && (
      first[0] !== last[0]
      || first[1] !== last[1]
    )
  ) {
    positions.push(
      [...first],
    );
  }


  return positions;
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
    // The status text below is the fallback for non-JSON responses.
  }


  return `경계 등록 요청이 실패했습니다. (HTTP ${response.status})`;
}


function parseDraftResponse(
  value: DraftFeatureResponse,
  points: Coordinate[],
): SubmittedMarketBoundaryDraft {
  const properties =
    value.properties;


  if (
    !properties
    || typeof properties.marketId !== 'string'
    || typeof properties.name !== 'string'
    || typeof properties.revision !== 'number'
    || properties.status !== 'draft'
  ) {
    throw new Error(
      '서버가 올바른 draft 저장 결과를 반환하지 않았습니다.',
    );
  }


  return {
    marketId:
      properties.marketId,

    name:
      properties.name,

    revision:
      properties.revision,

    status:
      'draft',

    points: [
      ...points,
    ],
  };
}


export const httpMarketBoundaryDraftWriter:
  MarketBoundaryDraftWriter = {
    async createDraft({
      marketName,
      regionCode,
      points,
      adminToken,
    }: CreateMarketBoundaryDraftInput) {
      if (!__DEV__) {
        throw new Error(
          'Polygon 등록은 현재 개발 빌드에서만 사용할 수 있습니다.',
        );
      }


      const token =
        adminToken.trim();

      const normalizedMarketName =
        marketName.trim();

      const normalizedRegionCode =
        regionCode.trim();


      if (!token) {
        throw new Error(
          '관리자 토큰을 입력해주세요.',
        );
      }


      if (!normalizedMarketName) {
        throw new Error(
          '시장 이름을 입력해주세요.',
        );
      }


      if (
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
          normalizedRegionCode,
        )
      ) {
        throw new Error(
          '지역 코드는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.',
        );
      }


      if (points.length < 3) {
        throw new Error(
          'Polygon은 최소 3개의 정점이 필요합니다.',
        );
      }


      const response =
        await fetch(
          `${getNurigoApiBaseUrl()}/v1/admin/markets`,
          {
            method:
              'POST',

            headers: {
              Accept:
                'application/geo+json',

              Authorization:
                `Bearer ${token}`,

              'Content-Type':
                'application/geo+json',
            },

            body:
              JSON.stringify({
                type:
                  'Feature',

                properties: {
                  name:
                    normalizedMarketName,

                  regionCode:
                    normalizedRegionCode,

                  source: {
                    method:
                      'mobile-polygon-editor',
                  },
                },

                geometry: {
                  type:
                    'Polygon',

                  coordinates: [
                    closeRing(
                      points,
                    ),
                  ],
                },
              }),
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
        await response.json() as DraftFeatureResponse;


      return parseDraftResponse(
        result,
        points,
      );
    },
  };
