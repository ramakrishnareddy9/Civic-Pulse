package com.civicpulse.controller;

import com.civicpulse.model.dto.request.ComplaintRequestDto;
import com.civicpulse.model.dto.response.ApiResponseDto;
import com.civicpulse.model.dto.response.ComplaintResponseDto;
import com.civicpulse.service.complaint.ComplaintService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
@Tag(name = "Complaints", description = "Complaint submission and management")
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Submit a new complaint with optional images")
    public ResponseEntity<ApiResponseDto<ComplaintResponseDto>> submit(
            @RequestPart("data") @Valid ComplaintRequestDto dto,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal UserDetails userDetails) {

        ComplaintResponseDto response = complaintService.submitComplaint(
                dto, images, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponseDto.success(response, "Complaint submitted successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get complaint by ID")
    public ResponseEntity<ApiResponseDto<ComplaintResponseDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponseDto.success(complaintService.getComplaint(id)));
    }

    @GetMapping("/my")
    @Operation(summary = "Get current user's complaints")
    public ResponseEntity<ApiResponseDto<Page<ComplaintResponseDto>>> getMyComplaints(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponseDto.success(
                complaintService.getMyComplaints(userDetails.getUsername(), pageable)));
    }

    @GetMapping("/ward/{wardId}")
    @PreAuthorize("hasAnyRole('OFFICER','DEPT_HEAD','ADMIN')")
    @Operation(summary = "Get complaints in a ward")
    public ResponseEntity<ApiResponseDto<Page<ComplaintResponseDto>>> getByWard(
            @PathVariable Long wardId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponseDto.success(
                complaintService.getWardComplaints(wardId, pageable)));
    }

    @GetMapping("/queue")
    @PreAuthorize("hasAnyRole('OFFICER','DEPT_HEAD','ADMIN')")
    @Operation(summary = "Get officer's assigned complaint queue")
    public ResponseEntity<ApiResponseDto<Page<ComplaintResponseDto>>> getQueue(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponseDto.success(
                complaintService.getOfficerQueue(userDetails.getUsername(), pageable)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OFFICER','DEPT_HEAD','ADMIN')")
    @Operation(summary = "Update complaint status")
    public ResponseEntity<ApiResponseDto<ComplaintResponseDto>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String notes,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponseDto.success(
                complaintService.updateStatus(id, status, notes, userDetails.getUsername()),
                "Status updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Soft-delete a complaint (admin only)")
    public ResponseEntity<ApiResponseDto<Void>> delete(@PathVariable Long id) {
        complaintService.softDelete(id);
        return ResponseEntity.ok(ApiResponseDto.success(null, "Complaint deleted"));
    }
}
