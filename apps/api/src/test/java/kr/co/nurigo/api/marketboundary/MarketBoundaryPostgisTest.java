package kr.co.nurigo.api.marketboundary;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class MarketBoundaryPostgisTest {

  private static final String MARKET_ID = "daejeon-jungang-market";

  @Container
  static final PostgreSQLContainer POSTGIS = new PostgreSQLContainer(
      DockerImageName.parse("postgis/postgis:17-3.5")
          .asCompatibleSubstituteFor("postgres")
  )
      .withDatabaseName("nurigo")
      .withUsername("nurigo")
      .withPassword("nurigo");

  @DynamicPropertySource
  static void datasourceProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", POSTGIS::getJdbcUrl);
    registry.add("spring.datasource.username", POSTGIS::getUsername);
    registry.add("spring.datasource.password", POSTGIS::getPassword);
  }

  @Autowired
  private MarketBoundaryService service;

  @Autowired
  private JsonMapper jsonMapper;

  @Test
  void createsASeparateMarketWithItsFirstDraft() throws Exception {
    String draft = service.createMarketWithDraft(newMarketFeature("""
        [[
          [126.9700, 37.5600],
          [126.9800, 37.5600],
          [126.9800, 37.5700],
          [126.9700, 37.5600]
        ]]
        """));

    assertThat(draft)
        .contains("\"name\": \"테스트시장\"")
        .contains("\"regionCode\": \"test-region\"")
        .contains("\"revision\": 1")
        .contains("\"status\": \"draft\"")
        .doesNotContain("\"marketId\": \"daejeon-jungang-market\"");

    String marketId = jsonMapper.readTree(draft)
        .get("properties")
        .get("marketId")
        .asText();

    service.verify(marketId, 1);

    assertThat(service.listMarkets("test-region"))
        .singleElement()
        .satisfies(market -> {
          assertThat(market.id()).isEqualTo(marketId);
          assertThat(market.name()).isEqualTo("테스트시장");
          assertThat(market.boundaryRevision()).isEqualTo(1);
        });
  }

  @Test
  void createsVerifiesAndReplacesBoundaryRevision() throws Exception {
    assertThat(service.getVerified(MARKET_ID).feature())
        .contains("\"revision\": 1")
        .contains("\"status\": \"verified\"");

    String firstDraft = service.createDraft(MARKET_ID, feature("""
        [[
          [127.4200, 36.3200],
          [127.4400, 36.3200],
          [127.4400, 36.3400],
          [127.4200, 36.3400],
          [127.4200, 36.3200]
        ]]
        """));

    assertThat(firstDraft)
        .contains("\"revision\": 2")
        .contains("\"status\": \"draft\"");

    String firstVerified = service.verify(MARKET_ID, 2);
    assertThat(firstVerified).contains("\"status\": \"verified\"");

    String secondDraft = service.createDraft(MARKET_ID, feature("""
        [[
          [127.4210, 36.3210],
          [127.4410, 36.3210],
          [127.4410, 36.3410],
          [127.4210, 36.3410],
          [127.4210, 36.3210]
        ]]
        """));

    assertThat(secondDraft)
        .contains("\"revision\": 3")
        .contains("\"status\": \"draft\"");

    service.verify(MARKET_ID, 3);

    assertThat(service.getVerified(MARKET_ID).feature())
        .contains("\"revision\": 3")
        .contains("\"status\": \"verified\"");
    assertThat(service.listMarkets("daejeon"))
        .singleElement()
        .extracting(MarketSummary::boundaryRevision)
        .isEqualTo(3);
    assertThatThrownBy(() -> service.verify(MARKET_ID, 1))
        .isInstanceOf(BoundaryConflictException.class)
        .hasMessageContaining("retired");
  }

  @Test
  void rejectsSelfIntersectingPolygon() throws Exception {
    MarketBoundaryDraftFeature feature = feature("""
        [[
          [127.4200, 36.3200],
          [127.4400, 36.3400],
          [127.4400, 36.3200],
          [127.4200, 36.3400],
          [127.4200, 36.3200]
        ]]
        """);

    assertThatThrownBy(() -> service.createDraft(MARKET_ID, feature))
        .isInstanceOf(InvalidBoundaryException.class)
        .hasMessageContaining("PostGIS geometry 검증");
  }

  private MarketBoundaryDraftFeature feature(String coordinates) throws Exception {
    return jsonMapper.readValue("""
        {
          "type": "Feature",
          "properties": {
            "source": {
              "method": "integration-test"
            }
          },
          "geometry": {
            "type": "Polygon",
            "coordinates": %s
          }
        }
        """.formatted(coordinates), MarketBoundaryDraftFeature.class);
  }

  private NewMarketBoundaryDraftFeature newMarketFeature(String coordinates) throws Exception {
    return jsonMapper.readValue("""
        {
          "type": "Feature",
          "properties": {
            "name": "테스트시장",
            "regionCode": "test-region",
            "source": {
              "method": "integration-test"
            }
          },
          "geometry": {
            "type": "Polygon",
            "coordinates": %s
          }
        }
        """.formatted(coordinates), NewMarketBoundaryDraftFeature.class);
  }
}
