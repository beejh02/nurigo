# 누리고 API

Spring Boot 4.1과 Java 17로 구현한 시장 경계 API입니다. 운영 시장 경계의 원본은 PostgreSQL + PostGIS이며, 새 경계는 `draft`로 생성한 뒤 별도 검수 요청으로 `verified` 상태가 됩니다.

## 포함 범위

- `GET /v1/markets`: verified 경계가 있는 시장 목록
- `GET /v1/markets/{marketId}/boundary`: 현재 verified GeoJSON 경계
- `POST /v1/admin/markets`: 새 시장과 첫 draft 경계를 한 번에 생성
- `POST /v1/admin/markets/{marketId}/boundaries`: 다음 draft revision 생성
- `POST /v1/admin/markets/{marketId}/boundaries/{revision}/verify`: draft 검수 및 배포
- Flyway 시장·경계 schema와 `daejeon-jungang-market` revision 1 verified 경계 seed
- GeoJSON 구조 검증, PostGIS `ST_IsValid` 검증과 Polygon 방향 정규화

`V2__seed_daejeon_jungang_market.sql`과 `V3__seed_verified_daejeon_jungang_boundary.sql`은 기존 대전중앙시장 데이터를 DB로 옮긴 일회성 이관 기록입니다. 이미 적용된 Flyway migration은 삭제하거나 수정하지 않습니다. 이후 시장은 migration 파일이 아니라 `POST /v1/admin/markets` 또는 모바일 Polygon 편집기로 등록합니다.

`POST /v1/geofence/check`와 사용자·미션·리워드 API는 아직 구현하지 않았습니다.

## 실행 준비

- Java 17 이상
- Docker Desktop 또는 호환 Docker 환경

PowerShell에서 다음을 실행합니다.

```powershell
Set-Location .\apps\api
docker compose up -d
$env:NURIGO_ADMIN_TOKEN = 'replace-with-a-long-random-development-token'
.\mvnw.cmd spring-boot:run
```

기본 연결 정보는 `compose.yaml` 및 `.env.example`과 같습니다. API는 기본적으로 `127.0.0.1:8080`에만 바인딩됩니다. 실제 기기에서 접근해야 할 때만 `NURIGO_SERVER_ADDRESS=0.0.0.0`을 명시하고 운영체제 방화벽 범위를 확인합니다.

상태 확인:

```powershell
Invoke-RestMethod http://127.0.0.1:8080/actuator/health
```

## 새 시장과 첫 draft 등록 예시

관리자 API는 `NURIGO_ADMIN_TOKEN`과 동일한 Bearer token을 요구합니다. 현재 token 방식은 로컬·초기 개발용이며 모바일 배포물에 포함하지 않습니다.

아래 좌표는 HTTP 형식 확인을 위한 임의의 사각형입니다. 실제 경계 제작은 모바일의 `DB에 Polygon 저장` 기능을 사용합니다.

```powershell
$headers = @{
  Authorization = "Bearer $env:NURIGO_ADMIN_TOKEN"
}

$body = @'
{
  "type": "Feature",
  "properties": {
    "name": "문창전통시장",
    "regionCode": "daejeon",
    "source": {
      "method": "manual-test"
    }
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [127.4200, 36.3200],
      [127.4400, 36.3200],
      [127.4400, 36.3400],
      [127.4200, 36.3400],
      [127.4200, 36.3200]
    ]]
  }
}
'@

$draft = Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:8080/v1/admin/markets `
  -Headers $headers `
  -ContentType 'application/geo+json' `
  -Body $body
```

서버가 시장 ID를 자동으로 생성합니다. 검수는 생성 응답의 `properties.marketId`와 `properties.revision`을 사용합니다.

```powershell
$marketId = $draft.properties.marketId
$revision = $draft.properties.revision

Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:8080/v1/admin/markets/$marketId/boundaries/$revision/verify" `
  -Headers $headers
```

이미 등록된 시장의 경계를 수정할 때만 `POST /v1/admin/markets/{marketId}/boundaries`를 사용합니다.

## 테스트

```powershell
Set-Location .\apps\api
.\mvnw.cmd test
```

GeoJSON과 인증 filter 단위 테스트는 Docker 없이 실행됩니다. PostGIS lifecycle 테스트는 Testcontainers를 사용하며 Docker가 없으면 자동으로 skip됩니다.

## 소유권과 revision 원칙

- 새 경계는 항상 `draft`로 생성합니다.
- 생성 시 시장 행을 잠근 뒤 다음 revision을 계산합니다.
- 검수는 같은 트랜잭션에서 기존 `verified`를 `retired`로 만들고 새 revision을 `verified`로 변경합니다.
- 데이터베이스 partial unique index가 시장별 verified revision을 최대 하나로 제한합니다.
- 모바일은 공개 API의 verified 경계만 조회·캐시합니다.
- 미션과 리워드의 최종 위치 판정은 이후 서버가 `ST_Covers`로 수행합니다.

세부 계약은 `openapi/market-boundaries.yaml`, 결정 배경은 `docs/adr/0001-market-boundary-ownership.md`와 `docs/adr/0002-spring-boot-api.md`를 참고합니다.
