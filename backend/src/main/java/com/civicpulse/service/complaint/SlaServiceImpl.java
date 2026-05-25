package com.civicpulse.service.complaint;

import com.civicpulse.model.entity.SlaPolicy;
import com.civicpulse.model.enums.ComplaintCategory;
import com.civicpulse.model.enums.Priority;
import com.civicpulse.repository.SlaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SlaServiceImpl implements SlaService {

    private final SlaRepository slaRepository;
    private static final int DEFAULT_HOURS = 48;

    @Override
    public LocalDateTime calculateDeadline(ComplaintCategory category, Priority priority) {
        if (category == null || priority == null) {
            return LocalDateTime.now().plusHours(DEFAULT_HOURS);
        }

        Optional<SlaPolicy> policy = slaRepository
                .findByCategoryAndPriorityAndIsActiveTrue(category, priority);

        int hours = policy.map(SlaPolicy::getResolutionHours).orElse(DEFAULT_HOURS);
        return LocalDateTime.now().plusHours(hours);
    }
}
