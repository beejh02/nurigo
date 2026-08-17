# 현재 프로젝트 상태

> 기준일: 2026-08-17

누리고는 **대전 지역의 여러 전통시장을 우선 대상으로 하는 프로젝트**입니다. 현재 Expo Android 프로토타입은 하나의 전통시장 경계를 사용해 Polygon 제작과 파일 추출까지 완료했으며, 다음 핵심 목표는 특정 시장에 고정되지 않는 GPS 구역 판정 기반을 만드는 것입니다.

## 기술 구성

| 영역 | 현재 구성 |
| --- | --- |
| 앱 | Expo SDK 57.0.13, React Native 0.86.2, React 19.2.3 |
| 언어 | TypeScript 6.0.3, strict mode |
| 라우팅 | Expo Router 57.0.13 |
| 지도 | `@mj-studio/react-native-naver-map` 2.9.x |
| 위치 | `expo-location` 57.0.10 |
| 파일 저장 | `expo-file-system` 57.0.4의 `File`, `Paths` API |
| 개발 런타임 | `expo-dev-client` 57.0.12, Android 네이티브 개발 빌드 |

## 구현 완료

- Naver Map을 Android 개발 빌드에서 표시
- 사용자에게 포그라운드 위치 권한을 요청하고 현재 GPS 위치를 획득
- 지도 터치로 Polygon 정점을 추가하고 번호 Marker와 Polyline을 표시
- 마지막 정점 실행 취소, 전체 초기화, Android 뒤로가기 처리
- 3개 이상의 정점과 시장 이름을 받아 `MarketPolygon` JSON 생성
- Expo 앱 문서 디렉터리에 `시장명-timestamp.json` 형식으로 저장
- 저장된 시장 경계 파일을 ADB로 추출하여 루트 JSON으로 확보하고 Git에 반영
- PostGIS 시장·경계 revision migration과 시장 경계 OpenAPI 계약 작성
- 시장 경계 백엔드 소유권을 ADR로 확정
- 모바일 위치, repository, Polygon 편집·저장, 지도와 UI 컴포넌트 분리
- `mobile/src/app/index.tsx`를 화면 조립 역할로 축소

## 로컬 구현·검증 대기

다음 변경은 현재 워크트리에 있지만 아직 커밋되지 않았습니다.

- 루트 시장 데이터를 `mobile/src/data/`에 번들 데이터로 복사
- bundled repository가 JSON을 읽어 주황색 전통시장 Polygon으로 상시 표시
- 기존 Polygon 편집·저장 흐름과 등록 시장 Polygon을 한 화면에서 구분

`mobile/`에서 `npx.cmd tsc --noEmit`은 통과했습니다. 실제 Android 기기 또는 Emulator에서 등록 Polygon이 렌더링되는지는 아직 다시 확인해야 합니다.

## 아직 구현하지 않은 기능

- 현재 GPS 좌표의 시장 Polygon 내부·외부 판정
- 여러 시장을 조회하고 선택할 수 있는 시장 카탈로그
- 판정 결과를 보여 주는 사용자 상태 UI
- 위치가 변경될 때 판정을 갱신하는 추적 정책
- 지오펜스 단위 테스트와 실기기 경계 테스트
- 사용자, 미션, 진행도, 리워드를 저장하고 검증하는 API
- OpenAPI를 실제로 제공하는 API 서버와 PostGIS 배포 환경
- 시장과 미션을 관리하는 운영자 화면

## 시장 데이터 현황

현재 루트의 시장 경계 JSON은 처음 추출한 임시 원본이며, 앱에서 사용하기 위해 동일한 내용을 `mobile/src/data/`에 복사한 상태입니다. 루트 파일 배치는 장기 규칙이 아니며, 추가 시장 JSON을 루트에 계속 쌓지 않습니다. 목표 관리 방식은 [시장 경계 데이터 관리](./MARKET_DATA.md)에 정의합니다.

- 좌표 수: 54개
- 좌표 순서: 시계 방향
- 첫 좌표와 마지막 좌표: 서로 매우 가깝지만 완전히 같은 값은 아님
- 두 파일의 내용: 2026-08-17 기준 SHA-256 동일
- 파일명과 JSON 내부 `name`: 영문 표기가 서로 일치하지 않음

파일명과 JSON 내부 시장명의 영문 표기가 일치하지 않습니다. 현재 사실을 보존하기 위해 문서화 단계에서는 데이터를 수정하지 않으며, 데이터 단일화 단계에서 공식 한글 시장명과 안정된 ID로 마이그레이션합니다.

## 알려진 문제와 위험

- `mobile/app.json`과 생성된 `mobile/android/`가 Git에서 제외되어 새 clone만으로 네이티브 설정을 완전히 재현할 수 없습니다.
- Naver Map 설정에 필요한 로컬 Client ID를 전달하는 템플릿과 온보딩 절차가 아직 없습니다.
- 시장 JSON이 루트와 앱 안에 중복되어 수동 복사 시 내용이 달라질 수 있습니다.
- bundled repository에는 단일 시장만 있어 실제 API 기반 카탈로그와 캐시가 없습니다.
- 현재 위치는 한 번만 가져오므로 실제 이동에 따른 구역 상태 변화는 반영하지 않습니다.
- 정적 타입 검사는 통과했지만 자동화된 테스트와 실기기 회귀 검증은 없습니다.
