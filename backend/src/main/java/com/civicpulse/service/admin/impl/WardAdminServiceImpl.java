package com.civicpulse.service.admin.impl;

import com.civicpulse.model.entity.Ward;
import com.civicpulse.repository.WardRepository;
import com.civicpulse.service.admin.contract.WardAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for ward administration.
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class WardAdminServiceImpl implements WardAdminService {

    private final WardRepository wardRepository;

    @Override
    public Ward createWard(Ward ward) {
        Ward saved = wardRepository.save(ward);
        log.info("Ward created: {} (ID: {})", ward.getName(), saved.getId());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Ward> getAllWards() {
        return wardRepository.findAll();
    }

    @Override
    public Ward updateWard(Long id, Ward ward) {
        Ward existing = wardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ward not found: " + id));

        existing.setName(ward.getName());
        existing.setCode(ward.getCode());
        existing.setCity(ward.getCity());
        existing.setState(ward.getState());
        existing.setLatitude(ward.getLatitude());
        existing.setLongitude(ward.getLongitude());

        Ward updated = wardRepository.save(existing);
        log.info("Ward updated: {} (ID: {})", id, ward.getName());
        return updated;
    }

    @Override
    public void deleteWard(Long id) {
        wardRepository.deleteById(id);
        log.info("Ward deleted: {}", id);
    }
}