package com.civicpulse.service.complaint.enrichment;

import com.civicpulse.model.entity.Complaint;

/**
 * Strategy interface for complaint enrichment.
 * Each enricher is responsible for ONE aspect of complaint enhancement.
 * 
 * Follows: Single Responsibility Principle + Strategy Pattern
 * Benefits:
 * - Easy to add new enrichment strategies without modifying existing code
 * - Each enricher can be tested independently
 * - Enrichers can be composed in different pipelines
 */
public interface ComplaintEnricher {

    /**
     * Enrich a complaint with domain-specific data.
     *
     * @param complaint Complaint to enrich
     * @return Enriched complaint
     * @throws EnrichmentException If enrichment fails
     */
    Complaint enrich(Complaint complaint) throws EnrichmentException;

    /**
     * Name of this enricher for logging/debugging.
     *
     * @return Enricher name
     */
    String getName();

    /**
     * Indicates if this enricher should be applied.
     * Allows conditional enrichment based on complaint state.
     *
     * @param complaint Complaint to check
     * @return true if enricher should be applied
     */
    default boolean shouldApply(Complaint complaint) {
        return true;
    }
}
