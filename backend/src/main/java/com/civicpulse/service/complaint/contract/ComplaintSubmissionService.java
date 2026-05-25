package com.civicpulse.service.complaint.contract;

import com.civicpulse.model.dto.request.ComplaintRequestDto;
import com.civicpulse.model.dto.response.ComplaintResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Focused interface for complaint submission operations.
 * Clients using this interface only see submission-related methods.
 * 
 * Follows: Interface Segregation Principle
 */
public interface ComplaintSubmissionService {

    /**
     * Submit a new complaint with optional images.
     *
     * @param dto      Complaint details
     * @param images   Optional complaint images
     * @param userEmail User submitting the complaint
     * @return Created complaint response
     * @throws IllegalArgumentException If user not found or invalid data
     */
    ComplaintResponseDto submit(ComplaintRequestDto dto,
                               List<MultipartFile> images,
                               String userEmail);
}
