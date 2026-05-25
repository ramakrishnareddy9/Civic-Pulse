package com.civicpulse.model.dto.response;

public record AiCategorizationResultDto(
        String category,
        String priority,
        String department,
        String reason
) {}
