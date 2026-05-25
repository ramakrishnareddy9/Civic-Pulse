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

    @Transactional
    public int escalateBreachedComplaints() {
        List<Complaint> breached = complaintRepository.findSlaBreached(LocalDateTime.now());
        int count = 0;

        for (Complaint complaint : breached) {
            try {
                complaint.setStatus(ComplaintStatus.ESCALATED);

                EscalationLog log = EscalationLog.builder()
                        .complaint(complaint)
                        .fromOfficer(complaint.getOfficer())
                        .reason("SLA deadline breached at " + LocalDateTime.now())
                        .build();
                entityManager.persist(log);

                complaintRepository.save(complaint);
                count++;
                EscalationServiceImpl.log.info("Escalated complaint {} (SLA breached)", complaint.getId());
            } catch (Exception ex) {
                EscalationServiceImpl.log.error("Failed to escalate complaint {}: {}",
                        complaint.getId(), ex.getMessage());
            }
        }
        return count;
    }
}
