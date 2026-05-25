package com.civicpulse.model.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AiChatRequestDto(
        @NotBlank
        String message,
        String userId
) {}
