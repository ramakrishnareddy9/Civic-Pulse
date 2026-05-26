package com.civicpulse.controller;

import com.civicpulse.model.dto.request.LoginRequestDto;
import com.civicpulse.model.dto.request.RegisterRequestDto;
import com.civicpulse.model.dto.response.ApiResponseDto;
import com.civicpulse.model.dto.response.JwtResponseDto;
import com.civicpulse.model.dto.response.UserResponseDto;
import com.civicpulse.model.entity.User;
import com.civicpulse.model.enums.UserRole;
import com.civicpulse.repository.UserRepository;
import com.civicpulse.security.JwtUtil;
import com.civicpulse.service.mail.MailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, logout")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final RedisTemplate<String, String> redisTemplate;
    private final MailService mailService;

    @PostMapping("/register")
    @Operation(summary = "Register a new citizen account")
    public ResponseEntity<ApiResponseDto<UserResponseDto>> register(
            @Valid @RequestBody RegisterRequestDto dto) {

        if (userRepository.existsByEmail(dto.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponseDto.error("Email already registered"));
        }

        User user = User.builder()
                .fullName(dto.fullName())
                .email(dto.email())
                .password(passwordEncoder.encode(dto.password()))
                .phone(dto.phone())
                .role(UserRole.CITIZEN)
                .emailVerified(false)
                .build();
        user = userRepository.save(user);

        String verificationToken = UUID.randomUUID().toString().replace("-", "");
        redisTemplate.opsForValue().set(
                "email-verify:" + verificationToken,
                user.getEmail(),
                24, TimeUnit.HOURS);
        mailService.sendEmailVerificationEmail(user.getEmail(), user.getFullName(), verificationToken);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponseDto.success(
                new UserResponseDto(
                        user.getId(),
                        user.getEmail(),
                        user.getFullName(),
                        user.getRole().name(),
                        user.getPhone(),
                        user.getEmailVerified(),
                        user.getAddress(),
                        user.getWard() != null ? user.getWard().getId() : null,
                        user.getWard() != null ? user.getWard().getName() : null
                ),
                "Registration successful. Please verify your email address."
        ));
    }

    @PostMapping("/login")
    @Operation(summary = "Login and receive JWT tokens")
    public ResponseEntity<ApiResponseDto<JwtResponseDto>> login(
            @Valid @RequestBody LoginRequestDto dto) {

        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.email(), dto.password()));

        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new IllegalStateException("User not found after auth"));

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
                        throw new com.civicpulse.exception.EmailVerificationRequiredException("Please verify your email before logging in");
        }

        String accessToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail(), user.getRole().name());

        return ResponseEntity.ok(ApiResponseDto.success(
                new JwtResponseDto(accessToken, refreshToken, jwtUtil.getExpirationMs(),
                        user.getEmail(), user.getFullName(), user.getRole().name()),
                "Login successful"
        ));
    }

    public record TokenRefreshRequestDto(
            @jakarta.validation.constraints.NotBlank
            String refreshToken
    ) {}

    public record ForgotPasswordRequestDto(
            @jakarta.validation.constraints.NotBlank
            String email
    ) {}

    public record ResetPasswordRequestDto(
            @jakarta.validation.constraints.NotBlank
            String token,
            @jakarta.validation.constraints.NotBlank
            String newPassword
    ) {}

    @GetMapping("/verify-email")
    @Operation(summary = "Verify a newly registered email address")
    public ResponseEntity<ApiResponseDto<Void>> verifyEmail(@RequestParam String token) {
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponseDto.error("Verification token is required"));
        }

        String email = redisTemplate.opsForValue().get("email-verify:" + token);
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDto.error("Invalid or expired verification token"));
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setEmailVerified(true);
        userRepository.save(user);
        redisTemplate.delete("email-verify:" + token);

        return ResponseEntity.ok(ApiResponseDto.success(null, "Email verified successfully"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout — blacklist the token in Redis")
    public ResponseEntity<ApiResponseDto<Void>> logout(
            @RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            redisTemplate.opsForValue().set(
                    "blacklist:" + token, "true",
                    jwtUtil.getExpirationMs(), TimeUnit.MILLISECONDS);
            log.info("Token blacklisted on logout");
        }
        return ResponseEntity.ok(ApiResponseDto.success(null, "Logged out successfully"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user info")
    public ResponseEntity<ApiResponseDto<UserResponseDto>> getMe(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponseDto.error("Not authenticated"));
        }
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(ApiResponseDto.success(
                new UserResponseDto(
                        user.getId(),
                        user.getEmail(),
                        user.getFullName(),
                        user.getRole().name(),
                        user.getPhone(),
                        user.getEmailVerified(),
                        user.getAddress(),
                        user.getWard() != null ? user.getWard().getId() : null,
                        user.getWard() != null ? user.getWard().getName() : null
                )
        ));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token using a refresh token")
    public ResponseEntity<ApiResponseDto<JwtResponseDto>> refresh(
            @RequestBody(required = false) TokenRefreshRequestDto body,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String token) {

        String refreshToken = null;
        if (body != null && body.refreshToken() != null && !body.refreshToken().isBlank()) {
            refreshToken = body.refreshToken();
        } else if (token != null && !token.isBlank()) {
            refreshToken = token;
        } else if (authHeader != null && authHeader.startsWith("Bearer ")) {
            refreshToken = authHeader.substring(7);
        }

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDto.error("Refresh token is required"));
        }

        Boolean isBlacklisted = redisTemplate.hasKey("blacklist:" + refreshToken);
        if (Boolean.TRUE.equals(isBlacklisted)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponseDto.error("Refresh token has been blacklisted"));
        }

        if (!jwtUtil.validateToken(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponseDto.error("Invalid or expired refresh token"));
        }

        String email = jwtUtil.extractEmail(refreshToken);
        String role = jwtUtil.extractRole(refreshToken);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String newAccessToken = jwtUtil.generateToken(email, role);
        String newRefreshToken = jwtUtil.generateRefreshToken(email, role);

        redisTemplate.opsForValue().set(
                "blacklist:" + refreshToken, "true",
                jwtUtil.getExpirationMs(), TimeUnit.MILLISECONDS);

        return ResponseEntity.ok(ApiResponseDto.success(
                new JwtResponseDto(newAccessToken, newRefreshToken, jwtUtil.getExpirationMs(),
                        user.getEmail(), user.getFullName(), user.getRole().name()),
                "Token refreshed successfully"
        ));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset token")
    public ResponseEntity<ApiResponseDto<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDto body) {
        if (body.email() == null || body.email().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponseDto.error("Email is required"));
        }

        userRepository.findByEmail(body.email()).ifPresent(user -> {
            String resetToken = UUID.randomUUID().toString().replace("-", "");
            redisTemplate.opsForValue().set(
                    "password-reset:" + resetToken,
                    user.getEmail(),
                    15, TimeUnit.MINUTES);
            mailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), resetToken);
            log.info("Password reset token generated for {}", user.getEmail());
        });

        return ResponseEntity.ok(ApiResponseDto.success(null,
                "If the email exists, password reset instructions have been sent"));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using a one-time token")
    public ResponseEntity<ApiResponseDto<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequestDto body) {
        if (body.token() == null || body.token().isBlank() || body.newPassword() == null || body.newPassword().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponseDto.error("Token and new password are required"));
        }

        String email = redisTemplate.opsForValue().get("password-reset:" + body.token());
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDto.error("Invalid or expired reset token"));
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPassword(passwordEncoder.encode(body.newPassword()));
        userRepository.save(user);
        redisTemplate.delete("password-reset:" + body.token());

        return ResponseEntity.ok(ApiResponseDto.success(null, "Password reset successful"));
    }
}
