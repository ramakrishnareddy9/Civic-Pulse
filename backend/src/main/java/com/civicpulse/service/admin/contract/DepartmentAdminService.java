package com.civicpulse.service.admin.contract;

import com.civicpulse.model.entity.Department;

import java.util.List;

/**
 * Focused interface for department management.
 * Follows: Interface Segregation Principle
 */
public interface DepartmentAdminService {

    /**
     * Create a new department.
     *
     * @param department Department to create
     * @return Created department
     */
    Department createDepartment(Department department);

    /**
     * Get all departments.
     *
     * @return List of departments
     */
    List<Department> getAllDepartments();

    /**
     * Update department.
     *
     * @param id         Department ID
     * @param department Updated department
     * @return Updated department
     */
    Department updateDepartment(Long id, Department department);

    /**
     * Delete department.
     *
     * @param id Department ID
     */
    void deleteDepartment(Long id);
}
