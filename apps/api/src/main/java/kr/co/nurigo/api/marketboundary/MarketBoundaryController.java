package kr.co.nurigo.api.marketboundary;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
public class MarketBoundaryController {

  private static final MediaType GEO_JSON = MediaType.parseMediaType("application/geo+json");
  private static final String MARKET_ID_PATTERN = "^[a-z0-9]+(?:-[a-z0-9]+)*$";

  private final MarketBoundaryService service;

  MarketBoundaryController(MarketBoundaryService service) {
    this.service = service;
  }

  @GetMapping("/v1/markets")
  MarketsResponse listMarkets(@RequestParam(required = false) String regionCode) {
    return new MarketsResponse(service.listMarkets(regionCode));
  }

  @GetMapping(
      value = "/v1/markets/{marketId}/boundary",
      produces = "application/geo+json"
  )
  ResponseEntity<String> getVerifiedBoundary(
      @PathVariable @Pattern(regexp = MARKET_ID_PATTERN) String marketId
  ) {
    VerifiedMarketBoundary boundary = service.getVerified(marketId);

    return ResponseEntity.ok()
        .contentType(GEO_JSON)
        .eTag("\"" + marketId + "-r" + boundary.revision() + "\"")
        .body(boundary.feature());
  }

  @PostMapping(
      value = "/v1/admin/markets",
      consumes = "application/geo+json",
      produces = "application/geo+json"
  )
  ResponseEntity<String> createMarketWithDraft(
      @Valid @RequestBody NewMarketBoundaryDraftFeature feature
  ) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .contentType(GEO_JSON)
        .body(service.createMarketWithDraft(feature));
  }

  @PostMapping(
      value = "/v1/admin/markets/{marketId}/boundaries",
      consumes = "application/geo+json",
      produces = "application/geo+json"
  )
  ResponseEntity<String> createDraft(
      @PathVariable @Pattern(regexp = MARKET_ID_PATTERN) String marketId,
      @Valid @RequestBody MarketBoundaryDraftFeature feature
  ) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .contentType(GEO_JSON)
        .body(service.createDraft(marketId, feature));
  }

  @PostMapping(
      value = "/v1/admin/markets/{marketId}/boundaries/{revision}/verify",
      produces = "application/geo+json"
  )
  ResponseEntity<String> verify(
      @PathVariable @Pattern(regexp = MARKET_ID_PATTERN) String marketId,
      @PathVariable @Positive int revision
  ) {
    return ResponseEntity.ok()
        .contentType(GEO_JSON)
        .body(service.verify(marketId, revision));
  }
}
