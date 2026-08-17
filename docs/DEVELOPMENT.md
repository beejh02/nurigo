# 개발 가이드

> 기준일: 2026-08-17

현재 사용자 앱은 `mobile/`, Spring Boot API는 `apps/api/`에 있습니다. 모바일은 Naver Map 네이티브 모듈을 사용하므로 Expo Go가 아니라 Android 개발 빌드로 실행합니다.

## 준비 사항

### 모바일

- Node.js와 npm
- Android Studio, Android SDK와 호환되는 JDK
- Android Emulator 또는 USB 디버깅을 활성화한 실제 기기
- Android package `com.beejh02.nurigo`에 허용된 Naver Map Client ID

### API

- Java 17 이상
- Docker Desktop 또는 호환 Docker 환경

Maven은 전역 설치하지 않아도 됩니다. `apps/api/mvnw.cmd`가 고정된 Maven 배포본을 사용합니다.

## 모바일 설정과 설치

Naver Map Client ID는 저장소에 기록하지 않습니다. 새 clone에서는 환경변수 템플릿을 복사한 뒤 값을 채웁니다.

```powershell
Set-Location .\mobile
Copy-Item .env.example .env.local
```

`.env.local`:

```dotenv
NAVER_MAP_CLIENT_ID=<issued-client-id>
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080
```

`NAVER_MAP_CLIENT_ID`는 `app.config.ts`를 해석할 때만 사용합니다. `EXPO_PUBLIC_API_BASE_URL`은 Polygon draft 등록 API 주소입니다. Android Emulator는 `10.0.2.2`, 실제 기기는 개발 PC의 LAN IP를 사용합니다. `EXPO_PUBLIC_*` 값은 앱 번들에 포함되므로 관리자 token을 이 파일에 넣지 않습니다.

설치와 정적 검사:

```powershell
Set-Location .\mobile
npm ci
npm run typecheck
```

의존성 변경은 Expo SDK 호환 버전을 선택하도록 `npx.cmd expo install <package>`를 우선 사용합니다.

## Android 개발 빌드

최초 설치, 네이티브 모듈 추가, config plugin 또는 앱 설정 변경 뒤에는 개발 빌드를 다시 생성합니다.

```powershell
Set-Location .\mobile
npx.cmd expo run:android
```

개발 빌드가 이미 설치되어 있고 JavaScript 또는 TypeScript 코드만 바뀌었다면 Metro를 다시 연결합니다.

```powershell
npx.cmd expo start --dev-client
```

## API 실행

PostGIS를 시작하고 관리자용 개발 token을 현재 PowerShell 세션에 설정합니다.

```powershell
Set-Location .\apps\api
docker compose up -d
$env:NURIGO_ADMIN_TOKEN = 'replace-with-a-long-random-development-token'
.\mvnw.cmd spring-boot:run
```

기본 API 주소는 `http://127.0.0.1:8080`입니다. 관리자 token이 비어 있으면 공개 조회 API는 동작하지만 `/v1/admin/**`는 `503 ADMIN_AUTH_NOT_CONFIGURED`로 닫힙니다.

실제 기기에서 PC의 LAN IP로 접근할 때는 API를 모든 인터페이스에 바인딩한 뒤 방화벽 허용 범위를 확인합니다.

```powershell
$env:NURIGO_SERVER_ADDRESS = '0.0.0.0'
```

```powershell
Invoke-RestMethod http://127.0.0.1:8080/actuator/health
```

세부 요청 예시는 [API README](../apps/api/README.md)를 참고합니다.

## 자동 검사

모바일:

```powershell
Set-Location .\mobile
npm run typecheck
```

API:

```powershell
Set-Location .\apps\api
.\mvnw.cmd test
```

API의 GeoJSON과 관리자 인증 filter 단위 테스트는 Docker 없이 실행됩니다. PostGIS draft·verify·조회 lifecycle 테스트는 Docker가 있으면 Testcontainers로 실행되고, 없으면 해당 테스트만 skip됩니다.

## 위치 기능 확인

1. 앱 최초 실행 시 포그라운드 위치 권한을 허용합니다.
2. 지도에 현재 위치 Marker가 나타나는지 확인합니다.
3. 현재 번들에는 검증용 시장 데이터 하나만 있으므로 다른 위치에서는 Polygon이 화면 밖에 있을 수 있습니다.
4. Emulator 위치를 대상 시장 부근으로 설정해 등록 Polygon을 확인합니다.
5. 권한 거부와 위치 획득 실패 상태도 확인합니다.

현재 구현은 `getCurrentPositionAsync`로 위치를 한 번만 가져옵니다. 연속 위치 추적과 배터리·정확도 정책은 지오펜스 MVP 단계에서 결정합니다.

## Polygon 데이터 제작 흐름

1. 개발용 모바일 화면에서 정점을 3개 이상 선택합니다.
2. `DB에 Polygon 저장`을 누릅니다.
3. API 실행 시 설정한 `NURIGO_ADMIN_TOKEN` 값을 저장 모달에 입력합니다. token은 앱 파일에 저장하지 않고 요청이 끝나면 메모리에서 지웁니다.
4. 앱이 `{ latitude, longitude }`를 GeoJSON `[longitude, latitude]`로 바꾸고 LinearRing을 닫아 관리자 API로 전송합니다.
5. Spring Boot와 PostGIS가 geometry를 검증하고 새 draft revision을 저장합니다.
6. 앱에서 서버가 반환한 시장명, revision과 정점 수를 확인합니다.
7. 별도 검수 요청으로 해당 revision을 verified로 전환합니다.
8. 검수 후 앱을 다시 불러오면 HTTP repository가 새 verified revision을 조회합니다.

모바일의 신규 Polygon 저장은 앱 문서 디렉터리에 JSON 파일을 만들지 않습니다. 경계의 읽기와 쓰기 모두 API를 통하며, 대전중앙시장 초기 경계는 Flyway V3 migration이 PostGIS에 생성합니다.

## 공식 기준 자료

- [Expo SDK 57 App config](https://docs.expo.dev/versions/v57.0.0/config/app/)
- [Expo 환경변수](https://docs.expo.dev/guides/environment-variables/)
- [Expo SDK 57 Location](https://docs.expo.dev/versions/v57.0.0/sdk/location/)
- [Expo SDK 57 Dev Client](https://docs.expo.dev/versions/v57.0.0/sdk/dev-client/)
- [React Native Naver Map Expo setup](https://rnnavermap.mjstudio.net/docs/installation/expo)
- [Spring Boot system requirements](https://docs.spring.io/spring-boot/system-requirements.html)
- [PostGIS `ST_GeomFromGeoJSON`](https://postgis.net/docs/ST_GeomFromGeoJSON.html)

Expo SDK, Spring Boot 또는 PostGIS를 업그레이드할 때는 버전 고정 문서와 테스트 결과를 함께 갱신합니다.
