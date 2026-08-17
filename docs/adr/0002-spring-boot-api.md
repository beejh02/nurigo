# ADR 0002: API는 Spring Boot로 구현한다

- 상태: Accepted
- 결정일: 2026-08-17

## 배경

시장 경계의 서버 소유권, PostGIS 스키마와 OpenAPI 계약은 먼저 확정했지만 실행 가능한 API 구현체는 없었습니다. 경계 revision 전환과 PostGIS geometry 검증은 트랜잭션과 명시적인 SQL 제어가 중요하며, 로컬 개발환경에 Maven 또는 Gradle이 설치되어 있지 않아도 같은 빌드를 재현할 수 있어야 합니다.

## 결정

- API는 Java 17과 Spring Boot 4.1을 사용합니다.
- 빌드는 Maven Wrapper로 고정합니다.
- 데이터 접근은 Spring JDBC를 사용하고 PostGIS 함수는 명시적인 SQL로 호출합니다.
- 스키마 변경은 Flyway migration으로 관리합니다.
- 로컬 PostgreSQL + PostGIS는 Docker Compose로 실행합니다.
- PostGIS 통합 테스트는 Testcontainers로 실행하고 Docker가 없는 환경에서는 해당 테스트만 건너뜁니다.
- 경계 생성과 검수는 시장 행을 잠그는 단일 트랜잭션으로 처리해 revision과 verified 상태 충돌을 방지합니다.

## 결과

- `apps/api`가 실행 가능한 Spring Boot 애플리케이션이 됩니다.
- JPA/Hibernate Spatial 추상화 대신 SQL과 PostGIS 동작을 코드에서 직접 검토할 수 있습니다.
- 애플리케이션과 migration이 PostgreSQL/PostGIS에 결합됩니다. 이는 ADR 0001에서 이미 확정한 저장 기술과 일치합니다.
- 관리자 API는 초기 개발 단계에서 환경변수로 주입한 opaque Bearer token으로 보호합니다. 운영 인증, 사용자 인증과 JWT 여부는 서비스 최소 기반 단계의 별도 ADR에서 결정합니다.
- 관리자 웹 프레임워크, PostgreSQL 운영 제공자와 배포 플랫폼은 아직 결정하지 않습니다.
