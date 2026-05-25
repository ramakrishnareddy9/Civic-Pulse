package com.civicpulse.repository;

import com.civicpulse.model.entity.AiInsight;
import com.civicpulse.model.enums.InsightType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AiInsightRepository extends JpaRepository<AiInsight, Long> {
    List<AiInsight> findByWardIdAndInsightTypeOrderByGeneratedAtDesc(
            Long wardId, InsightType insightType);
    List<AiInsight> findByGeneratedAtAfterOrderByGeneratedAtDesc(LocalDateTime since);
    List<AiInsight> findByInsightTypeOrderByGeneratedAtDesc(InsightType insightType);
}
