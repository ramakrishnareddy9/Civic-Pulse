package com.civicpulse.service.complaint;

import com.civicpulse.model.enums.ComplaintCategory;
import com.civicpulse.model.enums.Priority;

import java.time.LocalDateTime;

public interface SlaService {
    LocalDateTime calculateDeadline(ComplaintCategory category, Priority priority);
}
