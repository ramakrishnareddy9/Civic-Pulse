package com.civicpulse.service.ai;

import com.civicpulse.model.dto.response.AiCategorizationResultDto;
import com.civicpulse.service.ai.provider.LlmProvider;
import com.civicpulse.service.ai.provider.LlmProviderException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * AI Categorization Service (DEPRECATED).
 * Kept for backward compatibility. New code should use AiCategorizationEnricher instead.
 * 
 * This service now delegates to LlmProvider for technology flexibility.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Deprecated(since = "2.0", forRemoval = true)
public class AiCategorizationService {

    private final LlmProvider llmProvider;

    public AiCategorizationResultDto categorize(String title, String description) {
        try {
            var systemPrompt = """
                    You are a GovTech complaint classifier for Indian municipalities.
                    Analyze the complaint and return ONLY valid JSON with no markdown formatting.
                    """;

            var userPrompt = """
                    Classify this citizen complaint:
                    Title: {title}
                    Description: {description}
                    
                    Return JSON with exactly these fields:
                    {
                      "category": "ROAD|WATER|ELECTRICITY|SANITATION|DRAINAGE|NOISE|OTHER",
                      "priority": "LOW|MEDIUM|HIGH|CRITICAL",
                      "department": "department name string",
                      "reason": "brief reason string"
                    }
                    
                    Rules:
                    - CRITICAL if immediate safety risk
                    - HIGH if affects more than 10 people
                    - MEDIUM for standard issues
                    - LOW for aesthetic issues only
                    """;

            Map<String, Object> params = new HashMap<>();
            params.put("title", title);
            params.put("description", description);

            return llmProvider.invokeWithParams(
                    systemPrompt, userPrompt, params, AiCategorizationResultDto.class
            );
        } catch (LlmProviderException ex) {
            log.error("AI categorization failed: {}", ex.getMessage(), ex);
            // Fallback
            return new AiCategorizationResultDto("OTHER", "MEDIUM", "General Administration",
                    "AI categorization unavailable");
        }
    }
}
