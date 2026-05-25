package com.civicpulse.repository;

import com.civicpulse.model.entity.SlaPolicy;
import com.civicpulse.model.enums.ComplaintCategory;
import com.civicpulse.model.enums.Priority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SlaRepository extends JpaRepository<SlaPolicy, Long> {
    Optional<SlaPolicy> findByCategoryAndPriorityAndIsActiveTrue(
            ComplaintCategory category, Priority priority);
}
