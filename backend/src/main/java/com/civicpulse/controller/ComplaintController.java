package com.civicpulse.controller;

import com.civicpulse.model.dto.request.ComplaintRequestDto;
import com.civicpulse.model.dto.response.ApiResponseDto;
import com.civicpulse.model.dto.response.ComplaintResponseDto;
import com.civicpulse.model.entity.AiInsight;
import com.civicpulse.model.enums.InsightType;
import com.civicpulse.repository.AiInsightRepository;
import com.civicpulse.repository.SlaRepository;
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
    private final AiInsightRepository aiInsightRepository;
    private final SlaRepository slaRepository;

    public record StatusUpdateDto(String status, String notes) {}

    @PostMapping(value = { "", "/submit" }, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Submit a new complaint with optional images")
    public ResponseEntity<ApiResponseDto<ComplaintResponseDto>> submit(
            @RequestPart(value = "data", required = false) @Valid ComplaintRequestDto dtoFromData,
            @RequestPart(value = "complaint", required = false) @Valid ComplaintRequestDto dtoFromComplaint,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal UserDetails userDetails) {

        ComplaintRequestDto dto = dtoFromData != null ? dtoFromData : dtoFromComplaint;
        if (dto == null) {
            throw new IllegalArgumentException("Missing part 'data' or 'complaint'");
        }

        ComplaintResponseDto response = complaintService.submitComplaint(
                dto, images, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponseDto.success(response, "Complaint submitted successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get complaint by ID")
    public ResponseEntity<ApiResponseDto<ComplaintResponseDto>> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponseDto.success(
                complaintService.getComplaint(id, userDetails.getUsername())));
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
            @RequestBody StatusUpdateDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponseDto.success(
                complaintService.updateStatus(id, dto.status(), dto.notes(), userDetails.getUsername()),
                "Status updated"));
    }

        public record ConfirmDto(Integer rating) {}

        @PostMapping("/{id}/confirm")
        @Operation(summary = "Citizen confirms a RESOLVED complaint with optional 1-5 satisfaction rating")
        public ResponseEntity<ApiResponseDto<ComplaintResponseDto>> confirmResolution(
                        @PathVariable Long id,
                        @RequestBody(required = false) ConfirmDto body,
                        @AuthenticationPrincipal UserDetails userDetails) {
                Integer rating = body != null ? body.rating() : null;
                ComplaintResponseDto dto = complaintService.confirmResolution(id, rating, userDetails.getUsername());
                return ResponseEntity.ok(ApiResponseDto.success(dto, "Thank you — your confirmation is recorded."));
        }

        public record DisputeDto(String reason) {}

        @PostMapping("/{id}/dispute")
        @Operation(summary = "Citizen disputes a RESOLVED complaint and reopens it")
        public ResponseEntity<ApiResponseDto<ComplaintResponseDto>> disputeResolution(
                        @PathVariable Long id,
                        @RequestBody DisputeDto dto,
                        @AuthenticationPrincipal UserDetails userDetails) {
                ComplaintResponseDto res = complaintService.disputeResolution(id, dto.reason(), userDetails.getUsername());
                return ResponseEntity.ok(ApiResponseDto.success(res, "Your dispute has been recorded and the case has been reopened."));
        }

    @GetMapping("/user/{email}")
    @Operation(summary = "Get user's complaints by email parameter")
    public ResponseEntity<ApiResponseDto<Page<ComplaintResponseDto>>> getByUserEmail(
            @PathVariable String email,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponseDto.success(
                complaintService.getByUser(email, pageable)));
    }

    @GetMapping("/officer/{email}")
    @PreAuthorize("hasAnyRole('OFFICER','DEPT_HEAD','ADMIN')")
    @Operation(summary = "Get officer's queue by email parameter")
    public ResponseEntity<ApiResponseDto<Page<ComplaintResponseDto>>> getOfficerQueueByEmail(
            @PathVariable String email,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponseDto.success(
                complaintService.getOfficerQueue(email, pageable)));
    }

    @GetMapping("/{id}/insights")
    @Operation(summary = "Get AI insights for a complaint")
    public ResponseEntity<ApiResponseDto<Object>> getComplaintInsights(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        ComplaintResponseDto complaint = complaintService.getComplaint(id, userDetails.getUsername());
        
        java.util.Map<String, Object> insights = new java.util.HashMap<>();
        insights.put("complaintId", id);
        insights.put("aiCategory", complaint.aiCategory());
        insights.put("aiPriority", complaint.aiPriority());
        insights.put("aiReason", complaint.aiReason());
        insights.put("sentimentScore", complaint.sentimentScore());
        
        List<AiInsight> wardInsights = List.of();
        if (complaint.wardId() != null) {
            wardInsights = aiInsightRepository.findByWardIdAndInsightTypeOrderByGeneratedAtDesc(
                    complaint.wardId(), InsightType.DAILY_SUMMARY);
        }
        insights.put("wardInsights", wardInsights);
        
        return ResponseEntity.ok(ApiResponseDto.success(insights));
    }

    @GetMapping("/{id}/sla")
    @Operation(summary = "Get SLA information for a complaint")
    public ResponseEntity<ApiResponseDto<Object>> getComplaintSla(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        ComplaintResponseDto complaint = complaintService.getComplaint(id, userDetails.getUsername());
        
        var policyOpt = slaRepository.findByCategoryAndPriorityAndIsActiveTrue(
                complaint.category(), complaint.priority());
        
        java.util.Map<String, Object> slaInfo = new java.util.HashMap<>();
        slaInfo.put("complaintId", id);
        slaInfo.put("category", complaint.category());
        slaInfo.put("priority", complaint.priority());
        slaInfo.put("slaDeadline", complaint.slaDeadline());
        slaInfo.put("resolvedAt", complaint.resolvedAt());
        slaInfo.put("isBreached", complaint.resolvedAt() != null 
                ? complaint.resolvedAt().isAfter(complaint.slaDeadline()) 
                : java.time.LocalDateTime.now().isAfter(complaint.slaDeadline()));
        
        if (policyOpt.isPresent()) {
            var policy = policyOpt.get();
            slaInfo.put("resolutionHours", policy.getResolutionHours());
            slaInfo.put("escalationHours", policy.getEscalationHours());
        } else {
            slaInfo.put("resolutionHours", 48);
            slaInfo.put("escalationHours", 72);
        }
        
        return ResponseEntity.ok(ApiResponseDto.success(slaInfo));
    }

        public record DuplicateCheckDto(String category, java.math.BigDecimal latitude, java.math.BigDecimal longitude, java.time.LocalDate incidentDate, java.time.LocalTime incidentTime) {}

        @PostMapping("/detect-duplicates")
        @Operation(summary = "Check for potentially duplicate complaints near a location and time")
        public ResponseEntity<ApiResponseDto<List<ComplaintResponseDto>>> detectDuplicates(@RequestBody DuplicateCheckDto dto) {
                java.time.LocalDateTime observed = null;
                if (dto.incidentDate() != null) {
                        observed = dto.incidentDate().atStartOfDay();
                        if (dto.incidentTime() != null) observed = dto.incidentDate().atTime(dto.incidentTime());
                } else {
                        observed = java.time.LocalDateTime.now();
                }

                List<ComplaintResponseDto> results = complaintService.detectDuplicates(dto.category(), dto.latitude(), dto.longitude(), observed);
                return ResponseEntity.ok(ApiResponseDto.success(results));
        }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Soft-delete a complaint (admin only)")
    public ResponseEntity<ApiResponseDto<Void>> delete(@PathVariable Long id) {
        complaintService.softDelete(id);
        return ResponseEntity.ok(ApiResponseDto.success(null, "Complaint deleted"));
    }
}
