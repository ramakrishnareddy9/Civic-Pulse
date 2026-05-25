package com.civicpulse.scheduler;

import com.civicpulse.model.entity.AiInsight;
import com.civicpulse.model.entity.Ward;
import com.civicpulse.model.enums.InsightType;
import com.civicpulse.repository.AiInsightRepository;
import com.civicpulse.repository.WardRepository;
import com.civicpulse.service.ai.AiSummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiDailySummaryJob {

    private final WardRepository wardRepository;
    private final AiSummaryService aiSummaryService;
    private final AiInsightRepository aiInsightRepository;

    @Scheduled(cron = "0 0 7 * * *") // 7 AM daily
    public void generateAiWardSummaries() {
        log.info("Generating AI ward summaries...");
        List<Ward> wards = wardRepository.findAll();

        for (Ward ward : wards) {
            try {
                String summary = aiSummaryService.generateWardSummary(ward.getId());
                AiInsight insight = AiInsight.builder()
                        .ward(ward)
                        .insightType(InsightType.DAILY_SUMMARY)
                        .content(summary)
                        .build();
                aiInsightRepository.save(insight);
                log.info("Generated AI summary for ward: {}", ward.getName());
            } catch (Exception ex) {
                log.error("Failed to generate AI summary for ward {}: {}", ward.getName(), ex.getMessage());
            }
        }
    }
}
