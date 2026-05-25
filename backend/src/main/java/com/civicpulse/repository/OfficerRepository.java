package com.civicpulse.repository;

import com.civicpulse.model.entity.Officer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OfficerRepository extends JpaRepository<Officer, Long> {
    Optional<Officer> findByUserId(Long userId);
    List<Officer> findByDepartmentIdAndIsActiveTrue(Long departmentId);
    List<Officer> findByWardIdAndIsActiveTrue(Long wardId);

    // Leaderboard query
    @Query(value = """
        SELECT o.id,
               u.full_name,
               d.name AS department_name,
               w.name AS ward_name,
               COUNT(CASE WHEN c.status = 'RESOLVED' THEN 1 END) AS total_resolved,
               COUNT(c.id) AS total_assigned,
               ROUND(
                 100.0 * COUNT(CASE WHEN c.status = 'RESOLVED' THEN 1 END)
                       / NULLIF(COUNT(c.id), 0), 2
               ) AS resolution_rate,
               AVG(CASE
                 WHEN c.status = 'RESOLVED'
                 THEN EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 3600
               END) AS avg_resolution_hours
        FROM officers o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN departments d ON o.department_id = d.id
        LEFT JOIN wards w ON o.ward_id = w.id
        LEFT JOIN complaints c ON c.officer_id = o.id AND c.is_deleted = false
        WHERE o.is_active = true
        GROUP BY o.id, u.full_name, d.name, w.name
        ORDER BY total_resolved DESC, resolution_rate DESC
        LIMIT 20
        """, nativeQuery = true)
    List<Object[]> findLeaderboard();
}
