package kr.co.nurigo.api.marketboundary;

public class BoundaryNotFoundException extends MarketBoundaryException {

  BoundaryNotFoundException(String marketId, int revision) {
    super(
        "BOUNDARY_NOT_FOUND",
        "시장 경계를 찾을 수 없습니다: " + marketId + " revision " + revision
    );
  }

  BoundaryNotFoundException(String marketId) {
    super("BOUNDARY_NOT_FOUND", "검수된 시장 경계를 찾을 수 없습니다: " + marketId);
  }
}
