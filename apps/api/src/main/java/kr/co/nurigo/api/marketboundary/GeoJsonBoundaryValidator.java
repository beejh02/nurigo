package kr.co.nurigo.api.marketboundary;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

@Component
public class GeoJsonBoundaryValidator {

  public void validate(MarketBoundaryDraftFeature feature) {
    if (feature == null) {
      throw new InvalidBoundaryException("GeoJSON Feature가 필요합니다.");
    }

    if (!"Feature".equals(feature.type())) {
      throw new InvalidBoundaryException("GeoJSON type은 Feature여야 합니다.");
    }

    if (feature.properties() == null) {
      throw new InvalidBoundaryException("properties가 필요합니다.");
    }

    validateSource(feature.properties());

    if (feature.geometry() == null) {
      throw new InvalidBoundaryException("geometry가 필요합니다.");
    }

    if (feature.geometry().coordinates() == null) {
      throw new InvalidBoundaryException("geometry.coordinates가 필요합니다.");
    }

    switch (feature.geometry().type()) {
      case "Polygon" -> validatePolygon(feature.geometry().coordinates(), "geometry.coordinates");
      case "MultiPolygon" -> validateMultiPolygon(feature.geometry().coordinates());
      default -> throw new InvalidBoundaryException(
          "geometry.type은 Polygon 또는 MultiPolygon이어야 합니다."
      );
    }
  }

  public Map<String, Object> source(MarketBoundaryDraftFeature feature) {
    Object source = feature.properties().get("source");

    if (source == null) {
      return Map.of();
    }

    if (!(source instanceof Map<?, ?> sourceMap)) {
      throw new InvalidBoundaryException("properties.source는 JSON object여야 합니다.");
    }

    Map<String, Object> normalizedSource = new LinkedHashMap<>();
    sourceMap.forEach((key, value) -> normalizedSource.put(String.valueOf(key), value));
    return Collections.unmodifiableMap(normalizedSource);
  }

  private void validateSource(Map<String, Object> properties) {
    Object source = properties.get("source");

    if (source != null && !(source instanceof Map<?, ?>)) {
      throw new InvalidBoundaryException("properties.source는 JSON object여야 합니다.");
    }
  }

  private void validateMultiPolygon(List<?> coordinates) {
    List<?> polygons = requireNonEmptyList(coordinates, "geometry.coordinates");

    for (int polygonIndex = 0; polygonIndex < polygons.size(); polygonIndex++) {
      validatePolygon(
          requireList(polygons.get(polygonIndex), "geometry.coordinates[" + polygonIndex + "]"),
          "geometry.coordinates[" + polygonIndex + "]"
      );
    }
  }

  private void validatePolygon(List<?> coordinates, String path) {
    List<?> rings = requireNonEmptyList(coordinates, path);

    for (int ringIndex = 0; ringIndex < rings.size(); ringIndex++) {
      validateLinearRing(
          requireList(rings.get(ringIndex), path + "[" + ringIndex + "]"),
          path + "[" + ringIndex + "]"
      );
    }
  }

  private void validateLinearRing(List<?> ring, String path) {
    if (ring.size() < 4) {
      throw new InvalidBoundaryException(path + "은 닫힌 좌표를 포함해 최소 4개 위치가 필요합니다.");
    }

    Position first = null;
    Position last = null;

    for (int positionIndex = 0; positionIndex < ring.size(); positionIndex++) {
      Position position = validatePosition(
          requireList(ring.get(positionIndex), path + "[" + positionIndex + "]"),
          path + "[" + positionIndex + "]"
      );

      if (positionIndex == 0) {
        first = position;
      }

      last = position;
    }

    if (!first.equals(last)) {
      throw new InvalidBoundaryException(path + "의 첫 위치와 마지막 위치가 같아야 합니다.");
    }
  }

  private Position validatePosition(List<?> position, String path) {
    if (position.size() != 2) {
      throw new InvalidBoundaryException(path + "은 [longitude, latitude] 두 값이어야 합니다.");
    }

    double longitude = requireFiniteNumber(position.get(0), path + "[0]");
    double latitude = requireFiniteNumber(position.get(1), path + "[1]");

    if (longitude < -180 || longitude > 180) {
      throw new InvalidBoundaryException(path + "의 longitude는 -180 이상 180 이하여야 합니다.");
    }

    if (latitude < -90 || latitude > 90) {
      throw new InvalidBoundaryException(path + "의 latitude는 -90 이상 90 이하여야 합니다.");
    }

    return new Position(longitude, latitude);
  }

  private double requireFiniteNumber(Object value, String path) {
    if (!(value instanceof Number number)) {
      throw new InvalidBoundaryException(path + "은 숫자여야 합니다.");
    }

    double result = number.doubleValue();

    if (!Double.isFinite(result)) {
      throw new InvalidBoundaryException(path + "은 유한한 숫자여야 합니다.");
    }

    return result;
  }

  private List<?> requireNonEmptyList(List<?> value, String path) {
    if (value.isEmpty()) {
      throw new InvalidBoundaryException(path + "은 비어 있을 수 없습니다.");
    }

    return value;
  }

  private List<?> requireList(Object value, String path) {
    if (!(value instanceof List<?> list)) {
      throw new InvalidBoundaryException(path + "은 JSON array여야 합니다.");
    }

    return list;
  }

  private record Position(double longitude, double latitude) {
  }
}
