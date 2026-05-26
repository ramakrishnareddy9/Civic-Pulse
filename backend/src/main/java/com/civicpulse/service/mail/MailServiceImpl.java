package com.civicpulse.service.mail;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

/**
 * Implementation of MailService interface.
 * Handles the asynchronous dispatch of rich HTML notifications using Thymeleaf templates.
 * Follows the Single Responsibility Principle (SRP) by delegating message formatting and mailing mechanics.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MailServiceImpl implements MailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Async
    @Override
    public void sendComplaintSubmissionEmail(String toEmail, String citizenName, Long complaintId, String title, String category, String ward) {
        try {
            log.info("Preparing asynchronous complaint submission email for #CP-{} to {}", complaintId, toEmail);
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            Context context = new Context();
            context.setVariable("citizenName", citizenName);
            context.setVariable("complaintId", complaintId);
            context.setVariable("title", title);
            context.setVariable("category", category);
            context.setVariable("ward", ward != null ? ward : "General Triage Zone");

            String htmlContent = templateEngine.process("mail/submission", context);

            helper.setTo(toEmail);
            helper.setSubject("Complaint Filed Successfully — Ticket #CP-" + complaintId);
            helper.setText(htmlContent, true);
            helper.setFrom("no-reply@civicpulse.gov.in");

            mailSender.send(mimeMessage);
            log.info("Complaint submission email sent successfully for #CP-{} to {}", complaintId, toEmail);
        } catch (Exception ex) {
            log.error("Failed to dispatch complaint submission email for #CP-{}: {}", complaintId, ex.getMessage(), ex);
        }
    }

    @Async
    @Override
    public void sendEmailVerificationEmail(String toEmail, String citizenName, String verificationToken) {
        try {
            log.info("Preparing email verification email for {}", toEmail);
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            Context context = new Context();
            context.setVariable("citizenName", citizenName);
            context.setVariable("verificationToken", verificationToken);
            context.setVariable("verificationLink", "http://localhost:8080/api/auth/verify-email?token=" + verificationToken);

            String htmlContent = templateEngine.process("mail/email-verification", context);

            helper.setTo(toEmail);
            helper.setSubject("Verify your Civic Pulse email address");
            helper.setText(htmlContent, true);
            helper.setFrom("no-reply@civicpulse.gov.in");

            mailSender.send(mimeMessage);
            log.info("Email verification sent successfully to {}", toEmail);
        } catch (Exception ex) {
            log.error("Failed to dispatch verification email for {}: {}", toEmail, ex.getMessage(), ex);
        }
    }

    @Async
    @Override
    public void sendPasswordResetEmail(String toEmail, String citizenName, String resetToken) {
        try {
            log.info("Preparing password reset email for {}", toEmail);
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            Context context = new Context();
            context.setVariable("citizenName", citizenName);
            context.setVariable("resetToken", resetToken);

            String htmlContent = templateEngine.process("mail/password-reset", context);

            helper.setTo(toEmail);
            helper.setSubject("Civic Pulse password reset request");
            helper.setText(htmlContent, true);
            helper.setFrom("no-reply@civicpulse.gov.in");

            mailSender.send(mimeMessage);
            log.info("Password reset email sent successfully to {}", toEmail);
        } catch (Exception ex) {
            log.error("Failed to dispatch password reset email for {}: {}", toEmail, ex.getMessage(), ex);
        }
    }

    @Async
    @Override
    public void sendComplaintStatusUpdateEmail(String toEmail, String citizenName, Long complaintId, String title, String oldStatus, String newStatus, String notes) {
        try {
            log.info("Preparing asynchronous status update email for #CP-{} to {}", complaintId, toEmail);
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            Context context = new Context();
            context.setVariable("citizenName", citizenName);
            context.setVariable("complaintId", complaintId);
            context.setVariable("title", title);
            context.setVariable("oldStatus", oldStatus);
            context.setVariable("newStatus", newStatus);
            context.setVariable("notes", notes != null && !notes.isBlank() ? notes : "No action notes detailed by officer.");

            String htmlContent = templateEngine.process("mail/status-update", context);

            helper.setTo(toEmail);
            helper.setSubject("Updates on Incident #CP-" + complaintId + " — Status: " + newStatus);
            helper.setText(htmlContent, true);
            helper.setFrom("no-reply@civicpulse.gov.in");

            mailSender.send(mimeMessage);
            log.info("Complaint status update email sent successfully for #CP-{} to {}", complaintId, toEmail);
        } catch (Exception ex) {
            log.error("Failed to dispatch status update email for #CP-{}: {}", complaintId, ex.getMessage(), ex);
        }
    }
}
