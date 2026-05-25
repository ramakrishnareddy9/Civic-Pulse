package com.civicpulse.service.ai.provider;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Spring AI implementation of LlmProvider.
 * Wraps Spring AI ChatClient to provide unified LLM abstraction.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SpringAiLlmProvider implements LlmProvider {

    private final ChatClient chatClient;

    @Override
    public <T> T invoke(String systemPrompt, String userMessage, Class<T> responseType)
            throws LlmProviderException {
        try {
            return chatClient.prompt()
                    .system(systemPrompt)
                    .user(userMessage)
                    .call()
                    .entity(responseType);
        } catch (Exception ex) {
            log.error("Spring AI invoke failed: {}", ex.getMessage(), ex);
            throw new LlmProviderException(
                    "LLM invocation failed: " + ex.getMessage(),
                    LlmProviderException.ErrorType.API_ERROR,
                    ex
            );
        }
    }

    @Override
    public <T> T invokeWithParams(String systemPrompt, String userMessage,
                                   Map<String, Object> parameters,
                                   Class<T> responseType) throws LlmProviderException {
        try {
            // Build prompt with parameters
            var prompt = chatClient.prompt()
                    .system(s -> s.text(systemPrompt).params(parameters))
                    .user(u -> u.text(userMessage).params(parameters));

            return prompt.call().entity(responseType);
        } catch (Exception ex) {
            log.error("Spring AI invokeWithParams failed: {}", ex.getMessage(), ex);
            throw new LlmProviderException(
                    "LLM invocation with parameters failed: " + ex.getMessage(),
                    LlmProviderException.ErrorType.API_ERROR,
                    ex
            );
        }
    }

    @Override
    public String invokeText(String systemPrompt, String userMessage) throws LlmProviderException {
        try {
            return chatClient.prompt()
                    .system(systemPrompt)
                    .user(userMessage)
                    .call()
                    .content();
        } catch (Exception ex) {
            log.error("Spring AI invokeText failed: {}", ex.getMessage(), ex);
            throw new LlmProviderException(
                    "LLM text invocation failed: " + ex.getMessage(),
                    LlmProviderException.ErrorType.API_ERROR,
                    ex
            );
        }
    }

    @Override
    public boolean isAvailable() {
        return chatClient != null;
    }

    @Override
    public String getProviderName() {
        return "SpringAI";
    }
}
