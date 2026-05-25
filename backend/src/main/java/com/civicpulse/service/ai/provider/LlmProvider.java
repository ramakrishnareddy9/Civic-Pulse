package com.civicpulse.service.ai.provider;

import com.civicpulse.model.dto.response.AiCategorizationResultDto;

/**
 * Abstraction for Language Model providers.
 * Allows swapping between different LLM providers (OpenAI, Anthropic, Local, etc.)
 * without modifying core business logic.
 */
public interface LlmProvider {

    /**
     * Invoke the LLM with a system prompt, user message, and request for typed response.
     *
     * @param systemPrompt System instruction for the model behavior
     * @param userMessage  User's actual query/request
     * @param responseType Class to deserialize response into
     * @param <T>          Response type
     * @return Parsed response object
     * @throws LlmProviderException If the LLM call fails
     */
    <T> T invoke(String systemPrompt, String userMessage, Class<T> responseType) throws LlmProviderException;

    /**
     * Invoke the LLM with parameters substitution.
     *
     * @param systemPrompt System instruction with {placeholder} markers
     * @param userMessage  User message with {placeholder} markers
     * @param parameters   Map of placeholder values
     * @param responseType Response type
     * @param <T>          Response type
     * @return Parsed response object
     */
    <T> T invokeWithParams(String systemPrompt, String userMessage,
                           java.util.Map<String, Object> parameters,
                           Class<T> responseType) throws LlmProviderException;

    /**
     * Simple text-only invocation (no structured output required).
     *
     * @param systemPrompt System instruction
     * @param userMessage  User message
     * @return Raw text response
     */
    String invokeText(String systemPrompt, String userMessage) throws LlmProviderException;

    /**
     * Indicates if this provider is available and configured.
     *
     * @return true if provider is ready to use
     */
    boolean isAvailable();

    /**
     * Provider name for logging/debugging.
     *
     * @return Name of the provider
     */
    String getProviderName();
}
