package com.civicpulse.scheduler;

import com.civicpulse.model.entity.Complaint;
import com.civicpulse.model.enums.ComplaintStatus;
import com.civicpulse.repository.ComplaintRepository;
import com.civicpulse.service.mail.MailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SlaWarningJob {

    private final ComplaintRepository complaintRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final MailService mailService;

    // Run frequently to catch upcoming deadlines (every 5 minutes)
    @Scheduled(fixedDelay = 300_000)
    public void sendSlaWarnings() {
        try {
            LocalDateTime now = LocalDateTime.now();

            // 2 hour warnings: deadlines between now and now + 2 hours
            LocalDateTime twoHourFrom = now.plusHours(2);
            List<Complaint> twoHour = complaintRepository.findBySlaDeadlineBetween(now, twoHourFrom);
            int sent2h = 0;
            for (Complaint c : twoHour) {
                if (Boolean.TRUE.equals(c.getIsDeleted())) continue;
                if (c.getStatus() == null) continue;
                if (!(c.getStatus() == ComplaintStatus.OPEN || c.getStatus() == ComplaintStatus.IN_PROGRESS)) continue;
                if (Boolean.TRUE.equals(c.getSlaWarn2hSent())) continue;
                if (c.getOfficer() != null && c.getOfficer().getUser() != null) {
                    String officerEmail = c.getOfficer().getUser().getEmail();
                    try {
                        messagingTemplate.convertAndSendToUser(officerEmail, "/queue/alerts",
                                "SLA Warning: Complaint #" + c.getId() + " is due within 2 hours.");
                        mailService.sendComplaintStatusUpdateEmail(
                                officerEmail,
                                c.getOfficer().getUser().getFullName(),
                                c.getId(), c.getTitle(), "PENDING", "SLA_2H", "SLA deadline approaching in 2 hours"
                        );
                    } catch (Exception ex) {
                        log.warn("Failed to notify officer {} for SLA 2h warning on complaint {}: {}", officerEmail, c.getId(), ex.getMessage());
                    }
                }
                c.setSlaWarn2hSent(true);
                complaintRepository.save(c);
                sent2h++;
            }

            // 30 minute warnings: deadlines between now and now + 30 minutes
            LocalDateTime thirtyMinFrom = now.plusMinutes(30);
            List<Complaint> thirty = complaintRepository.findBySlaDeadlineBetween(now, thirtyMinFrom);
            int sent30 = 0;
            for (Complaint c : thirty) {
                if (Boolean.TRUE.equals(c.getIsDeleted())) continue;
                if (c.getStatus() == null) continue;
                if (!(c.getStatus() == ComplaintStatus.OPEN || c.getStatus() == ComplaintStatus.IN_PROGRESS)) continue;
                if (Boolean.TRUE.equals(c.getSlaWarn30mSent())) continue;
                if (c.getOfficer() != null && c.getOfficer().getUser() != null) {
                    String officerEmail = c.getOfficer().getUser().getEmail();
                    try {
                        messagingTemplate.convertAndSendToUser(officerEmail, "/queue/alerts",
                                "SLA Escalation Pending: Complaint #" + c.getId() + " is due within 30 minutes.");
                        mailService.sendComplaintStatusUpdateEmail(
                                officerEmail,
                                c.getOfficer().getUser().getFullName(),
                                c.getId(), c.getTitle(), "PENDING", "SLA_30M", "SLA deadline within 30 minutes — escalate if unresolved"
                        );
                    } catch (Exception ex) {
                        log.warn("Failed to notify officer {} for SLA 30m warning on complaint {}: {}", officerEmail, c.getId(), ex.getMessage());
                    }
                }
                c.setSlaWarn30mSent(true);
                complaintRepository.save(c);
                sent30++;
            }

            if (sent2h > 0 || sent30 > 0) {
                log.info("SLA warnings sent: {} (2h), {} (30m)", sent2h, sent30);
            }
        } catch (Exception ex) {
            log.error("SLA warning job failed: {}", ex.getMessage(), ex);
        }
    }
}
