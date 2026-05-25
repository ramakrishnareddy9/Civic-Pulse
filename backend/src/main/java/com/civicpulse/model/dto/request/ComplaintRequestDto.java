package com.civicpulse.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ComplaintRequestDto(
        @NotBlank @Size(min = 5, max = 255)
        String title,

        @NotBlank @Size(min = 10)
        String description,

        BigDecimal latitude,
        BigDecimal longitude,
        String address,
        Long wardId
) {}
