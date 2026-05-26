package com.civicpulse.repository;

import com.civicpulse.model.entity.Complaint;
import com.civicpulse.model.enums.ComplaintCategory;
import com.civicpulse.model.enums.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    Page<Complaint> findByCitizenIdAndIsDeletedFalse(Long citizenId, Pageable pageable);

    Page<Complaint> findByWardIdAndIsDeletedFalse(Long wardId, Pageable pageable);

    Page<Complaint> findByOfficerIdAndIsDeletedFalse(Long officerId, Pageable pageable);

    List<Complaint> findTop50ByWardIdAndStatusNotAndIsDeletedFalse(Long wardId, ComplaintStatus status);

        @Query("SELECT c FROM Complaint c WHERE c.isDeleted = false AND c.status IN ('OPEN', 'IN_PROGRESS') " +
            "AND c.category = :category AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL " +
            "AND c.createdAt >= :since")
        List<Complaint> findRecentOpenByCategory(@Param("category") ComplaintCategory category,
                               @Param("since") LocalDateTime since);

    // SLA breach check: status not resolved and deadline passed
        @Query("SELECT c FROM Complaint c WHERE c.status NOT IN :closedStatuses " +
           "AND c.slaDeadline < :now AND c.isDeleted = false")
        List<Complaint> findSlaBreached(@Param("now") LocalDateTime now,
                         @Param("closedStatuses") List<ComplaintStatus> closedStatuses);

    // Crisis detection: count complaints by category+ward in last N minutes
    @Query(value = """
        SELECT c.category, c.ward_id, COUNT(*) as cnt
        FROM complaints c
        WHERE c.created_at >= :since
          AND c.is_deleted = false
          AND c.ward_id IS NOT NULL
        GROUP BY c.category, c.ward_id
        HAVING COUNT(*) >= :threshold
        """, nativeQuery = true)
    List<Object[]> findCrisisPatterns(@Param("since") LocalDateTime since,
                                      @Param("threshold") int threshold);

    // Heatmap data
    @Query(value = """
        SELECT w.id, w.name, w.latitude, w.longitude,
               COUNT(c.id) as total,
               SUM(CASE WHEN c.status = 'OPEN' OR c.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as open_cnt,
               SUM(CASE WHEN c.priority = 'CRITICAL' THEN 1 ELSE 0 END) as critical_cnt
        FROM wards w
        LEFT JOIN complaints c ON c.ward_id = w.id AND c.is_deleted = false
        GROUP BY w.id, w.name, w.latitude, w.longitude
        """, nativeQuery = true)
    List<Object[]> findHeatmapData();

    // Trend data: complaints per day per category (last N days)
    @Query(value = """
        SELECT DATE(c.created_at) as day, c.category, COUNT(*) as cnt
        FROM complaints c
        WHERE c.created_at >= :since AND c.is_deleted = false
        GROUP BY DATE(c.created_at), c.category
        ORDER BY day ASC
        """, nativeQuery = true)
    List<Object[]> findTrendData(@Param("since") LocalDateTime since);

    // SLA compliance per department
    @Query(value = """
        SELECT d.name,
               COUNT(c.id) as total,
               SUM(CASE WHEN c.status = 'RESOLVED' AND c.resolved_at <= c.sla_deadline THEN 1 ELSE 0 END) as on_time,
               SUM(CASE WHEN c.status NOT IN ('RESOLVED','CLOSED') AND c.sla_deadline < NOW() THEN 1 ELSE 0 END) as breached
        FROM complaints c
        JOIN departments d ON c.department_id = d.id
        WHERE c.is_deleted = false
        GROUP BY d.name
        """, nativeQuery = true)
    List<Object[]> findSlaComplianceByDepartment();

    long countByCitizenId(Long citizenId);
    long countByStatus(ComplaintStatus status);

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.isDeleted = false")
    long countActive();
}
