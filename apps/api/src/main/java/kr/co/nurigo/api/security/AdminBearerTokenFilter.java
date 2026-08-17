package kr.co.nurigo.api.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class AdminBearerTokenFilter extends OncePerRequestFilter {

  private static final String ADMIN_PATH_PREFIX = "/v1/admin/";
  private static final String BEARER_PREFIX = "Bearer ";

  private final String configuredToken;

  public AdminBearerTokenFilter(
      @Value("${nurigo.security.admin-token:}") String configuredToken
  ) {
    this.configuredToken = configuredToken;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    return !request.getRequestURI().startsWith(ADMIN_PATH_PREFIX);
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain
  ) throws ServletException, IOException {
    if (!StringUtils.hasText(configuredToken)) {
      writeError(
          response,
          HttpServletResponse.SC_SERVICE_UNAVAILABLE,
          "ADMIN_AUTH_NOT_CONFIGURED",
          "관리자 API 인증 토큰이 서버에 설정되지 않았습니다."
      );
      return;
    }

    String authorization = request.getHeader("Authorization");

    if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
      writeError(
          response,
          HttpServletResponse.SC_UNAUTHORIZED,
          "UNAUTHORIZED",
          "Bearer 관리자 토큰이 필요합니다."
      );
      return;
    }

    String suppliedToken = authorization.substring(BEARER_PREFIX.length());

    if (!tokensMatch(configuredToken, suppliedToken)) {
      writeError(
          response,
          HttpServletResponse.SC_UNAUTHORIZED,
          "UNAUTHORIZED",
          "관리자 토큰이 올바르지 않습니다."
      );
      return;
    }

    filterChain.doFilter(request, response);
  }

  private boolean tokensMatch(String expected, String actual) {
    return MessageDigest.isEqual(
        expected.getBytes(StandardCharsets.UTF_8),
        actual.getBytes(StandardCharsets.UTF_8)
    );
  }

  private void writeError(
      HttpServletResponse response,
      int status,
      String code,
      String message
  ) throws IOException {
    response.setStatus(status);
    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
    response.setContentType("application/json");
    response.getWriter().write(
        "{\"code\":\"" + code + "\",\"message\":\"" + message + "\"}"
    );
  }
}
