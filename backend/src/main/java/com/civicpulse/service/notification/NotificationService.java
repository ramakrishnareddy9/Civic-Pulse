package com.civicpulse.service.notification;

import com.civicpulse.model.entity.Notification;
import com.civicpulse.model.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    /**
     * Create and persist a notification for a user.
     *
     * @param userEmail recipient email
     * @param type      notification type
     * @param title     short title (shown as subject)
     * @param body      longer description
     * @param link      optional frontend deep-link
     * @return saved notification
     */
    Notification create(String userEmail, NotificationType type, String title, String body, String link);

    /** Paginated list of notifications for a user, newest first. */
    Page<Notification> listForUser(String userEmail, Pageable pageable);

    /** Count of unread notifications for a user (used for badge). */
    long unreadCount(String userEmail);

    /** Mark a single notification as read. Returns the updated notification. */
    Notification markRead(Long notificationId, String userEmail);

    /** Mark all of a user's notifications as read. */
    int markAllRead(String userEmail);

    /** Delete a single notification. */
    void delete(Long notificationId, String userEmail);
}
