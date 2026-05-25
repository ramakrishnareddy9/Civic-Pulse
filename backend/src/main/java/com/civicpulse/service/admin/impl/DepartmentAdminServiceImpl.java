package com.civicpulse.service.admin.impl;

import com.civicpulse.model.entity.Department;
import com.civicpulse.repository.DepartmentRepository;
import com.civicpulse.service.admin.contract.DepartmentAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for department administration.
 * Responsible ONLY for department management logic — nothing else.
 * 
 * Follows: Single Responsibility Principle
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class DepartmentAdminServiceImpl implements DepartmentAdminService {

    private final DepartmentRepository departmentRepository;

    @Override
    public Department createDepartment(Department department) {
        Department saved = departmentRepository.save(department);
        log.info("Department created: {} (ID: {})", department.getName(), saved.getId());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    @Override
    public Department updateDepartment(Long id, Department department) {
        Department existing = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found: " + id));
        
        existing.setName(department.getName());
        existing.setDescription(department.getDescription());
        Department updated = departmentRepository.save(existing);
        log.info("Department updated: {} (ID: {})", id, department.getName());
        return updated;
    }

    @Override
    public void deleteDepartment(Long id) {
        departmentRepository.deleteById(id);
        log.info("Department deleted: {}", id);
    }
}
