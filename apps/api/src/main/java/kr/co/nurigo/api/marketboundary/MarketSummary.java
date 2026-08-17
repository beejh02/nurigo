package kr.co.nurigo.api.marketboundary;

public record MarketSummary(
    String id,
    String name,
    String regionCode,
    int boundaryRevision
) {
}
