package com.civicpulse.exception;

public class DuplicateComplaintException extends RuntimeException {
    public DuplicateComplaintException(String message) {
        super(message);
    }
}