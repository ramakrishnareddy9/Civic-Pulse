package com.civicpulse.service.admin.impl;

import com.civicpulse.model.dto.request.OfficerOnboardingDto;
import com.civicpulse.model.entity.Department;
import com.civicpulse.model.entity.Officer;
import com.civicpulse.model.entity.User;
import com.civicpulse.model.entity.Ward;
import com.civicpulse.model.enums.UserRole;
import com.civicpulse.repository.DepartmentRepository;
import com.civicpulse.repository.OfficerRepository;
import com.civicpulse.repository.UserRepository;
import com.civicpulse.repository.WardRepository;
import com.civicpulse.service.admin.contract.OfficerAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for officer administration and onboarding.
 * Responsible ONLY for officer management logic — nothing else.
 * 
 * Follows: Single Responsibility Principle
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class OfficerAdminServiceImpl implements OfficerAdminService {

    private final OfficerRepository officerRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final WardRepository wardRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String DEFAULT_PASSWORD = "Officer@123";

    @Override
    public Officer onboardOfficer(OfficerOnboardingDto dto) {
        // Validate user doesn't already exist
        if (userRepository.existsByEmail(dto.email())) {
            throw new IllegalArgumentException("Officer email already exists: " + dto.email());
        }

        UserRole role = dto.role() != null ? dto.role() : UserRole.OFFICER;
        if (role != UserRole.OFFICER && role != UserRole.DEPT_HEAD) {
            throw new IllegalArgumentException("Officer onboarding supports only OFFICER or DEPT_HEAD roles");
        }

        // Fetch dependencies
        Department department = departmentRepository.findById(dto.departmentId())
                .orElseThrow(() -> new IllegalArgumentException("Department not found: " + dto.departmentId()));

        Ward ward = wardRepository.findById(dto.wardId())
                .orElseThrow(() -> new IllegalArgumentException("Ward not found: " + dto.wardId()));

        // Create user
        User user = User.builder()
                .email(dto.email())
                .fullName(dto.fullName())
                .password(passwordEncoder.encode(dto.password() != null ? dto.password() : DEFAULT_PASSWORD))
            .role(role)
                .build();
        user = userRepository.save(user);

        // Create officer record
        Officer officer = Officer.builder()
                .user(user)
                .department(department)
                .ward(ward)
                .designation(dto.designation())
                .isActive(true)
                .build();
        officer = officerRepository.save(officer);

        log.info("Officer onboarded: {} ({}) - Ward: {}, Department: {}",
                user.getEmail(), dto.fullName(), ward.getName(), department.getName());
        return officer;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Officer> getAllOfficers() {
        return officerRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Officer> getOfficersByDepartment(Long departmentId) {
        return officerRepository.findByDepartmentIdAndIsActiveTrue(departmentId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Officer> getOfficersByWard(Long wardId) {
        return officerRepository.findByWardIdAndIsActiveTrue(wardId);
    }

    @Override
    public Officer reassignOfficer(Long id, Long wardId, Long deptId) {
        Officer officer = officerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Officer not found: " + id));

        if (wardId != null) {
            Ward ward = wardRepository.findById(wardId)
                    .orElseThrow(() -> new IllegalArgumentException("Ward not found: " + wardId));
            officer.setWard(ward);
        }

        if (deptId != null) {
            Department dept = departmentRepository.findById(deptId)
                    .orElseThrow(() -> new IllegalArgumentException("Department not found: " + deptId));
            officer.setDepartment(dept);
        }

        Officer updated = officerRepository.save(officer);
        log.info("Officer reassigned: ID={}", id);
        return updated;
    }

    @Override
    public void deactivateOfficer(Long id) {
        Officer officer = officerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Officer not found: " + id));
        officer.setIsActive(false);
        officerRepository.save(officer);
        log.info("Officer deactivated: {}", officer.getUser().getEmail());
    }
}
