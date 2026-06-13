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
    private final com.civicpulse.repository.ComplaintRepository complaintRepository;

    @Override
    public Department createDepartment(Department department) {
        Department saved = departmentRepository.save(department);
        log.info("Department created: {} (ID: {})", department.getName(), saved.getId());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Department> getAllDepartments() {
        return departmentRepository.findByIsActiveTrue();
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
    public Department findBestMatch(String aiDepartment) {
        if (aiDepartment == null || aiDepartment.isBlank()) {
            return departmentRepository.findByIsActiveTrue().stream().findFirst().orElse(null);
        }
        // 1) Exact case-insensitive match
        var exact = departmentRepository.findAll().stream()
                .filter(Department::getIsActive)
                .filter(d -> d.getName().equalsIgnoreCase(aiDepartment.trim()))
                .findFirst();
        if (exact.isPresent()) return exact.get();

        // 2) ILIKE-like contains match
        var contains = departmentRepository.findAll().stream()
                .filter(Department::getIsActive)
                .filter(d -> d.getName().toLowerCase().contains(aiDepartment.toLowerCase().trim()))
                .findFirst();
        if (contains.isPresent()) return contains.get();

        // 3) Simple Jaro-Winkler similarity scoring
        Department best = null;
        double bestScore = 0.0;
        for (Department d : departmentRepository.findAll()) {
            if (!d.getIsActive()) continue;
            double s = jaroWinkler(aiDepartment.toLowerCase(), d.getName().toLowerCase());
            if (s > bestScore) { bestScore = s; best = d; }
        }
        if (best != null && bestScore > 0.75) return best;

        // Fallback to first active department
        return departmentRepository.findByIsActiveTrue().stream().findFirst().orElse(null);
    }

    // Jaro-Winkler similarity (lightweight implementation)
    private double jaroWinkler(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;
        if (s1.equals(s2)) return 1.0;
        int[] mt = new int[2];
        int m = 0;
        int range = Math.max(s1.length(), s2.length())/2 - 1;
        boolean[] s1Matches = new boolean[s1.length()];
        boolean[] s2Matches = new boolean[s2.length()];
        for (int i=0;i<s1.length();i++){
            int start = Math.max(0, i-range);
            int end = Math.min(s2.length()-1, i+range);
            for (int j=start;j<=end;j++) if (!s2Matches[j] && s1.charAt(i)==s2.charAt(j)) { s1Matches[i]=s2Matches[j]=true; m++; break; }
        }
        if (m==0) return 0.0;
        double t=0;
        int k=0;
        for (int i=0;i<s1.length();i++) if (s1Matches[i]) {
            while(!s2Matches[k]) k++; if (s1.charAt(i)!=s2.charAt(k)) t++; k++; }
        t/=2.0;
        double j = ((double)m / s1.length() + (double)m / s2.length() + (m - t) / m) / 3.0;
        // Winkler boost
        int prefix=0; for (int i=0;i<Math.min(4, Math.min(s1.length(), s2.length())); i++) if (s1.charAt(i)==s2.charAt(i)) prefix++; else break;
        return j + 0.1 * prefix * (1.0 - j);
    }

    @Override
    public void deleteDepartment(Long id) {
        Department existing = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found: " + id));
        
        // Soft-delete: set is_active to false instead of hard-deleting
        // This preserves data integrity and audit trail for complaints referencing this department
        existing.setIsActive(false);
        departmentRepository.save(existing);
        log.info("Department soft-deleted (is_active set to false): {}", id);
    }
}
