# 시장 경계 데이터 관리

> 기준일: 2026-08-17

누리고는 **대전 지역의 전통시장**을 우선 지원합니다. 시장 경계는 모바일 화면에만 쓰이는 파일이 아니라 지오펜스 판정, 미션 검증, 관리자 운영과 데이터 감사를 함께 지탱하는 공통 자산입니다.

## 결정 요약

- 루트에 시장 JSON을 계속 추가하지 않습니다.
- 운영 중인 시장 경계의 유일한 원본은 백엔드 PostGIS 데이터베이스입니다.
- GeoJSON은 관리자 API의 입출력, 초기 seed와 테스트 fixture 형식으로 사용합니다.
- `packages/market-data`는 공유 계약, 변환기, 검증기와 seed import 도구를 제공합니다.
- 모바일용 좌표 변환과 Naver Map의 좌표 방향 처리는 어댑터에서 수행합니다.
- 검수되지 않은 시장 경계로 미션이나 리워드를 판정하지 않습니다.



## 목표 지원 패키지

```text
packages/market-data/
├─ package.json
├─ schema/
│  └─ market-boundary.schema.json
├─ scripts/
│  ├─ validate-market-data.mjs
│  └─ import-market-seed.mjs
└─ src/
   ├─ index.ts
   ├─ adapters/
   │  └─ to-naver-map-coordinates.ts
   └─ fixtures/
      └─ daejeon/
         ├─ <market-id>.geojson
         └─ <another-market-id>.geojson
```

이 디렉터리의 GeoJSON은 seed와 테스트 입력이며 운영 원본이 아닙니다. 파일명과 `Feature.id`는 소문자 kebab-case의 안정된 ID를 사용합니다. 시장 이름이 바뀌더라도 기존 사용자 진행도와 API 참조가 깨지지 않도록 ID는 변경하지 않습니다.

## 표준 교환 형식

관리자 API, seed와 fixture는 [RFC 7946 GeoJSON](https://www.rfc-editor.org/info/rfc7946/)의 `Feature`를 사용합니다. 백엔드는 이를 PostGIS `geometry(MultiPolygon, 4326)`로 정규화해 저장합니다. 하나로 이어진 시장은 `Polygon`, 서로 떨어진 구역을 하나의 시장으로 관리해야 하면 `MultiPolygon`을 교환 형식으로 사용할 수 있습니다.

```json
{
  "type": "Feature",
  "id": "daejeon-example-traditional-market",
  "properties": {
    "schemaVersion": 1,
    "revision": 1,
    "name": "예시전통시장",
    "region": {
      "sido": "대전광역시",
      "sigungu": "동구"
    },
    "status": "verified",
    "capturedAt": "2026-08-16T16:41:03.165Z",
    "verifiedAt": "2026-08-17T00:00:00.000Z"
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [127.4300, 36.3260],
        [127.4345, 36.3260],
        [127.4345, 36.3305],
        [127.4300, 36.3305],
        [127.4300, 36.3260]
      ]
    ]
  }
}
```

예시의 좌표는 형식을 설명하기 위해 생략한 것이므로 실제 시장 경계 파일로 사용하지 않습니다.

GeoJSON은 경도, 위도 순서인 `[longitude, latitude]`를 사용하며 Polygon의 LinearRing은 첫 위치와 마지막 위치가 같아야 합니다. 외곽 링은 반시계 방향, 구멍은 시계 방향으로 정규화합니다. 모바일 HTTP repository가 API GeoJSON을 `{ latitude, longitude }`와 Naver Map 형식으로 변환합니다.

## 상태와 버전

- `draft`: 좌표를 수집했지만 현장 또는 운영자 검수가 끝나지 않음
- `verified`: 사용자 판정과 미션에 사용할 수 있도록 검수 완료
- `retired`: 폐장, 통합 또는 경계 변경으로 신규 판정에서 제외

`revision`은 같은 시장의 경계나 메타데이터가 바뀔 때 증가시킵니다. 모바일과 API는 판정 결과와 함께 시장 ID 및 revision을 기록해 서로 다른 경계 버전으로 보상을 판단하는 문제를 추적할 수 있어야 합니다.

## 자동 검증 규칙

seed 검증기와 백엔드는 최소한 다음 조건을 확인합니다.

- JSON Schema와 `schemaVersion` 일치
- 파일명, `Feature.id`와 카탈로그 ID 일치 및 중복 없음
- `name`, `region`, `status`, 수집·검수 시각 존재
- 경도 `-180..180`, 위도 `-90..90` 범위
- LinearRing이 4개 이상의 위치를 가지며 첫 위치와 마지막 위치가 동일
- 외곽 링과 구멍의 방향이 저장 규칙과 일치
- 연속으로 중복된 위치, 0에 가까운 면적과 명백한 자기 교차가 없음
- `verified` 데이터에는 `verifiedAt`이 존재

검증에 실패한 데이터는 PostGIS에 verified revision으로 등록하거나 API로 배포하지 않습니다.

## 앱과 API에서 사용하는 방법

백엔드 API는 다음 읽기 계약을 제공하고 `packages/market-data`는 wire type과 좌표 어댑터를 공유합니다.

- 대전 지역의 활성 시장 목록 조회
- 안정된 ID로 시장 조회
- 시장 중심점 또는 bounding box 조회
- verified GeoJSON 경계를 Naver Map Polygon 좌표로 변환
- 지오펜스 패키지가 사용할 `Polygon | MultiPolygon` 계약 제공

현재 프로토타입은 새 Polygon을 모바일 `MarketBoundaryDraftWriter`로 관리자 API에 직접 등록하고, `MarketBoundaryRepository`의 HTTP 구현으로 verified 경계를 조회합니다. 다음 단계에서는 ETag 기반 캐시와 revision 갱신을 추가합니다. 리워드 발급 시에는 API가 현재 verified revision과 `ST_Covers`로 최종 판정합니다.
