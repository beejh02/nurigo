package kr.co.nurigo.api.marketboundary;

public class BoundaryConflictException extends MarketBoundaryException {

  BoundaryConflictException(String message) {
    super("BOUNDARY_STATE_CONFLICT", message);
  }
}
