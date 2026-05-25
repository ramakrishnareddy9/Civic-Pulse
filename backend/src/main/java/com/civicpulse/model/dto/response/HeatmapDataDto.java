package com.civicpulse.model.dto.response;

import java.math.BigDecimal;

public record HeatmapDataDto(
        Long wardId,
        String wardName,
        BigDecimal latitude,
        BigDecimal longitude,
        Long totalComplaints,
        Long openComplaints,
        Long criticalComplaints,
        Double intensityScore
) {}
