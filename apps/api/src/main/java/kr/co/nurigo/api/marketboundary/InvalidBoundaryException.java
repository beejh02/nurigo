package kr.co.nurigo.api.marketboundary;

public class InvalidBoundaryException extends MarketBoundaryException {

  public InvalidBoundaryException(String message) {
    super("INVALID_BOUNDARY", message);
  }
}
