package com.civicpulse.service.complaint.enrichment;

import com.civicpulse.model.entity.Complaint;
import com.civicpulse.model.enums.ComplaintCategory;
import com.civicpulse.model.enums.Priority;
import com.civicpulse.model.dto.response.AiCategorizationResultDto;
import com.civicpulse.repository.DepartmentRepository;
import com.civicpulse.service.ai.provider.LlmProvider;
import com.civicpulse.service.ai.provider.LlmProviderException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Enriches complaint with AI-generated category, priority, and department assignment.
 * Responsible ONLY for AI categorization — nothing else.
 * 
 * Follows: Single Responsibility Principle
 * Depends on: LlmProvider abstraction (not concrete ChatClient)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AiCategorizationEnricher implements ComplaintEnricher {

    private final LlmProvider llmProvider;
    private final DepartmentRepository departmentRepository;

    @Override
    public Complaint enrich(Complaint complaint) throws EnrichmentException {
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
            params.put("title", complaint.getTitle());
            params.put("description", complaint.getDescription());

            AiCategorizationResultDto result = llmProvider.invokeWithParams(
                    systemPrompt, userPrompt, params, AiCategorizationResultDto.class
            );

            // Store raw AI results
            complaint.setAiCategory(result.category());
            complaint.setAiPriority(result.priority());
            complaint.setAiDepartment(result.department());
            complaint.setAiReason(result.reason());

            // Apply category
            try {
                complaint.setCategory(ComplaintCategory.valueOf(result.category()));
            } catch (IllegalArgumentException e) {
                complaint.setCategory(ComplaintCategory.OTHER);
            }

            // Apply priority
            try {
                complaint.setPriority(Priority.valueOf(result.priority()));
            } catch (IllegalArgumentException e) {
                complaint.setPriority(Priority.MEDIUM);
            }

            // Find and assign department
            if (result.department() != null && !result.department().isBlank()) {
                departmentRepository.findByName(result.department())
                        .ifPresent(complaint::setDepartment);
            }

            log.info("Enriched complaint {} with category: {}, priority: {}",
                    complaint.getId(), result.category(), result.priority());
            return complaint;

        } catch (LlmProviderException ex) {
            log.warn("AI categorization failed: {}", ex.getMessage());
            throw new EnrichmentException(
                    "AI categorization failed: " + ex.getMessage(),
                    getName(),
                    EnrichmentException.Severity.MEDIUM,  // Non-blocking — complaint can proceed
                    ex
            );
        }
    }

    @Override
    public String getName() {
        return "AiCategorization";
    }

    @Override
    public boolean shouldApply(Complaint complaint) {
        return complaint.getCategory() == null;  // Only if not already categorized
    }
}
