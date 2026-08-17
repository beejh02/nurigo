package kr.co.nurigo.api.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class AdminBearerTokenFilterTest {

  @Test
  void disablesAdminRoutesWhenServerTokenIsBlank() throws Exception {
    AdminBearerTokenFilter filter = new AdminBearerTokenFilter("");
    MockHttpServletRequest request = adminRequest();
    MockHttpServletResponse response = new MockHttpServletResponse();

    filter.doFilter(request, response, new MockFilterChain());

    assertThat(response.getStatus()).isEqualTo(503);
    assertThat(response.getContentAsString()).contains("ADMIN_AUTH_NOT_CONFIGURED");
  }

  @Test
  void rejectsWrongBearerToken() throws Exception {
    AdminBearerTokenFilter filter = new AdminBearerTokenFilter("expected-token");
    MockHttpServletRequest request = adminRequest();
    request.addHeader("Authorization", "Bearer wrong-token");
    MockHttpServletResponse response = new MockHttpServletResponse();

    filter.doFilter(request, response, new MockFilterChain());

    assertThat(response.getStatus()).isEqualTo(401);
  }

  @Test
  void allowsCorrectBearerToken() throws Exception {
    AdminBearerTokenFilter filter = new AdminBearerTokenFilter("expected-token");
    MockHttpServletRequest request = adminRequest();
    request.addHeader("Authorization", "Bearer expected-token");
    MockHttpServletResponse response = new MockHttpServletResponse();

    filter.doFilter(request, response, new MockFilterChain());

    assertThat(response.getStatus()).isEqualTo(200);
  }

  private MockHttpServletRequest adminRequest() {
    return new MockHttpServletRequest(
        "POST",
        "/v1/admin/markets/daejeon-jungang-market/boundaries"
    );
  }
}
