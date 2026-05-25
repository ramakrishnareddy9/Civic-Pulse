package com.civicpulse.service.complaint.enrichment;

import com.civicpulse.model.entity.Complaint;
import com.civicpulse.model.enums.ComplaintCategory;
import com.civicpulse.model.enums.Priority;
import com.civicpulse.service.complaint.SlaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Enriches complaint with SLA deadline based on category and priority.
 * Responsible ONLY for SLA calculation — nothing else.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SlaCalculationEnricher implements ComplaintEnricher {

    private final SlaService slaService;

    @Override
    public Complaint enrich(Complaint complaint) throws EnrichmentException {
        try {
            if (complaint.getCategory() != null && complaint.getPriority() != null) {
                var deadline = slaService.calculateDeadline(
                        complaint.getCategory(),
                        complaint.getPriority()
                );
                complaint.setSlaDeadline(deadline);
                log.debug("Enriched complaint {} with SLA deadline: {}", 
                        complaint.getId(), deadline);
            }
            return complaint;
        } catch (Exception ex) {
            log.warn("SLA calculation failed: {}", ex.getMessage());
            throw new EnrichmentException(
                    "SLA calculation failed: " + ex.getMessage(),
                    getName(),
                    EnrichmentException.Severity.MEDIUM,
                    ex
            );
        }
    }

    @Override
    public String getName() {
        return "SlaCalculation";
    }

    @Override
    public boolean shouldApply(Complaint complaint) {
        return complaint.getCategory() != null && complaint.getPriority() != null;
    }
}
