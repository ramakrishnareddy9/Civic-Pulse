package com.civicpulse.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnExpression("T(org.springframework.util.StringUtils).hasText('${OPENAI_API_KEY:}')")
public class SpringAiConfig {

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder
                .defaultSystem("You are CivicBot, an AI assistant for the CivicPulse grievance management platform.")
                .build();
    }
}
