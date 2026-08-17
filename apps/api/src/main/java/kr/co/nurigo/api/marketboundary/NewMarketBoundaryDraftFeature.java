package kr.co.nurigo.api.marketboundary;

import java.util.LinkedHashMap;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record NewMarketBoundaryDraftFeature(
    @NotBlank String type,
    @NotNull @Valid Properties properties,
    @NotNull @Valid MarketBoundaryDraftFeature.Geometry geometry
) {

  public record Properties(
      @NotBlank @Size(max = 100) String name,
      @NotBlank
      @Size(max = 50)
      @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$")
      String regionCode,
      Map<String, Object> source
  ) {
  }

  MarketBoundaryDraftFeature boundaryFeature() {
    Map<String, Object> boundaryProperties = new LinkedHashMap<>();

    if (properties.source() != null) {
      boundaryProperties.put("source", properties.source());
    }

    return new MarketBoundaryDraftFeature(
        type,
        boundaryProperties,
        geometry
    );
  }
}
