package kr.co.nurigo.api.marketboundary;

public abstract class MarketBoundaryException extends RuntimeException {

  private final String code;

  protected MarketBoundaryException(String code, String message) {
    super(message);
    this.code = code;
  }

  public String code() {
    return code;
  }
}
