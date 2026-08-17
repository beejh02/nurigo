package kr.co.nurigo.api.marketboundary;

import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class MarketBoundaryJdbcStore {

  private static final String NORMALIZED_BOUNDARY_SQL = """
      ST_Multi(
        ST_ForcePolygonCCW(
          ST_SetSRID(
            ST_GeomFromGeoJSON(CAST(:geometry_json AS jsonb)),
            4326
          )
        )
      )
      """;

  private final JdbcClient jdbcClient;

  MarketBoundaryJdbcStore(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  void insertMarket(String marketId, String name, String regionCode) {
    jdbcClient.sql("""
            INSERT INTO markets (id, name, region_code)
            VALUES (:market_id, :name, :region_code)
            """)
        .param("market_id", marketId)
        .param("name", name)
        .param("region_code", regionCode)
        .update();
  }

  boolean lockMarket(String marketId) {
    return jdbcClient.sql("""
            SELECT id
            FROM markets
            WHERE id = :market_id
            FOR UPDATE
            """)
        .param("market_id", marketId)
        .query(String.class)
        .optional()
        .isPresent();
  }

  int nextRevision(String marketId) {
    return jdbcClient.sql("""
            SELECT COALESCE(MAX(revision), 0) + 1
            FROM market_boundaries
            WHERE market_id = :market_id
            """)
        .param("market_id", marketId)
        .query(Integer.class)
        .single();
  }

  GeometryValidation validateGeometry(String geometryJson) {
    String sql = """
        SELECT
          ST_IsValid(candidate.boundary) AS valid,
          ST_IsValidReason(candidate.boundary) AS reason
        FROM (
          SELECT %s AS boundary
        ) candidate
        """.formatted(NORMALIZED_BOUNDARY_SQL);

    return jdbcClient.sql(sql)
        .param("geometry_json", geometryJson)
        .query((resultSet, rowNumber) -> new GeometryValidation(
            resultSet.getBoolean("valid"),
            resultSet.getString("reason")
        ))
        .single();
  }

  void insertDraft(
      String marketId,
      int revision,
      String geometryJson,
      String sourceJson
  ) {
    String sql = """
        INSERT INTO market_boundaries (
          market_id,
          revision,
          status,
          boundary,
          source
        )
        VALUES (
          :market_id,
          :revision,
          'draft',
          %s,
          CAST(:source_json AS jsonb)
        )
        """.formatted(NORMALIZED_BOUNDARY_SQL);

    jdbcClient.sql(sql)
        .param("market_id", marketId)
        .param("revision", revision)
        .param("geometry_json", geometryJson)
        .param("source_json", sourceJson)
        .update();
  }

  Optional<String> findBoundaryFeature(String marketId, int revision) {
    return jdbcClient.sql(boundaryFeatureSql("""
            boundary.market_id = :market_id
              AND boundary.revision = :revision
            """))
        .param("market_id", marketId)
        .param("revision", revision)
        .query(String.class)
        .optional();
  }

  Optional<VerifiedMarketBoundary> findVerifiedBoundaryFeature(String marketId) {
    return jdbcClient.sql("""
            SELECT
              boundary.revision,
              jsonb_build_object(
                'type', 'Feature',
                'id', boundary.market_id || '-r' || boundary.revision,
                'properties', jsonb_build_object(
                  'marketId', market.id,
                  'name', market.name,
                  'regionCode', market.region_code,
                  'revision', boundary.revision,
                  'status', boundary.status::text
                ),
                'geometry', CAST(ST_AsGeoJSON(boundary.boundary) AS jsonb)
              )::text AS feature
            FROM market_boundaries boundary
            JOIN markets market ON market.id = boundary.market_id
            WHERE boundary.market_id = :market_id
              AND boundary.status = 'verified'
            """)
        .param("market_id", marketId)
        .query((resultSet, rowNumber) -> new VerifiedMarketBoundary(
            resultSet.getString("feature"),
            resultSet.getInt("revision")
        ))
        .optional();
  }

  Optional<String> lockBoundaryStatus(String marketId, int revision) {
    return jdbcClient.sql("""
            SELECT status::text
            FROM market_boundaries
            WHERE market_id = :market_id
              AND revision = :revision
            FOR UPDATE
            """)
        .param("market_id", marketId)
        .param("revision", revision)
        .query(String.class)
        .optional();
  }

  void retireVerifiedBoundary(String marketId) {
    jdbcClient.sql("""
            UPDATE market_boundaries
            SET status = 'retired',
                valid_to = now(),
                updated_at = now()
            WHERE market_id = :market_id
              AND status = 'verified'
            """)
        .param("market_id", marketId)
        .update();
  }

  void verifyBoundary(String marketId, int revision) {
    int updated = jdbcClient.sql("""
            UPDATE market_boundaries
            SET status = 'verified',
                valid_from = now(),
                valid_to = NULL,
                verified_at = now(),
                updated_at = now()
            WHERE market_id = :market_id
              AND revision = :revision
              AND status = 'draft'
            """)
        .param("market_id", marketId)
        .param("revision", revision)
        .update();

    if (updated != 1) {
      throw new BoundaryConflictException("draft 경계를 verified로 전환하지 못했습니다.");
    }
  }

  List<MarketSummary> listVerifiedMarkets(String regionCode) {
    String regionPredicate = regionCode == null
        ? ""
        : "AND market.region_code = :region_code";

    JdbcClient.StatementSpec statement = jdbcClient.sql("""
        SELECT
          market.id,
          market.name,
          market.region_code,
          boundary.revision AS boundary_revision
        FROM markets market
        JOIN market_boundaries boundary
          ON boundary.market_id = market.id
         AND boundary.status = 'verified'
        WHERE 1 = 1
          %s
        ORDER BY market.name, market.id
        """.formatted(regionPredicate));

    if (regionCode != null) {
      statement = statement.param("region_code", regionCode);
    }

    return statement.query((resultSet, rowNumber) -> new MarketSummary(
            resultSet.getString("id"),
            resultSet.getString("name"),
            resultSet.getString("region_code"),
            resultSet.getInt("boundary_revision")
        ))
        .list();
  }

  private String boundaryFeatureSql(String predicate) {
    return """
        SELECT jsonb_build_object(
          'type', 'Feature',
          'id', boundary.market_id || '-r' || boundary.revision,
          'properties', jsonb_build_object(
            'marketId', market.id,
            'name', market.name,
            'regionCode', market.region_code,
            'revision', boundary.revision,
            'status', boundary.status::text
          ),
          'geometry', CAST(ST_AsGeoJSON(boundary.boundary) AS jsonb)
        )::text
        FROM market_boundaries boundary
        JOIN markets market ON market.id = boundary.market_id
        WHERE %s
        """.formatted(predicate);
  }

  record GeometryValidation(boolean valid, String reason) {
  }
}
