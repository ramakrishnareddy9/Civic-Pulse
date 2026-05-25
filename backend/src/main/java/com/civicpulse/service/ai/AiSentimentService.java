package com.civicpulse.service.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiSentimentService {

    private final ChatClient chatClient;

    /**
     * Returns urgency score 0.0–10.0 (higher = more urgent).
     */
    public BigDecimal scoreSentiment(String title, String description) {
        try {
            String response = chatClient.prompt()
                    .system("You are a sentiment analyzer for civic complaints. " +
                            "Return ONLY a number between 0.0 and 10.0. No text.")
                    .user(u -> u.text("""
                            Urgency score for this complaint (0=no urgency, 10=life-threatening emergency):
                            Title: {title}
                            Description: {description}
                            """)
                            .param("title", title)
                            .param("description", description))
                    .call()
                    .content();

            if (response != null) {
                return new BigDecimal(response.trim()).min(BigDecimal.TEN).max(BigDecimal.ZERO);
            }
        } catch (Exception ex) {
            log.warn("Sentiment scoring failed: {}", ex.getMessage());
        }
        return BigDecimal.valueOf(5.0);
    }
}
