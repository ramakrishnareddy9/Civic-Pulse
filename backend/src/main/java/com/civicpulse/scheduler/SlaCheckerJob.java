package com.civicpulse.scheduler;

import com.civicpulse.service.complaint.EscalationServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SlaCheckerJob {

    private final EscalationServiceImpl escalationService;

    @Scheduled(fixedDelay = 900_000) // every 15 minutes
    public void checkSlaBreaches() {
        log.info("Running SLA breach check...");
        int escalated = escalationService.escalateBreachedComplaints();
        log.info("SLA check complete. Escalated {} complaints.", escalated);
    }
}
