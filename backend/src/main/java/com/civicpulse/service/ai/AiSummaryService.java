package com.civicpulse.service.ai;

import com.civicpulse.model.entity.Complaint;
import com.civicpulse.model.enums.ComplaintStatus;
import com.civicpulse.repository.ComplaintRepository;
import com.civicpulse.service.ai.provider.LlmProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiSummaryService {

        private final LlmProvider llmProvider;
    private final ComplaintRepository complaintRepository;

    @Transactional(readOnly = true)
    public String generateWardSummary(Long wardId) {
        List<Complaint> complaints = complaintRepository
                .findTop50ByWardIdAndStatusNotAndIsDeletedFalse(wardId, ComplaintStatus.RESOLVED);

        if (complaints.isEmpty()) {
            return "No open complaints found for this ward. Great news — all issues are resolved!";
        }

        String complaintsText = complaints.stream()
                .map(c -> "- [%s] %s (Priority: %s, Status: %s)".formatted(
                        c.getCategory(), c.getTitle(), c.getPriority(), c.getStatus()))
                .collect(Collectors.joining("\n"));

        try {
            String response = llmProvider.invokeText("""
                    You are an analyst for a municipal government officer.
                    Summarize these citizen complaints for Ward ID %s.
                    Group by category. Highlight urgent issues. Suggest 3-5 action items.
                    Be concise and structured.
                    """.formatted(wardId), """
                    Complaints:
                    %s
                    """.formatted(complaintsText));

            if (response != null && !response.isBlank() && !response.startsWith("[AI UNAVAILABLE]")) {
                return response;
            }
        } catch (Exception ex) {
            log.error("Ward summary generation failed for ward {}: {}", wardId, ex.getMessage(), ex);
        }

        return "AI summary temporarily unavailable. Please review the " + complaints.size() +
                " open complaints manually.";
    }
}
