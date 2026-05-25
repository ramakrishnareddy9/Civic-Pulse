package com.civicpulse.scheduler;

import com.civicpulse.model.dto.response.CrisisAlertDto;
import com.civicpulse.service.analytics.AnalyticsServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CrisisDetectorJob {

    private final AnalyticsServiceImpl analyticsService;

    @Scheduled(cron = "0 0 * * * *") // every hour
    public void detectCrisis() {
        log.info("Running crisis detection scan...");
        List<CrisisAlertDto> alerts = analyticsService.detectCrisis(60, 50);
        if (!alerts.isEmpty()) {
            log.warn("CRISIS DETECTED! {} active crisis events found.", alerts.size());
            alerts.forEach(a -> log.warn("  Crisis: category={} ward={} count={}",
                    a.category(), a.wardName(), a.complaintCount()));
        } else {
            log.info("No crisis events detected.");
        }
    }
}
