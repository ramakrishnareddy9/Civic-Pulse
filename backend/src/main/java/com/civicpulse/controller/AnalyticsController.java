package com.civicpulse.controller;

import com.civicpulse.model.dto.response.ApiResponseDto;
import com.civicpulse.model.dto.response.CrisisAlertDto;
import com.civicpulse.model.dto.response.HeatmapDataDto;
import com.civicpulse.model.dto.response.OfficerLeaderboardDto;
import com.civicpulse.repository.ComplaintRepository;
import com.civicpulse.repository.OfficerRepository;
import com.civicpulse.service.analytics.AnalyticsServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Heatmap, leaderboard, crisis and SLA analytics")
public class AnalyticsController {

    private final AnalyticsServiceImpl analyticsService;
    private final ComplaintRepository complaintRepository;
    private final OfficerRepository officerRepository;

    @GetMapping("/heatmap")
    @Operation(summary = "Ward-wise complaint density heatmap data")
    public ResponseEntity<ApiResponseDto<List<HeatmapDataDto>>> heatmap() {
        return ResponseEntity.ok(ApiResponseDto.success(analyticsService.getHeatmapData()));
    }

    @GetMapping("/leaderboard")
    @Operation(summary = "Officer performance leaderboard")
    public ResponseEntity<ApiResponseDto<List<OfficerLeaderboardDto>>> leaderboard() {
        return ResponseEntity.ok(ApiResponseDto.success(analyticsService.getLeaderboard()));
    }

    @GetMapping("/crisis-alerts")
    @Operation(summary = "Detect active crisis events (spike in complaints)")
    public ResponseEntity<ApiResponseDto<List<CrisisAlertDto>>> crisisAlerts(
            @RequestParam(defaultValue = "60") int windowMinutes,
            @RequestParam(defaultValue = "10") int threshold) {
        return ResponseEntity.ok(ApiResponseDto.success(
                analyticsService.detectCrisis(windowMinutes, threshold)));
    }

    @GetMapping("/complaints")
    @Operation(summary = "Complaint trend data by category and date range")
    public ResponseEntity<ApiResponseDto<java.util.Map<String, Object>>> complaintAnalytics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Long wardId,
            @RequestParam(required = false) Long departmentId) {

        int days = 30;
        if (startDate != null) {
            try {
                java.time.LocalDate start = java.time.LocalDate.parse(startDate);
                days = (int) java.time.temporal.ChronoUnit.DAYS.between(start, java.time.LocalDate.now());
                if (days < 1) days = 1;
            } catch (Exception ignored) {}
        }
        java.time.LocalDateTime since = java.time.LocalDateTime.now().minusDays(days);
        List<Object[]> trends = complaintRepository.findTrendData(since);

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("trendData", trends.stream().map(row -> {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("date", row[0]);
            m.put("category", row[1]);
            m.put("count", row[2]);
            return m;
        }).collect(java.util.stream.Collectors.toList()));
        result.put("periodDays", days);
        return ResponseEntity.ok(ApiResponseDto.success(result));
    }

    @GetMapping("/complaints-by-status")
    @Operation(summary = "Complaint counts grouped by status")
    public ResponseEntity<ApiResponseDto<java.util.List<java.util.Map<String, Object>>>> complaintsByStatus() {
        List<Object[]> rows = complaintRepository.findSlaComplianceByDepartment();
        java.util.List<java.util.Map<String, Object>> result = rows.stream().map(row -> {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("department", row[0]);
            m.put("total", row[1]);
            m.put("onTime", row[2]);
            m.put("breached", row[3]);
            return m;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponseDto.success(result));
    }

    @GetMapping("/sla-compliance")
    @Operation(summary = "SLA compliance report per department")
    public ResponseEntity<ApiResponseDto<java.util.List<java.util.Map<String, Object>>>> slaCompliance() {
        List<Object[]> rows = complaintRepository.findSlaComplianceByDepartment();
        java.util.List<java.util.Map<String, Object>> result = rows.stream().map(row -> {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("department", row[0]);
            m.put("total", row[1]);
            m.put("onTime", row[2]);
            m.put("breached", row[3]);
            long total = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            long onTime = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            m.put("complianceRate", total > 0 ? String.format(java.util.Locale.US, "%.1f%%", (onTime * 100.0) / total) : "N/A");
            return m;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponseDto.success(result));
    }

    @GetMapping("/performance")
    @Operation(summary = "Officer performance metrics with optional department filter")
    public ResponseEntity<ApiResponseDto<java.util.List<java.util.Map<String, Object>>>> performance(
            @RequestParam(required = false) Long departmentId) {
        List<Object[]> rows = officerRepository.findLeaderboard();
        java.util.List<java.util.Map<String, Object>> result = rows.stream()
                .map(row -> {
                    java.util.Map<String, Object> m = new java.util.HashMap<>();
                    m.put("officerId", row[0]);
                    m.put("fullName", row[1]);
                    m.put("departmentName", row[2]);
                    m.put("wardName", row[3]);
                    m.put("totalResolved", row[4]);
                    m.put("totalAssigned", row[5]);
                    m.put("resolutionRate", row[6]);
                    m.put("avgResolutionHours", row[7]);
                    return m;
                }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponseDto.success(result));
    }
}
