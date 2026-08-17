# 누리고 API 계약

이 디렉터리는 아직 특정 백엔드 프레임워크를 선택하지 않은 상태에서 시장 경계의 서버 소유권을 먼저 고정합니다.

## 현재 포함 범위

- `db/migrations/001_market_boundaries.sql`: PostgreSQL + PostGIS 시장 및 경계 revision 스키마
- `openapi/market-boundaries.yaml`: 공개 조회, 서버 판정과 관리자 경계 등록·검수 계약

실행 가능한 API 서버는 아직 없습니다. 백엔드 프레임워크는 이 계약을 변경하지 않는 구현 세부사항으로 후속 ADR에서 결정합니다.

## 소유권 원칙

- 운영 중인 시장 경계의 최종 원본은 PostGIS 데이터베이스입니다.
- 모바일은 검수된 경계를 조회하고 캐시해 지도 표시와 즉각적인 안내에 사용합니다.
- 미션 완료와 리워드 발급에 영향을 주는 위치 판정은 서버가 현재 verified revision으로 다시 수행합니다.
- 경계선 위의 좌표는 내부로 간주하므로 서버 판정은 `ST_Covers(boundary, point)`를 사용합니다.
- 클라이언트가 제출한 revision이 현재 verified revision과 다르면 `409 BOUNDARY_REVISION_MISMATCH`로 갱신을 요구합니다.

## revision 전환

새 경계는 항상 `draft`로 생성합니다. 검수 완료 시 하나의 트랜잭션 안에서 기존 `verified` revision을 `retired`로 변경하고 새 revision을 `verified`로 변경합니다. 시장마다 verified revision은 최대 하나만 존재하도록 데이터베이스 인덱스로 보장합니다.

현재 저장소의 JSON은 운영 원본이 아니라 최초 경계를 적재하기 위한 seed 입력입니다. import와 렌더링 비교가 끝난 뒤 모바일의 직접 JSON 의존성을 제거합니다.
