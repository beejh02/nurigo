package kr.co.nurigo.api.marketboundary;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GeoJsonBoundaryValidatorTest {

  private final GeoJsonBoundaryValidator validator = new GeoJsonBoundaryValidator();

  @Test
  void acceptsPolygonWithHole() {
    MarketBoundaryDraftFeature feature = feature(
        "Polygon",
        List.of(
            ring(127.0, 36.0, 127.2, 36.2),
            ring(127.05, 36.05, 127.10, 36.10)
        )
    );

    assertThatNoException().isThrownBy(() -> validator.validate(feature));
  }

  @Test
  void acceptsMultiPolygon() {
    MarketBoundaryDraftFeature feature = feature(
        "MultiPolygon",
        List.of(
            List.of(ring(127.0, 36.0, 127.1, 36.1)),
            List.of(ring(127.2, 36.2, 127.3, 36.3))
        )
    );

    assertThatNoException().isThrownBy(() -> validator.validate(feature));
  }

  @Test
  void rejectsOpenLinearRing() {
    MarketBoundaryDraftFeature feature = feature(
        "Polygon",
        List.of(List.of(
            List.of(127.0, 36.0),
            List.of(127.1, 36.0),
            List.of(127.1, 36.1),
            List.of(127.0, 36.1)
        ))
    );

    assertThatThrownBy(() -> validator.validate(feature))
        .isInstanceOf(InvalidBoundaryException.class)
        .hasMessageContaining("첫 위치와 마지막 위치");
  }

  @Test
  void rejectsLatitudeLongitudeOrder() {
    MarketBoundaryDraftFeature feature = feature(
        "Polygon",
        List.of(List.of(
            List.of(36.0, 127.0),
            List.of(36.1, 127.0),
            List.of(36.1, 127.1),
            List.of(36.0, 127.0)
        ))
    );

    assertThatThrownBy(() -> validator.validate(feature))
        .isInstanceOf(InvalidBoundaryException.class)
        .hasMessageContaining("latitude");
  }

  @Test
  void rejectsNonObjectSource() {
    MarketBoundaryDraftFeature feature = new MarketBoundaryDraftFeature(
        "Feature",
        Map.of("source", "mobile"),
        new MarketBoundaryDraftFeature.Geometry(
            "Polygon",
            List.of(ring(127.0, 36.0, 127.1, 36.1))
        )
    );

    assertThatThrownBy(() -> validator.validate(feature))
        .isInstanceOf(InvalidBoundaryException.class)
        .hasMessageContaining("properties.source");
  }

  private MarketBoundaryDraftFeature feature(String type, List<?> coordinates) {
    return new MarketBoundaryDraftFeature(
        "Feature",
        Map.of("source", Map.of("method", "test")),
        new MarketBoundaryDraftFeature.Geometry(type, coordinates)
    );
  }

  private List<List<Double>> ring(
      double minimumLongitude,
      double minimumLatitude,
      double maximumLongitude,
      double maximumLatitude
  ) {
    return List.of(
        List.of(minimumLongitude, minimumLatitude),
        List.of(maximumLongitude, minimumLatitude),
        List.of(maximumLongitude, maximumLatitude),
        List.of(minimumLongitude, maximumLatitude),
        List.of(minimumLongitude, minimumLatitude)
    );
  }
}
