# 현재 프로젝트 상태

> 기준일: 2026-08-17

누리고는 **대전 지역의 여러 전통시장을 우선 대상으로 하는 프로젝트**입니다. Expo Android 프로토타입은 지도에서 제작한 Polygon을 Spring Boot API를 통해 PostGIS draft revision으로 직접 저장하며, API는 해당 경계를 검수·조회하는 첫 수직 흐름을 구현한 상태입니다.

## 기술 구성

| 영역 | 현재 구성 |
| --- | --- |
| 앱 | Expo SDK 57.0.14, React Native 0.86.2, React 19.2.3 |
| 모바일 언어 | TypeScript 6.0.3, strict mode |
| 지도·위치 | `@mj-studio/react-native-naver-map` 2.9.x, `expo-location` 57.0.11 |
| API | Java 17, Spring Boot 4.1, Spring JDBC, Flyway |
| 데이터베이스 | PostgreSQL 17 + PostGIS 3.5 개발 이미지 |
| API 테스트 | JUnit, AssertJ, Testcontainers 2.0.5 |
| 계약 | OpenAPI 3.1 GeoJSON API, Polygon·MultiPolygon, boundary revision |

## 구현 완료

### 모바일

- Naver Map, 포그라운드 위치 권한과 현재 GPS 위치 표시
- 지도 터치 기반 Polygon 편집, 실행 취소·초기화와 Android 뒤로가기 처리
- 모바일 좌표를 GeoJSON으로 변환하고 관리자 API를 호출해 PostGIS draft로 직접 저장
- DB 저장 중 상태, API 오류, 저장된 시장명·revision·정점 수 표시
- 관리자 token을 저장하지 않고 개발 빌드의 저장 모달에서 요청 시에만 입력
- 위치, 시장 repository, Polygon 편집·API 저장, 지도와 UI 컴포넌트 분리
- HTTP repository를 통한 verified 시장 목록·GeoJSON 경계 조회와 Naver Map 좌표 변환
- 추적 가능한 `app.config.ts`, Naver Map Client ID 환경변수 템플릿과 CNG Maven repository 설정

### API와 데이터

- Spring Boot 4.1 Maven Wrapper 프로젝트와 Docker Compose PostGIS 개발환경
- Flyway 시장·경계 schema 및 안정 ID `daejeon-jungang-market` revision 1 verified 경계 seed
- 레거시 중앙시장 54개 정점을 55개 위치의 닫힌 LinearRing으로 이관하고 중복 JSON 제거
- verified 시장 목록과 현재 verified GeoJSON 경계 조회
- 관리자용 경계 draft 생성과 draft → verified 검수 API
- 시장 행 잠금을 통한 revision 직렬화
- 하나의 트랜잭션 안에서 기존 verified → retired, 새 draft → verified 전환
- GeoJSON 좌표 구조·범위·LinearRing 검증, PostGIS `ST_IsValid` 검증과 외곽선 방향 정규화
- 환경변수 기반 개발용 Bearer 관리자 token과 미설정 시 fail-closed 처리
- Spring Boot 선택을 ADR 0002로 기록

## 현재 검증 결과

- `mobile/`의 TypeScript strict 검사 통과
- Expo public config 해석 통과
- API 테스트 12개 전체 통과
- Testcontainers PostGIS에서 Flyway migration, draft 생성·검수·조회 lifecycle 통과
- 실제 Android 기기 또는 Emulator의 config plugin 재생성·지도 회귀 검증은 아직 필요

## 아직 구현하지 않은 기능

- verified 경계 모바일 캐시와 ETag 기반 revision 갱신
- 현재 GPS 좌표의 Polygon·MultiPolygon 내부·외부 판정
- 연속 위치 추적과 확인 중·권한 없음·위치 오류 상태 UI
- 두 번째 시장 데이터와 단일 시장 하드코딩 제거 검증
- `/v1/geofence/check` 서버 권위 판정
- 운영용 관리자·사용자 인증과 권한 모델
- 사용자, 미션, 진행도와 리워드 API
- 시장과 미션을 관리하는 운영자 화면
- GitHub Actions의 실제 원격 실행 결과 확인

## 시장 데이터 현황

대전중앙시장 경계는 `V3__seed_verified_daejeon_jungang_boundary.sql`에서 안정 ID `daejeon-jungang-market`의 revision 1 verified `MultiPolygon`으로 관리합니다. migration은 54개 원본 정점을 GeoJSON `[longitude, latitude]` 순서로 변환하고 첫 위치를 다시 추가해 55개 위치의 LinearRing으로 닫습니다. PostGIS 유효성·정점 수를 검사하며, 기존 revision 1이 있으면 geometry가 정확히 같은 경우에만 승계합니다. 루트와 모바일의 중복 JSON은 제거했습니다.

## 알려진 문제와 위험

- 모바일 → API → PostGIS 실제 Android 기기 왕복은 아직 실행 검증하지 못했습니다.
- 관리자 Bearer token은 초기 개발용 opaque token이며 운영 인증 방식이 아닙니다.
- 현재 위치는 한 번만 가져오므로 실제 이동에 따른 구역 상태 변화가 반영되지 않습니다.
- 모바일 의존성 감사에서 moderate 8개, high 15개의 취약점이 보고되어 영향 범위와 상위 패키지 수정 가능성을 별도로 점검해야 합니다.
- 기본 CI 설정은 추가됐지만 GitHub 원격 실행과 실기기 회귀 검증은 아직 확인하지 못했습니다.
