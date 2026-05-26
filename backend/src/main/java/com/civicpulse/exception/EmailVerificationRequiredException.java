package com.civicpulse.exception;

public class EmailVerificationRequiredException extends RuntimeException {
    public EmailVerificationRequiredException(String message) {
        super(message);
    }
}