package com.civicpulse.controller;

import com.civicpulse.model.dto.response.ApiResponseDto;
import com.civicpulse.model.dto.response.CrisisAlertDto;
import com.civicpulse.model.dto.response.HeatmapDataDto;
import com.civicpulse.model.dto.response.OfficerLeaderboardDto;
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
}
