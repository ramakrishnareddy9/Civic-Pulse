package com.civicpulse.service.complaint.enrichment;

/**
 * Exception thrown during complaint enrichment process.
 * Allows graceful degradation if some enrichment steps fail.
 */
public class EnrichmentException extends Exception {

    public enum Severity {
        LOW,      // Non-critical, can skip
        MEDIUM,   // Important but not blocking
        HIGH      // Should block complaint submission
    }

    private final Severity severity;
    private final String enricherName;

    public EnrichmentException(String message, String enricherName, Severity severity) {
        super(message);
        this.enricherName = enricherName;
        this.severity = severity;
    }

    public EnrichmentException(String message, String enricherName, Severity severity, Throwable cause) {
        super(message, cause);
        this.enricherName = enricherName;
        this.severity = severity;
    }

    public Severity getSeverity() {
        return severity;
    }

    public String getEnricherName() {
        return enricherName;
    }
}
