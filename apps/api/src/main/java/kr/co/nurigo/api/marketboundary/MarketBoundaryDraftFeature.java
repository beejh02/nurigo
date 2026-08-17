package kr.co.nurigo.api.marketboundary;

import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MarketBoundaryDraftFeature(
    @NotBlank String type,
    @NotNull Map<String, Object> properties,
    @NotNull @Valid Geometry geometry
) {

  public record Geometry(
      @NotBlank String type,
      @NotNull List<?> coordinates
  ) {
  }
}
