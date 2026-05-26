package com.civicpulse.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record ComplaintRequestDto(
        @NotBlank @Size(min = 5, max = 255)
        String title,

        @NotBlank @Size(min = 10)
        String description,

        String category,

        BigDecimal latitude,
        BigDecimal longitude,
        String address,
        LocalDate incidentDate,
        LocalTime incidentTime,
        Long wardId,
        String ward
) {}
