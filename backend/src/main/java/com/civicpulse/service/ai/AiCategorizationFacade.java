package com.civicpulse.service.ai;

import com.civicpulse.model.dto.response.AiCategorizationResultDto;
import com.civicpulse.model.entity.Complaint;
import com.civicpulse.service.complaint.enrichment.AiCategorizationEnricher;
import com.civicpulse.service.complaint.enrichment.EnrichmentException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiCategorizationFacade {

    private final AiCategorizationEnricher enricher;

    public AiCategorizationResultDto categorize(String title, String description) {
        Complaint tmp = Complaint.builder().title(title).description(description).build();
        try {
            Complaint enriched = enricher.enrich(tmp);
            return new AiCategorizationResultDto(
                    enriched.getAiCategory() == null ? "OTHER" : enriched.getAiCategory(),
                    enriched.getAiPriority() == null ? "MEDIUM" : enriched.getAiPriority(),
                    enriched.getAiDepartment(),
                    enriched.getAiReason()
            );
        } catch (EnrichmentException ex) {
            // Enricher should already apply fallback; map to DTO
            return new AiCategorizationResultDto(
                    tmp.getAiCategory() == null ? "OTHER" : tmp.getAiCategory(),
                    tmp.getAiPriority() == null ? "MEDIUM" : tmp.getAiPriority(),
                    tmp.getAiDepartment(),
                    tmp.getAiReason()
            );
        }
    }
}
