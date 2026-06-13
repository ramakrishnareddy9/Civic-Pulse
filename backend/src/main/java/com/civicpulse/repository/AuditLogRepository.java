package com.civicpulse.repository;

import com.civicpulse.model.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Find audit logs for a specific entity
     */
    Page<AuditLog> findByEntityTypeAndEntityIdOrderByPerformedAtDesc(String entityType, Long entityId, Pageable pageable);

    /**
     * Find audit logs for a specific action
     */
    Page<AuditLog> findByActionOrderByPerformedAtDesc(String action, Pageable pageable);

    /**
     * Find audit logs performed by a user
     */
    Page<AuditLog> findByPerformedByIdOrderByPerformedAtDesc(Long userId, Pageable pageable);

    /**
     * Find sensitive actions (DELETE, REASSIGN, STATUS_UPDATE) for compliance/auditing
     */
    @Query("SELECT al FROM AuditLog al WHERE al.action IN ('DELETE_COMPLAINT', 'UPDATE_STATUS', 'REASSIGN_OFFICER', 'DELETE_DEPARTMENT', 'DELETE_OFFICER') " +
            "ORDER BY al.performedAt DESC")
    Page<AuditLog> findSensitiveActions(Pageable pageable);

    /**
     * Find audit logs within a date range
     */
    List<AuditLog> findByPerformedAtBetweenOrderByPerformedAtDesc(LocalDateTime startDate, LocalDateTime endDate);
}
