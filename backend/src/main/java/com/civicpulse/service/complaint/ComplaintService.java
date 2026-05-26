package com.civicpulse.service.complaint;

import com.civicpulse.model.dto.request.ComplaintRequestDto;
import com.civicpulse.model.dto.response.ComplaintResponseDto;
import com.civicpulse.service.complaint.contract.ComplaintSubmissionService;
import com.civicpulse.service.complaint.contract.ComplaintRetrievalService;
import com.civicpulse.service.complaint.contract.ComplaintStatusService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

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
     * Submit a new complaint with optional images (legacy convenience method).
     */
    ComplaintResponseDto submitComplaint(ComplaintRequestDto dto,
                                        List<MultipartFile> images,
                                        String userEmail);

    /**
     * Get current user's complaints (legacy convenience method).
     */
    ComplaintResponseDto getComplaint(Long id);  // Maps to getById()
    
    /**
     * Get citizen's complaints page (legacy convenience method).
     */
    Page<ComplaintResponseDto> getMyComplaints(String userEmail, Pageable pageable);

    /**
     * Get ward complaints page (legacy convenience method).
     */
    Page<ComplaintResponseDto> getWardComplaints(Long wardId, Pageable pageable);

    /**
     * Reassign complaint to different officer.
     *
     * @param complaintId Complaint ID
     * @param officerId   New officer ID
     * @return Updated complaint
     */
    ComplaintResponseDto reassign(Long complaintId, Long officerId);
}
