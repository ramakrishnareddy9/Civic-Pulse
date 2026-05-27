package com.civicpulse.scheduler;

import com.civicpulse.repository.ComplaintRepository;
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
    private final ComplaintRepository complaintRepository;

    @Scheduled(fixedDelay = 900_000) // every 15 minutes
    public void checkSlaBreaches() {
        log.info("Running SLA breach check...");
        int escalated = escalationService.escalateBreachedComplaints();
        log.info("SLA check complete. Escalated {} complaints.", escalated);

        // Auto-close resolved complaints that haven't been approved by citizen after 72 hours
        try {
            java.time.LocalDateTime cutoff = java.time.LocalDateTime.now().minusHours(72);
            java.util.List<com.civicpulse.model.entity.Complaint> toClose = complaintRepository.findAll().stream()
                    .filter(c -> c.getStatus() == com.civicpulse.model.enums.ComplaintStatus.RESOLVED)
                    .filter(c -> Boolean.FALSE.equals(c.getCitizenApproved()))
                    .filter(c -> c.getResolvedAt() != null && c.getResolvedAt().isBefore(cutoff))
                    .toList();
            int closed = 0;
            for (com.civicpulse.model.entity.Complaint c : toClose) {
                c.setStatus(com.civicpulse.model.enums.ComplaintStatus.CLOSED);
                complaintRepository.save(c);
                closed++;
                log.info("Auto-closed complaint {} after citizen approval window", c.getId());
            }
            if (closed > 0) log.info("Auto-closed {} complaints after approval window", closed);
        } catch (Exception ex) {
            log.warn("Auto-close check failed: {}", ex.getMessage());
        }
    }
}
