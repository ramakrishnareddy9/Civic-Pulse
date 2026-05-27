package com.civicpulse.service.geo;

import com.civicpulse.model.entity.Ward;
import com.civicpulse.repository.WardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WardService {

    private final WardRepository wardRepository;

    public Ward detectWard(BigDecimal lat, BigDecimal lng) {
        if (lat == null || lng == null) return null;
        try {
            List<Ward> wards = wardRepository.findAll();
            if (wards.isEmpty()) return null;
            Ward closest = null;
            double minDist = Double.MAX_VALUE;
            for (Ward w : wards) {
                if (w.getLatitude() != null && w.getLongitude() != null) {
                    double dist = distance(lat.doubleValue(), lng.doubleValue(), w.getLatitude().doubleValue(), w.getLongitude().doubleValue());
                    if (dist < minDist) { minDist = dist; closest = w; }
                }
            }
            return closest;
        } catch (Exception ex) {
            log.warn("Ward detection failed: {}", ex.getMessage());
            return null;
        }
    }

    private double distance(double lat1, double lon1, double lat2, double lon2) {
        double theta = lon1 - lon2;
        double dist = Math.sin(Math.toRadians(lat1)) * Math.sin(Math.toRadians(lat2))
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.cos(Math.toRadians(theta));
        dist = Math.acos(Math.min(1.0, Math.max(-1.0, dist)));
        dist = Math.toDegrees(dist);
        dist = dist * 60 * 1.1515 * 1.609344;
        return dist;
    }
}
