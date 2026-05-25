package com.civicpulse.controller;

import com.civicpulse.model.dto.request.OfficerOnboardingDto;
import com.civicpulse.model.dto.response.ApiResponseDto;
import com.civicpulse.model.entity.Department;
import com.civicpulse.model.entity.Officer;
import com.civicpulse.service.admin.contract.DepartmentAdminService;
import com.civicpulse.service.admin.contract.OfficerAdminService;
import com.civicpulse.service.complaint.ComplaintService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin endpoints for system management.
 * Delegates all business logic to DepartmentAdminService and OfficerAdminService.
 * Controllers only handle HTTP concerns (routing, validation, serialization).
 * 
 * Follows: Dependency Inversion Principle
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin-only management operations")
public class AdminController {

    private final DepartmentAdminService departmentAdminService;
    private final OfficerAdminService officerAdminService;
    private final ComplaintService complaintService;

    // ==================== Department Endpoints ====================

    @PostMapping("/departments")
    @Operation(summary = "Create a new department")
    public ResponseEntity<ApiResponseDto<Department>> createDepartment(
            @Valid @RequestBody Department department) {
        Department created = departmentAdminService.createDepartment(department);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponseDto.success(created, "Department created successfully"));
    }

    @GetMapping("/departments")
    @Operation(summary = "Get all departments")
    public ResponseEntity<ApiResponseDto<List<Department>>> getDepartments() {
        List<Department> departments = departmentAdminService.getAllDepartments();
        return ResponseEntity.ok(ApiResponseDto.success(departments));
    }

    @PutMapping("/departments/{id}")
    @Operation(summary = "Update department")
    public ResponseEntity<ApiResponseDto<Department>> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody Department department) {
        Department updated = departmentAdminService.updateDepartment(id, department);
        return ResponseEntity.ok(ApiResponseDto.success(updated, "Department updated successfully"));
    }

    @DeleteMapping("/departments/{id}")
    @Operation(summary = "Delete department")
    public ResponseEntity<ApiResponseDto<Void>> deleteDepartment(@PathVariable Long id) {
        departmentAdminService.deleteDepartment(id);
        return ResponseEntity.ok(ApiResponseDto.success(null, "Department deleted successfully"));
    }

    // ==================== Officer Endpoints ====================

    @PostMapping("/officers")
    @Operation(summary = "Onboard a new officer")
    public ResponseEntity<ApiResponseDto<Officer>> onboardOfficer(
            @Valid @RequestBody OfficerOnboardingDto dto) {
        Officer officer = officerAdminService.onboardOfficer(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponseDto.success(officer, "Officer onboarded successfully"));
    }

    @GetMapping("/officers")
    @Operation(summary = "Get all officers")
    public ResponseEntity<ApiResponseDto<List<Officer>>> getAllOfficers() {
        List<Officer> officers = officerAdminService.getAllOfficers();
        return ResponseEntity.ok(ApiResponseDto.success(officers));
    }

    @GetMapping("/officers/department/{deptId}")
    @Operation(summary = "Get officers by department")
    public ResponseEntity<ApiResponseDto<List<Officer>>> getOfficersByDepartment(@PathVariable Long deptId) {
        List<Officer> officers = officerAdminService.getOfficersByDepartment(deptId);
        return ResponseEntity.ok(ApiResponseDto.success(officers));
    }

    @GetMapping("/officers/ward/{wardId}")
    @Operation(summary = "Get officers by ward")
    public ResponseEntity<ApiResponseDto<List<Officer>>> getOfficersByWard(@PathVariable Long wardId) {
        List<Officer> officers = officerAdminService.getOfficersByWard(wardId);
        return ResponseEntity.ok(ApiResponseDto.success(officers));
    }

    @PutMapping("/officers/{id}/reassign")
    @Operation(summary = "Reassign officer to different ward/department")
    public ResponseEntity<ApiResponseDto<Officer>> reassignOfficer(
            @PathVariable Long id,
            @RequestParam(required = false) Long wardId,
            @RequestParam(required = false) Long deptId) {
        Officer updated = officerAdminService.reassignOfficer(id, wardId, deptId);
        return ResponseEntity.ok(ApiResponseDto.success(updated, "Officer reassigned successfully"));
    }

    @DeleteMapping("/officers/{id}/deactivate")
    @Operation(summary = "Deactivate officer")
    public ResponseEntity<ApiResponseDto<Void>> deactivateOfficer(@PathVariable Long id) {
        officerAdminService.deactivateOfficer(id);
        return ResponseEntity.ok(ApiResponseDto.success(null, "Officer deactivated successfully"));
    }

    // ==================== Complaint Management Endpoints ====================

    @PutMapping("/complaints/{id}/reassign")
    @Operation(summary = "Reassign complaint to different officer")
    public ResponseEntity<ApiResponseDto<Object>> reassignComplaint(
            @PathVariable Long id,
            @RequestParam Long officerId) {
        var result = complaintService.reassign(id, officerId);
        return ResponseEntity.ok(ApiResponseDto.success(result, "Complaint reassigned"));
    }

    @DeleteMapping("/complaints/{id}")
    @Operation(summary = "Delete complaint (admin only)")
    public ResponseEntity<ApiResponseDto<Void>> deleteComplaint(@PathVariable Long id) {
        complaintService.softDelete(id);
        return ResponseEntity.ok(ApiResponseDto.success(null, "Complaint deleted"));
    }
}

        Officer officer = Officer.builder()
                .user(user)
                .department(dept)
                .ward(ward)
                .designation(designation)
                .build();
        officerRepository.save(officer);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponseDto.success(officer, "Officer onboarded"));
    }

    @PutMapping("/complaints/{id}/reassign")
    @Operation(summary = "Reassign complaint to different officer")
    public ResponseEntity<ApiResponseDto<Object>> reassign(
            @PathVariable Long id,
            @RequestParam Long officerId) {
        return ResponseEntity.ok(ApiResponseDto.success(
                complaintService.reassign(id, officerId), "Complaint reassigned"));
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Platform KPI overview")
    public ResponseEntity<ApiResponseDto<Object>> dashboard() {
        long total = complaintService.getMyComplaints("admin@civicpulse.gov.in",
                org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
        return ResponseEntity.ok(ApiResponseDto.success(Map.of(
                "message", "Dashboard data available via /api/analytics"
        )));
    }

    @GetMapping("/wards")
    public ResponseEntity<ApiResponseDto<Object>> getWards() {
        return ResponseEntity.ok(ApiResponseDto.success(wardRepository.findAll()));
    }
}
