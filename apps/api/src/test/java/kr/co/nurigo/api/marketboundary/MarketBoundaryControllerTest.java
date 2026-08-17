package kr.co.nurigo.api.marketboundary;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MarketBoundaryControllerTest {

  private static final String MARKET_ID = "daejeon-jungang-market";
  private static final MediaType GEO_JSON = MediaType.parseMediaType("application/geo+json");
  private static final String FEATURE = """
      {
        "type": "Feature",
        "id": "daejeon-jungang-market-r1",
        "properties": {
          "marketId": "daejeon-jungang-market",
          "name": "대전중앙시장",
          "regionCode": "daejeon",
          "revision": 1,
          "status": "verified"
        },
        "geometry": {
          "type": "MultiPolygon",
          "coordinates": [[[[127.42,36.32],[127.44,36.32],[127.42,36.32]]]]
        }
      }
      """;

  @Mock
  private MarketBoundaryService service;

  @InjectMocks
  private MarketBoundaryController controller;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
  }

  @Test
  void returnsVerifiedBoundaryWithRevisionEtag() throws Exception {
    when(service.getVerified(MARKET_ID))
        .thenReturn(new VerifiedMarketBoundary(FEATURE, 1));

    var response = mockMvc.perform(get("/v1/markets/{marketId}/boundary", MARKET_ID))
        .andExpect(status().isOk())
        .andExpect(header().string("ETag", "\"daejeon-jungang-market-r1\""))
        .andReturn()
        .getResponse();

    assertThat(response.getContentType()).startsWith("application/geo+json");
    assertThat(response.getContentAsString()).contains("\"revision\": 1");
  }

  @Test
  void createsMarketAndFirstDraftAsGeoJson() throws Exception {
    when(service.createMarketWithDraft(any(NewMarketBoundaryDraftFeature.class)))
        .thenReturn(FEATURE.replace("verified", "draft"));

    var response = mockMvc.perform(post("/v1/admin/markets")
            .contentType(GEO_JSON)
            .accept(GEO_JSON)
            .content("""
                {
                  "type": "Feature",
                  "properties": {
                    "name": "문창전통시장",
                    "regionCode": "daejeon",
                    "source": {
                      "method": "test"
                    }
                  },
                  "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                      [127.42, 36.32],
                      [127.44, 36.32],
                      [127.44, 36.34],
                      [127.42, 36.32]
                    ]]
                  }
                }
                """))
        .andExpect(status().isCreated())
        .andReturn()
        .getResponse();

    assertThat(response.getContentType()).startsWith("application/geo+json");
    assertThat(response.getContentAsString()).contains("\"status\": \"draft\"");
  }

  @Test
  void createsDraftAsGeoJson() throws Exception {
    when(service.createDraft(any(), any(MarketBoundaryDraftFeature.class)))
        .thenReturn(FEATURE.replace("verified", "draft"));

    var response = mockMvc.perform(post("/v1/admin/markets/{marketId}/boundaries", MARKET_ID)
            .contentType(GEO_JSON)
            .accept(GEO_JSON)
            .content("""
                {
                  "type": "Feature",
                  "properties": {
                    "source": {
                      "method": "test"
                    }
                  },
                  "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                      [127.42, 36.32],
                      [127.44, 36.32],
                      [127.44, 36.34],
                      [127.42, 36.32]
                    ]]
                  }
                }
                """))
        .andExpect(status().isCreated())
        .andReturn()
        .getResponse();

    assertThat(response.getContentType()).startsWith("application/geo+json");
    assertThat(response.getContentAsString()).contains("\"status\": \"draft\"");
  }
}
