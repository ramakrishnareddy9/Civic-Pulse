package com.civicpulse.model.dto.request;

import com.civicpulse.model.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * Strongly-typed DTO for officer onboarding.
 * Replaces raw Map<String, Object> for type safety and validation.
 */
public record OfficerOnboardingDto(
        @Email(message = "Email must be valid")
        String email,

        @NotBlank(message = "Full name is required")
        String fullName,

        String password,  // Optional — will use default if not provided

        @Positive(message = "Department ID must be positive")
        Long departmentId,  // Required

        @Positive(message = "Ward ID must be positive")
        Long wardId,        // Required

        @NotBlank(message = "Designation is required")
        String designation,

        UserRole role
) {
}
