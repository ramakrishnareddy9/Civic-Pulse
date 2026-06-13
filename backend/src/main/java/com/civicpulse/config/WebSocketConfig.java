package com.civicpulse.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${CORS_ALLOWED_ORIGINS:}")
    private String corsAllowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(resolveAllowedOrigins().toArray(new String[0]))
                .withSockJS();
    }

    private List<String> resolveAllowedOrigins() {
        Set<String> origins = new LinkedHashSet<>();
        origins.add("http://localhost:3000");
        origins.add("http://localhost:5173");
        origins.add("http://127.0.0.1:3000");
        origins.add("http://127.0.0.1:5173");

        if (corsAllowedOrigins != null && !corsAllowedOrigins.isBlank()) {
            for (String origin : corsAllowedOrigins.split(",")) {
                String trimmed = origin.trim();
                if (!trimmed.isEmpty()) {
                    origins.add(trimmed);
                }
            }
        }

        return new ArrayList<>(origins);
    }
}
