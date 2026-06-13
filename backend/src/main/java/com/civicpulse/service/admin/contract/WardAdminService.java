package com.civicpulse.service.admin.contract;

import com.civicpulse.model.entity.Ward;

import java.util.List;

/**
 * Focused interface for ward management.
 */
public interface WardAdminService {

    Ward createWard(Ward ward);

    List<Ward> getAllWards();

    Ward updateWard(Long id, Ward ward);

    void deleteWard(Long id);
}