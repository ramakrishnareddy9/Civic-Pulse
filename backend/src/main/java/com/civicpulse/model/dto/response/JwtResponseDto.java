package com.civicpulse.model.dto.response;

public record JwtResponseDto(
        String accessToken,
        String refreshToken,
        String tokenType,
        Long expiresIn,
        String email,
        String fullName,
        String role
) {
    public JwtResponseDto(String accessToken, String refreshToken, Long expiresIn,
                          String email, String fullName, String role) {
        this(accessToken, refreshToken, "Bearer", expiresIn, email, fullName, role);
    }
}
