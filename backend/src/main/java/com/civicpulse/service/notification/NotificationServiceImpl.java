package com.civicpulse.service.notification;

import com.civicpulse.model.entity.Notification;
import com.civicpulse.model.entity.User;
import com.civicpulse.model.enums.NotificationType;
import com.civicpulse.repository.NotificationRepository;
import com.civicpulse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Notification create(String userEmail, NotificationType type, String title, String body, String link) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .body(body)
                .link(link)
                .isRead(false)
                .build();
        Notification saved = notificationRepository.save(notification);
        log.debug("Notification created for user {}: [{}] {}", userEmail, type, title);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Notification> listForUser(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public long unreadCount(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    @Override
    @Transactional
    public Notification markRead(Long notificationId, String userEmail) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));
        // Ensure the notification belongs to the requesting user
        if (!notification.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("Cannot mark another user's notification as read");
        }
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public int markAllRead(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));
        return notificationRepository.markAllReadByUserId(user.getId());
    }

    @Override
    @Transactional
    public void delete(Long notificationId, String userEmail) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));
        if (!notification.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("Cannot delete another user's notification");
        }
        notificationRepository.delete(notification);
    }
}
