package com.civicpulse.exception;

import com.civicpulse.model.enums.ComplaintStatus;

public class InvalidStateTransitionException extends RuntimeException {
    public InvalidStateTransitionException(ComplaintStatus from, ComplaintStatus to) {
        super("Invalid state transition from " + from + " to " + to);
    }
}
