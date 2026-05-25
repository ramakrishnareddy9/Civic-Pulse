package com.civicpulse.service.ai.provider;

/**
 * Exception thrown when LLM provider operations fail.
 * Separates LLM errors from business logic.
 */
public class LlmProviderException extends Exception {

    public LlmProviderException(String message) {
        super(message);
    }

    public LlmProviderException(String message, Throwable cause) {
        super(message, cause);
    }

    public enum ErrorType {
        UNAVAILABLE,
        INVALID_REQUEST,
        API_ERROR,
        TIMEOUT,
        PARSE_ERROR,
        RATE_LIMIT
    }

    private final ErrorType errorType;

    public LlmProviderException(String message, ErrorType errorType) {
        super(message);
        this.errorType = errorType;
    }

    public LlmProviderException(String message, ErrorType errorType, Throwable cause) {
        super(message, cause);
        this.errorType = errorType;
    }

    public ErrorType getErrorType() {
        return errorType;
    }
}
