package com.civicpulse.service.analytics;

import com.civicpulse.model.dto.response.CrisisAlertDto;
import com.civicpulse.model.dto.response.HeatmapDataDto;
import com.civicpulse.model.dto.response.OfficerLeaderboardDto;
import com.civicpulse.repository.ComplaintRepository;
import com.civicpulse.repository.OfficerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl {

    private final ComplaintRepository complaintRepository;
    private final OfficerRepository officerRepository;

    @Transactional(readOnly = true)
    public List<HeatmapDataDto> getHeatmapData() {
        List<Object[]> rows = complaintRepository.findHeatmapData();
        List<HeatmapDataDto> result = new ArrayList<>();

        for (Object[] row : rows) {
            Long total = ((Number) row[4]).longValue();
            Long open = row[5] != null ? ((Number) row[5]).longValue() : 0L;
            Long critical = row[6] != null ? ((Number) row[6]).longValue() : 0L;
            double intensity = total == 0 ? 0.0 : (open * 1.0 + critical * 2.0) / total;

            result.add(new HeatmapDataDto(
                    ((Number) row[0]).longValue(),
                    (String) row[1],
                    row[2] != null ? new BigDecimal(row[2].toString()) : null,
                    row[3] != null ? new BigDecimal(row[3].toString()) : null,
                    total, open, critical, intensity
            ));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<OfficerLeaderboardDto> getLeaderboard() {
        List<Object[]> rows = officerRepository.findLeaderboard();
        List<OfficerLeaderboardDto> result = new ArrayList<>();
        AtomicInteger rank = new AtomicInteger(1);

        for (Object[] row : rows) {
            result.add(new OfficerLeaderboardDto(
                    ((Number) row[0]).longValue(),
                    (String) row[1],
                    (String) row[2],
                    (String) row[3],
                    row[4] != null ? ((Number) row[4]).longValue() : 0L,
                    row[5] != null ? ((Number) row[5]).longValue() : 0L,
                    row[6] != null ? ((Number) row[6]).doubleValue() : 0.0,
                    row[7] != null ? ((Number) row[7]).doubleValue() : 0.0,
                    rank.getAndIncrement()
            ));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<CrisisAlertDto> detectCrisis(int thresholdMinutes, int threshold) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(thresholdMinutes);
        List<Object[]> rows = complaintRepository.findCrisisPatterns(since, threshold);
        List<CrisisAlertDto> alerts = new ArrayList<>();

        for (Object[] row : rows) {
            long count = ((Number) row[2]).longValue();
            String severity = count > 100 ? "CRITICAL" : count > 50 ? "HIGH" : "MEDIUM";
            alerts.add(new CrisisAlertDto(
                    (String) row[0],
                    row[1] != null ? ((Number) row[1]).longValue() : null,
                    "Ward",
                    count,
                    LocalDateTime.now(),
                    severity
            ));
        }
        return alerts;
    }
}
