package com.civicpulse.model.dto.response;

import java.time.LocalDateTime;

public record CrisisAlertDto(
        String category,
        Long wardId,
        String wardName,
        Long complaintCount,
        LocalDateTime detectedAt,
        String severity
) {}
