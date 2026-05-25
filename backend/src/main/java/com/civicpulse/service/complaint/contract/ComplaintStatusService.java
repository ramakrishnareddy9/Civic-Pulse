package com.civicpulse.service.complaint.contract;

import com.civicpulse.model.dto.response.ComplaintResponseDto;

/**
 * Focused interface for complaint status update operations.
 * Clients using this interface only see update-related methods.
 * 
 * Follows: Interface Segregation Principle
 */
public interface ComplaintStatusService {

    /**
     * Update complaint status.
     *
     * @param complaintId Complaint ID
     * @param status      New status (OPEN, IN_PROGRESS, RESOLVED, ESCALATED)
     * @param notes       Optional update notes
     * @param userEmail   User making the update
     * @return Updated complaint
     * @throws com.civicpulse.exception.ComplaintNotFoundException If not found
     */
    ComplaintResponseDto updateStatus(Long complaintId,
                                     String status,
                                     String notes,
                                     String userEmail);

    /**
     * Soft-delete complaint (admin only).
     *
     * @param complaintId Complaint ID
     * @throws com.civicpulse.exception.ComplaintNotFoundException If not found
     */
    void softDelete(Long complaintId);
}
