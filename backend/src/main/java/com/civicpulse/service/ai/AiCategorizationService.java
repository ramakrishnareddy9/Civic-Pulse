package com.civicpulse.service.ai;

import com.civicpulse.exception.AiServiceException;
import com.civicpulse.model.dto.response.AiCategorizationResultDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiCategorizationService {

    private final ChatClient chatClient;

    public AiCategorizationResultDto categorize(String title, String description) {
        try {
            return chatClient.prompt()
                    .system("""
                            You are a GovTech complaint classifier for Indian municipalities.
                            Analyze the complaint and return ONLY valid JSON with no markdown formatting.
                            """)
                    .user(u -> u.text("""
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
                            """)
                            .param("title", title)
                            .param("description", description))
                    .call()
                    .entity(AiCategorizationResultDto.class);
        } catch (Exception ex) {
            log.error("AI categorization failed: {}", ex.getMessage(), ex);
            // Fallback
            return new AiCategorizationResultDto("OTHER", "MEDIUM", "General Administration",
                    "AI categorization unavailable");
        }
    }
}
