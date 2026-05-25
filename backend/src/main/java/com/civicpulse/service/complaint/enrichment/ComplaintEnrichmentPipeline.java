package com.civicpulse.service.complaint.enrichment;

import com.civicpulse.model.entity.Complaint;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Orchestrates complaint enrichment using a pipeline of strategies.
 * Each enricher runs independently and can fail without blocking others (based on severity).
 * 
 * Follows: Chain of Responsibility Pattern + Decorator Pattern
 * Benefits:
 * - New enrichers can be added without modifying this class (Open/Closed Principle)
 * - Easy to reorder or conditionally include enrichers
 * - Failures in one enricher don't necessarily block the entire pipeline
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ComplaintEnrichmentPipeline {

    private final List<ComplaintEnricher> enrichers;

    /**
     * Execute enrichment pipeline on a complaint.
     * Low and MEDIUM severity failures are logged but don't block.
     * HIGH severity failures throw exception.
     *
     * @param complaint Complaint to enrich
     * @return Enriched complaint
     * @throws EnrichmentException If HIGH severity enricher fails
     */
    public Complaint enrich(Complaint complaint) throws EnrichmentException {
        for (ComplaintEnricher enricher : enrichers) {
            if (!enricher.shouldApply(complaint)) {
                log.debug("Skipping enricher {} for complaint {}", enricher.getName(), complaint.getId());
                continue;
            }

            try {
                log.debug("Applying enricher {} to complaint {}", enricher.getName(), complaint.getId());
                complaint = enricher.enrich(complaint);
                log.debug("Enricher {} completed successfully for complaint {}", 
                        enricher.getName(), complaint.getId());

            } catch (EnrichmentException ex) {
                if (ex.getSeverity() == EnrichmentException.Severity.HIGH) {
                    log.error("HIGH severity enrichment failed: {}", ex.getEnricherName(), ex);
                    throw ex;  // Block submission
                } else {
                    log.warn("Low severity enrichment failed (continuing): {} - {}",
                            ex.getEnricherName(), ex.getMessage());
                    // Continue with other enrichers
                }
            }
        }
        return complaint;
    }

    /**
     * Get list of active enrichers (for testing/debugging).
     */
    public List<String> getEnricherNames() {
        return enrichers.stream().map(ComplaintEnricher::getName).toList();
    }
}
