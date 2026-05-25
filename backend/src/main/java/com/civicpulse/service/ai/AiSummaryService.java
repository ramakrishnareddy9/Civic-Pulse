package com.civicpulse.service.ai;

import com.civicpulse.model.entity.Complaint;
import com.civicpulse.model.enums.ComplaintStatus;
import com.civicpulse.repository.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiSummaryService {

    private final ChatClient chatClient;
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
            return chatClient.prompt()
                    .user(u -> u.text("""
                            You are an analyst for a municipal government officer.
                            Summarize these citizen complaints for Ward ID {wardId}.
                            Group by category. Highlight urgent issues. Suggest 3-5 action items.
                            Be concise and structured.
                            
                            Complaints:
                            {complaints}
                            """)
                            .param("wardId", wardId.toString())
                            .param("complaints", complaintsText))
                    .call()
                    .content();
        } catch (Exception ex) {
            log.error("Ward summary generation failed for ward {}: {}", wardId, ex.getMessage(), ex);
            return "AI summary temporarily unavailable. Please review the " + complaints.size() +
                   " open complaints manually.";
        }
    }
}
