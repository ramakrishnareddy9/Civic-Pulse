package com.civicpulse.repository;

import com.civicpulse.model.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {

    /**
     * Find a valid password reset token by token string
     * @param token the reset token
     * @return Optional containing the token if valid (not expired and not used)
     */
    @Query("SELECT prt FROM PasswordResetToken prt WHERE prt.token = :token AND prt.used = false AND prt.expiresAt > CURRENT_TIMESTAMP")
    Optional<PasswordResetToken> findValidToken(String token);

    /**
     * Find by user email (convenience method for password reset flow)
     */
    Optional<PasswordResetToken> findByUserEmailAndUsedFalseAndExpiresAtAfter(String email, LocalDateTime now);

    /**
     * Delete expired tokens (cleanup)
     */
    long deleteByExpiresAtBefore(LocalDateTime now);
}
