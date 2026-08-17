# ADR 0001: 시장 경계는 백엔드가 소유한다

- 상태: Accepted
- 결정일: 2026-08-17

## 배경

초기 프로토타입은 앱 내부 JSON을 직접 import해 시장 Polygon을 표시합니다. 이 방식은 한 기기에서 빠르게 검증하기에는 적합하지만 여러 시장, 경계 수정, 미션 판정과 리워드 발급으로 확장하면 모바일과 서버의 데이터가 달라질 수 있습니다.

## 결정

- 운영 시장 경계의 단일 원본은 PostgreSQL + PostGIS 데이터베이스로 둡니다.
- 경계는 시장별 불변 revision으로 저장하고 `draft`, `verified`, `retired` 상태를 가집니다.
- 시장마다 현재 `verified` revision은 최대 하나만 존재합니다.
- 모바일은 공개 API로 verified 경계를 조회·캐시하고 지도 표시와 즉각적인 사전 판정에 사용합니다.
- 서버는 미션 완료와 리워드 발급 전에 현재 verified revision으로 위치를 다시 판정합니다.
- 경계선 위 점을 내부로 포함하기 위해 서버는 `ST_Covers`를 사용합니다.
- `packages/market-data`는 운영 원본이 아니라 공유 계약, 좌표 어댑터, 검증기, 테스트 fixture와 seed import 도구만 제공합니다.

## 결과

- 현재 루트와 모바일의 JSON은 데이터베이스 초기 적재용 seed로 격하됩니다.
- 모바일 화면은 파일 import가 아니라 `MarketBoundaryRepository`에 의존합니다.
- API가 준비되기 전에는 bundled repository가 같은 인터페이스를 임시 구현합니다.
- 경계 변경 시 revision 불일치가 감지되며, 클라이언트는 새 경계를 받은 뒤 다시 요청해야 합니다.
- 백엔드 프레임워크 선택은 보류하지만 PostGIS 스키마와 OpenAPI 계약은 구현체가 준수해야 합니다.
