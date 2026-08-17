package kr.co.nurigo.api.marketboundary;

public class MarketNotFoundException extends MarketBoundaryException {

  MarketNotFoundException(String marketId) {
    super("MARKET_NOT_FOUND", "시장을 찾을 수 없습니다: " + marketId);
  }
}
