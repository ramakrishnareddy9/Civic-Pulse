package com.civicpulse.security;

import com.civicpulse.model.dto.response.ApiResponseDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

@Component
@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Duration WINDOW = Duration.ofMinutes(1);
    private static final int AUTH_LIMIT = 10;
    private static final int COMPLAINT_LIMIT = 5;

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        if (!shouldRateLimit(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String identifier = resolveIdentifier(request);
        int limit = isAuthRequest(request) ? AUTH_LIMIT : COMPLAINT_LIMIT;
        String key = "ratelimit:" + request.getRequestURI() + ':' + identifier + ':' + windowBucket();

        Long count = stringRedisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            stringRedisTemplate.expire(key, WINDOW);
        }

        if (count != null && count > limit) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(objectMapper.writeValueAsString(
                    ApiResponseDto.error("Too many requests. Please try again later.")));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean shouldRateLimit(HttpServletRequest request) {
        return isAuthRequest(request) || isComplaintSubmission(request);
    }

    private boolean isAuthRequest(HttpServletRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod())
                && (request.getRequestURI().endsWith("/api/auth/login")
                || request.getRequestURI().endsWith("/api/auth/register"));
    }

    private boolean isComplaintSubmission(HttpServletRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod())
                && (request.getRequestURI().endsWith("/api/complaints")
                || request.getRequestURI().endsWith("/api/complaints/submit"));
    }

    private String resolveIdentifier(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getName() != null) {
            return "user:" + authentication.getName();
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return "ip:" + forwardedFor.split(",")[0].trim();
        }

        return "ip:" + request.getRemoteAddr();
    }

    private String windowBucket() {
        return String.valueOf(System.currentTimeMillis() / WINDOW.toMillis());
    }
}