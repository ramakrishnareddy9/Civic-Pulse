package com.civicpulse.model.dto.response;

public record OfficerLeaderboardDto(
        Long officerId,
        String officerName,
        String departmentName,
        String wardName,
        Long totalResolved,
        Long totalAssigned,
        Double resolutionRate,
        Double avgResolutionHours,
        Integer rank
) {}
