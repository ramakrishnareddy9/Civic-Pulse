package com.civicpulse.model.dto.response;

import com.civicpulse.model.enums.ComplaintCategory;
import com.civicpulse.model.enums.ComplaintStatus;
import com.civicpulse.model.enums.Priority;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;

public record ComplaintResponseDto(
        Long id,
        String title,
        String description,
        ComplaintCategory category,
        ComplaintStatus status,
        Priority priority,
        BigDecimal latitude,
        BigDecimal longitude,
        String address,
        LocalDate incidentDate,
        LocalTime incidentTime,
        String wardName,
        Long wardId,
        String citizenName,
        Long citizenId,
        String officerName,
        Long officerId,
        String departmentName,
        Long departmentId,
        LocalDateTime slaDeadline,
        LocalDateTime resolvedAt,
        String officerNotes,
        String aiCategory,
        String aiPriority,
        String aiReason,
        BigDecimal sentimentScore,
        List<String> imageUrls,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Integer satisfactionRating,
        Boolean citizenApproved
) {}
