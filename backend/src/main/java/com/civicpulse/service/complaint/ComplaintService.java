package com.civicpulse.service.complaint;

import com.civicpulse.model.dto.request.ComplaintRequestDto;
import com.civicpulse.model.dto.response.ComplaintResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ComplaintService {
    ComplaintResponseDto submitComplaint(ComplaintRequestDto dto, List<MultipartFile> images, String userEmail);
    ComplaintResponseDto getComplaint(Long id);
    Page<ComplaintResponseDto> getMyComplaints(String userEmail, Pageable pageable);
    Page<ComplaintResponseDto> getWardComplaints(Long wardId, Pageable pageable);
    Page<ComplaintResponseDto> getOfficerQueue(String officerEmail, Pageable pageable);
    ComplaintResponseDto updateStatus(Long id, String status, String notes, String officerEmail);
    ComplaintResponseDto reassign(Long id, Long officerId);
    void softDelete(Long id);
}
