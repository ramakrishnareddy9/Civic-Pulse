package com.civicpulse.service.complaint;

import com.civicpulse.model.entity.Complaint;
import com.civicpulse.model.entity.EscalationLog;
import com.civicpulse.model.enums.ComplaintStatus;
import com.civicpulse.repository.ComplaintRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EscalationServiceImpl {

    private final ComplaintRepository complaintRepository;
    private final EntityManager entityManager;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final com.civicpulse.service.mail.MailService mailService;
    private final com.civicpulse.repository.OfficerRepository officerRepository;

    @Transactional
    public int escalateBreachedComplaints() {
        List<Complaint> breached = complaintRepository.findSlaBreached(
            LocalDateTime.now(),
            java.util.List.of(
                com.civicpulse.model.enums.ComplaintStatus.RESOLVED,
                com.civicpulse.model.enums.ComplaintStatus.CLOSED,
                com.civicpulse.model.enums.ComplaintStatus.REJECTED,
                com.civicpulse.model.enums.ComplaintStatus.ESCALATED,
                com.civicpulse.model.enums.ComplaintStatus.IN_PROGRESS));
        int count = 0;

        for (Complaint complaint : breached) {
            try {
                complaint.setStatus(ComplaintStatus.ESCALATED);

                // Attempt to reassign to department head or next available officer
                com.civicpulse.model.entity.Officer previous = complaint.getOfficer();
                com.civicpulse.model.entity.Officer newOfficer = null;
                    try {
                        if (complaint.getDepartment() != null) {
                            java.util.List<com.civicpulse.model.entity.Officer> deptOfficers = officerRepository.findByDepartmentIdAndIsActiveTrue(complaint.getDepartment().getId());
                            if (!deptOfficers.isEmpty()) newOfficer = deptOfficers.get(0);
                        }
                    } catch (Exception ex) {
                        log.warn("Failed to find replacement officer: {}", ex.getMessage());
                    }

                EscalationLog elog = EscalationLog.builder()
                        .complaint(complaint)
                        .fromOfficer(previous)
                        .toOfficer(newOfficer)
                        .reason("SLA deadline breached at " + LocalDateTime.now())
                        .build();
                entityManager.persist(elog);

                if (newOfficer != null) complaint.setOfficer(newOfficer);

                complaintRepository.save(complaint);
                count++;
                EscalationServiceImpl.log.info("Escalated complaint {} (SLA breached)", complaint.getId());

                // Notify new officer via websocket and email
                try {
                    if (newOfficer != null && newOfficer.getUser() != null) {
                        messagingTemplate.convertAndSendToUser(
                                newOfficer.getUser().getEmail(),
                                "/queue/assignments",
                                "A complaint #" + complaint.getId() + " has been escalated and assigned to you."
                        );
                        mailService.sendComplaintStatusUpdateEmail(newOfficer.getUser().getEmail(), newOfficer.getUser().getFullName(), complaint.getId(), complaint.getTitle(), complaint.getStatus().name(), ComplaintStatus.ESCALATED.name(), "Assigned via escalation");
                    }
                } catch (Exception ex) {
                    log.warn("Failed to notify new officer: {}", ex.getMessage());
                }

                // Notify department head via email (if known)
                try {
                    if (complaint.getDepartment() != null && complaint.getDepartment().getHeadEmail() != null) {
                        mailService.sendComplaintStatusUpdateEmail(complaint.getDepartment().getHeadEmail(), "Department Head", complaint.getId(), complaint.getTitle(), complaint.getStatus().name(), ComplaintStatus.ESCALATED.name(), "Department notified of escalation");
                    }
                } catch (Exception ex) {
                    log.warn("Failed to notify department head: {}", ex.getMessage());
                }

                // Notify citizen
                try {
                    messagingTemplate.convertAndSendToUser(
                            complaint.getCitizen().getEmail(),
                            "/queue/complaint-updates",
                            "Your complaint #" + complaint.getId() + " has been escalated. We have assigned a new officer."
                    );
                    mailService.sendComplaintStatusUpdateEmail(
                            complaint.getCitizen().getEmail(),
                            complaint.getCitizen().getFullName(),
                            complaint.getId(),
                            complaint.getTitle(),
                            complaint.getStatus().name(),
                            ComplaintStatus.ESCALATED.name(),
                            "Escalated due to SLA breach"
                    );
                } catch (Exception ex) {
                    log.warn("Failed to notify citizen about escalation {}: {}", complaint.getId(), ex.getMessage());
                }
            } catch (Exception ex) {
                EscalationServiceImpl.log.error("Failed to escalate complaint {}: {}",
                        complaint.getId(), ex.getMessage());
            }
        }
        return count;
    }
}
