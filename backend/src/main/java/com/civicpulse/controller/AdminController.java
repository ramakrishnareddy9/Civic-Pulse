package com.civicpulse.controller;

import com.civicpulse.model.dto.response.ApiResponseDto;
import com.civicpulse.model.entity.Department;
import com.civicpulse.model.entity.Officer;
import com.civicpulse.model.entity.User;
import com.civicpulse.model.entity.Ward;
import com.civicpulse.model.enums.UserRole;
import com.civicpulse.repository.DepartmentRepository;
import com.civicpulse.repository.OfficerRepository;
import com.civicpulse.repository.UserRepository;
import com.civicpulse.repository.WardRepository;
import com.civicpulse.service.complaint.ComplaintService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin-only management operations")
public class AdminController {

    private final DepartmentRepository departmentRepository;
    private final OfficerRepository officerRepository;
    private final UserRepository userRepository;
    private final WardRepository wardRepository;
    private final PasswordEncoder passwordEncoder;
    private final ComplaintService complaintService;

    @PostMapping("/departments")
    @Operation(summary = "Create a new department")
    public ResponseEntity<ApiResponseDto<Department>> createDepartment(
            @RequestBody Department department) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponseDto.success(departmentRepository.save(department), "Department created"));
    }

    @GetMapping("/departments")
    public ResponseEntity<ApiResponseDto<Object>> getDepartments() {
        return ResponseEntity.ok(ApiResponseDto.success(departmentRepository.findAll()));
    }

    @PostMapping("/officers")
    @Operation(summary = "Onboard a new officer")
    public ResponseEntity<ApiResponseDto<Object>> onboardOfficer(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String fullName = (String) body.get("fullName");
        String password = (String) body.getOrDefault("password", "Officer@123");
        Long departmentId = body.get("departmentId") != null
                ? Long.valueOf(body.get("departmentId").toString()) : null;
        Long wardId = body.get("wardId") != null
                ? Long.valueOf(body.get("wardId").toString()) : null;
        String designation = (String) body.getOrDefault("designation", "Field Officer");

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponseDto.error("Email already exists"));
        }

        User user = User.builder()
                .email(email)
                .fullName(fullName)
                .password(passwordEncoder.encode(password))
                .role(UserRole.OFFICER)
                .build();
        user = userRepository.save(user);

        Department dept = departmentId != null
                ? departmentRepository.findById(departmentId).orElse(null) : null;
        Ward ward = wardId != null
                ? wardRepository.findById(wardId).orElse(null) : null;

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
