package com.civicpulse.controller;

import com.civicpulse.model.entity.Notification;
import com.civicpulse.model.dto.response.ApiResponseDto;
import com.civicpulse.service.notification.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST endpoints for per-user notification management.
 * All endpoints are scoped to the currently authenticated user.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "User notification management")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "List notifications for the current user (newest first)")
    public ResponseEntity<ApiResponseDto<Page<Notification>>> list(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<Notification> page = notificationService.listForUser(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponseDto.success(page));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get count of unread notifications (for badge display)")
    public ResponseEntity<ApiResponseDto<Map<String, Long>>> unreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        long count = notificationService.unreadCount(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponseDto.success(Map.of("count", count)));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    public ResponseEntity<ApiResponseDto<Notification>> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Notification updated = notificationService.markRead(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponseDto.success(updated, "Notification marked as read"));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Mark all notifications as read for the current user")
    public ResponseEntity<ApiResponseDto<Map<String, Integer>>> markAllRead(
            @AuthenticationPrincipal UserDetails userDetails) {
        int count = notificationService.markAllRead(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponseDto.success(Map.of("marked", count), "All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a notification")
    public ResponseEntity<ApiResponseDto<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        notificationService.delete(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponseDto.success(null, "Notification deleted"));
    }
}
