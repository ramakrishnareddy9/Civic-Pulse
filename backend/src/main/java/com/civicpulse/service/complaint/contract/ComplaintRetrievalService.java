package com.civicpulse.service.complaint.contract;

import com.civicpulse.model.dto.response.ComplaintResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Focused interface for complaint retrieval operations.
 * Clients using this interface only see read-related methods.
 * 
 * Follows: Interface Segregation Principle
 */
public interface ComplaintRetrievalService {

    /**
     * Get complaint by ID.
     *
     * @param id Complaint ID
     * @return Complaint details
     * @throws com.civicpulse.exception.ComplaintNotFoundException If not found
     */
    ComplaintResponseDto getById(Long id);

    /**
     * Get current user's complaints.
     *
     * @param userEmail User email
     * @param pageable  Pagination info
     * @return Page of complaints
     */
    Page<ComplaintResponseDto> getByUser(String userEmail, Pageable pageable);

    /**
     * Get complaints in a ward.
     *
     * @param wardId   Ward ID
     * @param pageable Pagination info
     * @return Page of complaints
     */
    Page<ComplaintResponseDto> getByWard(Long wardId, Pageable pageable);

    /**
     * Get officer's assigned complaints queue.
     *
     * @param officerEmail Officer email
     * @param pageable     Pagination info
     * @return Page of assigned complaints
     */
    Page<ComplaintResponseDto> getOfficerQueue(String officerEmail, Pageable pageable);

    /**
     * Detect potentially duplicate complaints near a given location and time.
     * @param category Raw category string
     * @param latitude Latitude
     * @param longitude Longitude
     * @param observedAt Observed timestamp
     * @return List of matching complaints
     */
    java.util.List<ComplaintResponseDto> detectDuplicates(String category, java.math.BigDecimal latitude, java.math.BigDecimal longitude, java.time.LocalDateTime observedAt);
}
