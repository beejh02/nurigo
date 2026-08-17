import {
  File,
  Paths,
} from 'expo-file-system';

import type {
  Coordinate,
  SavedMarketPolygon,
} from './types';


export type SavedPolygonFile = {
  polygon: SavedMarketPolygon;
  uri: string;
};


export function savePolygonToDocument(
  name: string,
  points: Coordinate[],
): SavedPolygonFile {
  const trimmedName =
    name.trim();


  if (!trimmedName) {
    throw new Error(
      '시장 이름을 입력해주세요.',
    );
  }


  if (points.length < 3) {
    throw new Error(
      'Polygon은 최소 3개의 정점이 필요합니다.',
    );
  }


  const now =
    Date.now();


  const polygon: SavedMarketPolygon = {
    id:
      `market-${now}`,

    name:
      trimmedName,

    createdAt:
      new Date(now).toISOString(),

    points: [
      ...points,
    ],
  };


  const safeMarketName =
    trimmedName
      .replace(
        /[\\/:*?"<>|]/g,
        '',
      )
      .replace(
        /\s+/g,
        '_',
      );


  const fileName =
    `${safeMarketName}-${now}.json`;


  const file =
    new File(
      Paths.document,
      fileName,
    );


  file.create();

  file.write(
    JSON.stringify(
      polygon,
      null,
      2,
    ),
  );


  return {
    polygon,
    uri:
      file.uri,
  };
}
