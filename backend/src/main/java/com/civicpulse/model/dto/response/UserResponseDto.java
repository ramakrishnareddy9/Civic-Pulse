package com.civicpulse.model.dto.response;

public record UserResponseDto(
        Long id,
        String email,
        String fullName,
        String role,
        String phone,
        Boolean emailVerified,
        String address,
        Long wardId,
        String wardName
) {}
