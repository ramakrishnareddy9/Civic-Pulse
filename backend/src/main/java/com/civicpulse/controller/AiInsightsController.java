package com.civicpulse.controller;

import com.civicpulse.model.dto.response.ApiResponseDto;
import com.civicpulse.model.entity.AiInsight;
import com.civicpulse.model.enums.InsightType;
import com.civicpulse.repository.AiInsightRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/ai/insights")
@RequiredArgsConstructor
@Tag(name = "AI Insights", description = "Ward and system AI summaries")
public class AiInsightsController {

    private final AiInsightRepository aiInsightRepository;

    @GetMapping
    @Operation(summary = "List AI insights for a ward or by type")
    public ResponseEntity<ApiResponseDto<List<AiInsight>>> getInsights(
            @RequestParam(required = false) Long wardId,
            @RequestParam(required = false) InsightType type) {

        List<AiInsight> insights;
        if (wardId != null && type != null) {
            insights = aiInsightRepository.findByWardIdAndInsightTypeOrderByGeneratedAtDesc(wardId, type);
        } else if (wardId != null) {
            insights = aiInsightRepository.findByWardIdAndInsightTypeOrderByGeneratedAtDesc(wardId, InsightType.DAILY_SUMMARY);
        } else if (type != null) {
            insights = aiInsightRepository.findByInsightTypeOrderByGeneratedAtDesc(type);
        } else {
            insights = aiInsightRepository.findByGeneratedAtAfterOrderByGeneratedAtDesc(LocalDateTime.now().minusDays(7));
        }

        return ResponseEntity.ok(ApiResponseDto.success(insights));
    }
}