package com.civicpulse.service.admin.contract;

import com.civicpulse.model.dto.request.OfficerOnboardingDto;
import com.civicpulse.model.entity.Officer;

import java.util.List;

/**
 * Focused interface for officer management.
 * Follows: Interface Segregation Principle
 */
public interface OfficerAdminService {

    /**
     * Onboard a new officer with department and ward assignment.
     *
     * @param dto Officer onboarding details
     * @return Onboarded officer
     */
    Officer onboardOfficer(OfficerOnboardingDto dto);

    /**
     * Get all officers.
     *
     * @return List of officers
     */
    List<Officer> getAllOfficers();

    /**
     * Get officers in a department.
     *
     * @param departmentId Department ID
     * @return Officers in department
     */
    List<Officer> getOfficersByDepartment(Long departmentId);

    /**
     * Get officers assigned to a ward.
     *
     * @param wardId Ward ID
     * @return Officers in ward
     */
    List<Officer> getOfficersByWard(Long wardId);

    /**
     * Update officer assignment.
     *
     * @param id       Officer ID
     * @param wardId   New ward ID (optional)
     * @param deptId   New department ID (optional)
     * @return Updated officer
     */
    Officer reassignOfficer(Long id, Long wardId, Long deptId);

    /**
     * Deactivate officer.
     *
     * @param id Officer ID
     */
    void deactivateOfficer(Long id);
}
