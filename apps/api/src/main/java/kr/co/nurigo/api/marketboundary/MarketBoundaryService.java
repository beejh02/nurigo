package kr.co.nurigo.api.marketboundary;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.json.JsonMapper;

@Service
public class MarketBoundaryService {

  private final MarketBoundaryJdbcStore store;
  private final GeoJsonBoundaryValidator validator;
  private final JsonMapper jsonMapper;

  MarketBoundaryService(
      MarketBoundaryJdbcStore store,
      GeoJsonBoundaryValidator validator,
      JsonMapper jsonMapper
  ) {
    this.store = store;
    this.validator = validator;
    this.jsonMapper = jsonMapper;
  }

  @Transactional
  public String createMarketWithDraft(NewMarketBoundaryDraftFeature request) {
    MarketBoundaryDraftFeature feature = request.boundaryFeature();
    validator.validate(feature);

    String geometryJson = jsonMapper.writeValueAsString(feature.geometry());
    String sourceJson = jsonMapper.writeValueAsString(validator.source(feature));
    MarketBoundaryJdbcStore.GeometryValidation validation =
        store.validateGeometry(geometryJson);

    if (!validation.valid()) {
      throw new InvalidBoundaryException(
          "PostGIS geometry 검증에 실패했습니다: " + validation.reason()
      );
    }

    String marketId = "market-" + UUID.randomUUID();
    store.insertMarket(
        marketId,
        request.properties().name().trim(),
        request.properties().regionCode().trim()
    );
    store.insertDraft(marketId, 1, geometryJson, sourceJson);

    return store.findBoundaryFeature(marketId, 1)
        .orElseThrow(() -> new BoundaryNotFoundException(marketId, 1));
  }

  @Transactional
  public String createDraft(String marketId, MarketBoundaryDraftFeature feature) {
    validator.validate(feature);

    if (!store.lockMarket(marketId)) {
      throw new MarketNotFoundException(marketId);
    }

    String geometryJson = jsonMapper.writeValueAsString(feature.geometry());
    String sourceJson = jsonMapper.writeValueAsString(validator.source(feature));
    MarketBoundaryJdbcStore.GeometryValidation validation =
        store.validateGeometry(geometryJson);

    if (!validation.valid()) {
      throw new InvalidBoundaryException(
          "PostGIS geometry 검증에 실패했습니다: " + validation.reason()
      );
    }

    int revision = store.nextRevision(marketId);
    store.insertDraft(marketId, revision, geometryJson, sourceJson);

    return store.findBoundaryFeature(marketId, revision)
        .orElseThrow(() -> new BoundaryNotFoundException(marketId, revision));
  }

  @Transactional
  public String verify(String marketId, int revision) {
    if (!store.lockMarket(marketId)) {
      throw new MarketNotFoundException(marketId);
    }

    String status = store.lockBoundaryStatus(marketId, revision)
        .orElseThrow(() -> new BoundaryNotFoundException(marketId, revision));

    if (!"draft".equals(status)) {
      throw new BoundaryConflictException(
          "draft 상태의 경계만 검수할 수 있습니다. 현재 상태: " + status
      );
    }

    store.retireVerifiedBoundary(marketId);
    store.verifyBoundary(marketId, revision);

    return store.findBoundaryFeature(marketId, revision)
        .orElseThrow(() -> new BoundaryNotFoundException(marketId, revision));
  }

  @Transactional(readOnly = true)
  public VerifiedMarketBoundary getVerified(String marketId) {
    return store.findVerifiedBoundaryFeature(marketId)
        .orElseThrow(() -> new BoundaryNotFoundException(marketId));
  }

  @Transactional(readOnly = true)
  public List<MarketSummary> listMarkets(String regionCode) {
    String normalizedRegionCode = regionCode == null || regionCode.isBlank()
        ? null
        : regionCode.trim();

    return store.listVerifiedMarkets(normalizedRegionCode);
  }
}
