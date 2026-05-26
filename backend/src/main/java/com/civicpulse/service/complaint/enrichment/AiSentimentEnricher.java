package com.civicpulse.service.complaint.enrichment;

import com.civicpulse.model.entity.Complaint;
import com.civicpulse.service.ai.provider.LlmProvider;
import com.civicpulse.service.ai.provider.LlmProviderException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

import java.util.HashMap;
import java.util.Map;

/**
 * Enriches complaint with sentiment/urgency score using AI.
 * Responsible ONLY for sentiment analysis — nothing else.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AiSentimentEnricher implements ComplaintEnricher {

    private final LlmProvider llmProvider;

    @Override
    public Complaint enrich(Complaint complaint) throws EnrichmentException {
        try {
            var systemPrompt = """
                    Analyze the sentiment and urgency of this complaint.
                    Return a JSON with a score from 0 to 100 (0=not urgent, 100=critical).
                    """;

            var userPrompt = """
                    Title: {title}
                    Description: {description}
                    
                    Return JSON:
                    { "urgency_score": <0-100> }
                    """;

            Map<String, Object> params = new HashMap<>();
            params.put("title", complaint.getTitle());
            params.put("description", complaint.getDescription());

            SentimentScoreDto scoreDto = llmProvider.invokeWithParams(
                    systemPrompt, userPrompt, params, SentimentScoreDto.class
            );

            complaint.setSentimentScore(scoreDto.urgency_score() != null ? BigDecimal.valueOf(scoreDto.urgency_score()) : null);
            log.debug("Enriched complaint {} with sentiment score: {}", 
                    complaint.getId(), scoreDto.urgency_score());
            return complaint;

        } catch (LlmProviderException ex) {
            log.warn("Sentiment analysis failed: {}", ex.getMessage());
            // Use default sentiment if analysis fails (non-blocking)
            complaint.setSentimentScore(BigDecimal.valueOf(50));
            throw new EnrichmentException(
                    "Sentiment analysis failed: " + ex.getMessage(),
                    getName(),
                    EnrichmentException.Severity.LOW,
                    ex
            );
        }
    }

    @Override
    public String getName() {
        return "AiSentiment";
    }

    // Inner DTO for JSON parsing
    public record SentimentScoreDto(Integer urgency_score) { }
}
