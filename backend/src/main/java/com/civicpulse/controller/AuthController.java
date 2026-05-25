package com.civicpulse.controller;

import com.civicpulse.model.dto.request.LoginRequestDto;
import com.civicpulse.model.dto.request.RegisterRequestDto;
import com.civicpulse.model.dto.response.ApiResponseDto;
import com.civicpulse.model.dto.response.JwtResponseDto;
import com.civicpulse.model.entity.User;
import com.civicpulse.model.enums.UserRole;
import com.civicpulse.repository.UserRepository;
import com.civicpulse.security.JwtUtil;
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

    @PostMapping("/register")
    @Operation(summary = "Register a new citizen account")
    public ResponseEntity<ApiResponseDto<JwtResponseDto>> register(
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
                .build();
        userRepository.save(user);

        String accessToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail(), user.getRole().name());

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponseDto.success(
                new JwtResponseDto(accessToken, refreshToken, jwtUtil.getExpirationMs(),
                        user.getEmail(), user.getFullName(), user.getRole().name()),
                "Registration successful"
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

        String accessToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail(), user.getRole().name());

        return ResponseEntity.ok(ApiResponseDto.success(
                new JwtResponseDto(accessToken, refreshToken, jwtUtil.getExpirationMs(),
                        user.getEmail(), user.getFullName(), user.getRole().name()),
                "Login successful"
        ));
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
}
