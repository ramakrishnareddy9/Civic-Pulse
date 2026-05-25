package com.civicpulse.service.complaint;

import com.civicpulse.model.dto.response.ComplaintResponseDto;
import com.civicpulse.service.complaint.contract.ComplaintSubmissionService;
import com.civicpulse.service.complaint.contract.ComplaintRetrievalService;
import com.civicpulse.service.complaint.contract.ComplaintStatusService;

/**
 * Composite interface combining all complaint operations.
 * Extends focused, segregated interfaces for better Interface Segregation Principle compliance.
 * 
 * For new code, prefer injecting specific contract interfaces:
 * - ComplaintSubmissionService for submission operations
 * - ComplaintRetrievalService for retrieval operations
 * - ComplaintStatusService for status updates
 * 
 * This interface is maintained for backward compatibility.
 */
public interface ComplaintService extends
        ComplaintSubmissionService,
        ComplaintRetrievalService,
        ComplaintStatusService {
    
    /**
     * Get current user's complaints (convenience method).
     * Maps to getByUser() from ComplaintRetrievalService for backward compatibility.
     */
    // Legacy methods retained for backward compatibility
    ComplaintResponseDto getComplaint(Long id);  // Maps to getById()
    
    /**
     * Reassign complaint to different officer.
     *
     * @param complaintId Complaint ID
     * @param officerId   New officer ID
     * @return Updated complaint
     */
    ComplaintResponseDto reassign(Long complaintId, Long officerId);
}
