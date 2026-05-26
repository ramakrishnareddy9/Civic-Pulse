package com.civicpulse.service.mail;

/**
 * Segregated interface for sending notification emails.
 * Adheres strictly to the Interface Segregation Principle (ISP).
 */
public interface MailService {
    
    /**
     * Sends a complaint filing receipt confirmation email to the citizen.
     * 
     * @param toEmail The citizen's registered email
     * @param citizenName The citizen's full name
     * @param complaintId The complaint database ID
     * @param title The title of the complaint
     * @param category The AI-resolved/submitted category of the complaint
     * @param ward The assigned municipal ward name
     */
    void sendComplaintSubmissionEmail(String toEmail, String citizenName, Long complaintId, String title, String category, String ward);
    
    /**
     * Sends a status change notification email to the citizen when their complaint is updated.
     * 
     * @param toEmail The citizen's registered email
     * @param citizenName The citizen's full name
     * @param complaintId The complaint database ID
     * @param title The title of the complaint
     * @param oldStatus The status before update
     * @param newStatus The updated status (e.g. IN_PROGRESS, RESOLVED)
     * @param notes The field notes written by the responding officer
     */
    void sendComplaintStatusUpdateEmail(String toEmail, String citizenName, Long complaintId, String title, String oldStatus, String newStatus, String notes);
}
