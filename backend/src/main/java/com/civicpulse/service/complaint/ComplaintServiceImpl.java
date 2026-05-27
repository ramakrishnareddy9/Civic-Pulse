package com.civicpulse.service.complaint;

import com.civicpulse.exception.ComplaintNotFoundException;
import com.civicpulse.exception.DuplicateComplaintException;
import com.civicpulse.model.dto.request.ComplaintRequestDto;
import com.civicpulse.model.dto.response.ComplaintResponseDto;
import com.civicpulse.model.entity.*;
import com.civicpulse.model.enums.ComplaintCategory;
import com.civicpulse.model.enums.ComplaintStatus;
import com.civicpulse.model.enums.Priority;
import com.civicpulse.repository.*;
import com.civicpulse.service.FileStorageService;
import com.civicpulse.service.ai.VectorStoreService;
import com.civicpulse.service.complaint.enrichment.ComplaintEnrichmentPipeline;
import com.civicpulse.service.complaint.enrichment.EnrichmentException;
import com.civicpulse.service.mail.MailService;
import com.civicpulse.service.notification.NotificationService;
import com.civicpulse.model.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Implementation of ComplaintService.
 * Responsibilities: complaint creation, retrieval, status updates, reassignment.
 * 
 * Enrichment logic delegated to ComplaintEnrichmentPipeline (SRP + OCP).
 * File handling delegated to FileStorageService (SRP).
 * Notification delegated to messaging template (SRP).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final WardRepository wardRepository;
    private final com.civicpulse.service.geo.WardService wardService;
    private final OfficerRepository officerRepository;
    private final ComplaintEnrichmentPipeline enrichmentPipeline;
    private final VectorStoreService vectorStoreService;
    private final FileStorageService fileStorageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final MailService mailService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public ComplaintResponseDto submit(ComplaintRequestDto dto,
                                       List<MultipartFile> images,
                                       String userEmail) {
        // 1. Get citizen
        User citizen = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        // 2. Get ward if provided, otherwise resolve dynamically from coordinates
        Ward ward = null;
        if (dto.wardId() != null) {
            ward = wardRepository.findById(dto.wardId()).orElse(null);
        } else if (dto.ward() != null && !dto.ward().isBlank()) {
            ward = wardRepository.findByCode(dto.ward()).orElse(null);
            if (ward == null) {
                try {
                    Long id = Long.parseLong(dto.ward());
                    ward = wardRepository.findById(id).orElse(null);
                } catch (NumberFormatException ignored) {}
            }
        }
        
        if (ward == null && dto.latitude() != null && dto.longitude() != null) {
            ward = wardService.detectWard(dto.latitude(), dto.longitude());
        }

        ComplaintCategory submittedCategory = mapSubmittedCategory(dto.category());
        ensureNotDuplicate(submittedCategory, dto.latitude(), dto.longitude());

        // 3. Create base complaint
        Complaint complaint = Complaint.builder()
                .title(dto.title())
                .description(dto.description())
                .latitude(dto.latitude())
                .longitude(dto.longitude())
                .address(dto.address())
            .incidentDate(dto.incidentDate())
            .incidentTime(dto.incidentTime())
                .ward(ward)
                .citizen(citizen)
                .status(ComplaintStatus.OPEN)
                .priority(Priority.MEDIUM)
            .category(submittedCategory)
                .build();

        complaint = complaintRepository.save(complaint);
        log.info("Complaint created (ID: {}): {}", complaint.getId(), complaint.getTitle());

        // 4. Apply enrichment pipeline (AI categorization, sentiment, SLA, etc.)
        try {
            complaint = enrichmentPipeline.enrich(complaint);
        } catch (EnrichmentException ex) {
            if (ex.getSeverity() == EnrichmentException.Severity.HIGH) {
                log.error("HIGH severity enrichment failed, rolling back: {}", ex.getMessage());
                throw new RuntimeException("Complaint enrichment failed - cannot proceed", ex);
            }
            log.warn("Enrichment partially failed (non-blocking): {}", ex.getMessage());
            // Continue with partially enriched complaint
        }

        // 5. Auto-assignment: hybrid strategy — prefer ward officers (by load), otherwise proximity-weighted among dept officers
        try {
            if (complaint.getDepartment() != null) {
                Long deptId = complaint.getDepartment().getId();
                java.util.List<com.civicpulse.model.enums.ComplaintStatus> activeStatuses = java.util.List.of(com.civicpulse.model.enums.ComplaintStatus.OPEN, com.civicpulse.model.enums.ComplaintStatus.IN_PROGRESS);

                // Prefer officers in same ward first
                java.util.List<com.civicpulse.model.entity.Officer> candidates = officerRepository.findByDepartmentIdAndIsActiveTrue(deptId);
                if (complaint.getWard() != null) {
                    java.util.List<com.civicpulse.model.entity.Officer> wardCandidates = officerRepository.findByWardIdAndIsActiveTrue(complaint.getWard().getId());
                    // filter to same department
                    wardCandidates.removeIf(o -> o.getDepartment() == null || !o.getDepartment().getId().equals(deptId));
                    if (!wardCandidates.isEmpty()) candidates = wardCandidates;
                }

                if (candidates != null && !candidates.isEmpty()) {
                    com.civicpulse.model.entity.Officer selected = null;
                    // If we have ward candidates (preferred), choose by lowest load
                    final com.civicpulse.model.entity.Complaint finalComplaint = complaint;
                    boolean usingWard = finalComplaint.getWard() != null && candidates.stream().anyMatch(o -> o.getWard() != null && o.getWard().getId() != null && o.getWard().getId().equals(finalComplaint.getWard().getId()));
                    if (usingWard) {
                        long minLoad = Long.MAX_VALUE;
                        for (com.civicpulse.model.entity.Officer o : candidates) {
                            long load = officerRepository.countActiveAssignments(o.getId(), activeStatuses);
                            if (load < minLoad) { minLoad = load; selected = o; }
                        }
                    } else {
                        // Hybrid: compute normalized load and distance, pick minimal combined score
                        double alpha = 0.6; // weight for load vs distance (tuneable)
                        // gather loads and distances
                        java.util.Map<com.civicpulse.model.entity.Officer, Long> loads = new java.util.HashMap<>();
                        java.util.Map<com.civicpulse.model.entity.Officer, Double> dists = new java.util.HashMap<>();
                        long maxLoad = 1;
                        double maxDist = 1.0;
                        for (com.civicpulse.model.entity.Officer o : candidates) {
                            long load = officerRepository.countActiveAssignments(o.getId(), activeStatuses);
                            loads.put(o, load);
                            if (load > maxLoad) maxLoad = load;
                            double dist = Double.MAX_VALUE;
                            if (complaint.getLatitude() != null && complaint.getLongitude() != null && o.getWard() != null && o.getWard().getLatitude() != null && o.getWard().getLongitude() != null) {
                                dist = calculateDistance(complaint.getLatitude().doubleValue(), complaint.getLongitude().doubleValue(), o.getWard().getLatitude().doubleValue(), o.getWard().getLongitude().doubleValue());
                            }
                            dists.put(o, dist);
                            if (dist != Double.MAX_VALUE && dist > maxDist) maxDist = Math.max(maxDist, dist);
                        }

                        double bestScore = Double.MAX_VALUE;
                        for (com.civicpulse.model.entity.Officer o : candidates) {
                            double normLoad = maxLoad > 0 ? ((double) loads.get(o)) / maxLoad : 0.0;
                            double dist = dists.get(o);
                            double normDist = dist == Double.MAX_VALUE ? 1.0 : (dist / maxDist);
                            double score = alpha * normLoad + (1.0 - alpha) * normDist;
                            if (score < bestScore) { bestScore = score; selected = o; }
                        }
                    }
                    if (selected == null) selected = candidates.get(0);
                    complaint.setOfficer(selected);
                }
            }
        } catch (Exception ex) {
            log.warn("Auto-assignment failed: {}", ex.getMessage());
        }

        // 5. Handle image uploads
        if (images != null && !images.isEmpty()) {
            for (MultipartFile image : images) {
                if (!image.isEmpty()) {
                    try {
                        String fileUrl = fileStorageService.store(image);
                        ComplaintImage ci = ComplaintImage.builder()
                                .complaint(complaint)
                                .fileName(image.getOriginalFilename())
                                .fileUrl(fileUrl)
                                .contentType(image.getContentType())
                                .fileSize(image.getSize())
                                .build();
                        complaint.getImages().add(ci);
                        log.debug("Image attached to complaint {}: {}", complaint.getId(), fileUrl);
                    } catch (Exception ex) {
                        log.warn("Image upload failed for complaint {}: {}", complaint.getId(), ex.getMessage());
                    }
                }
            }
        }

        // Trigger complaint submission email notification (Asynchronous)
        try {
            mailService.sendComplaintSubmissionEmail(
                    complaint.getCitizen().getEmail(),
                    complaint.getCitizen().getFullName(),
                    complaint.getId(),
                    complaint.getTitle(),
                    complaint.getCategory() != null ? complaint.getCategory().name() : "OTHER",
                    complaint.getWard() != null ? complaint.getWard().getName() : "General Triage Zone"
            );
        } catch (Exception ex) {
            log.warn("Failed to schedule complaint submission email: {}", ex.getMessage());
        }

        // 7. Embed into vector store for RAG (non-blocking)
        try {
            vectorStoreService.embedComplaint(complaint);
            log.debug("Complaint {} embedded into vector store", complaint.getId());
        } catch (Exception ex) {
            log.warn("Vector store embedding failed for complaint {}: {}", complaint.getId(), ex.getMessage());
        }

        // 8. Create persistent notifications
        try {
            notificationService.create(
                    complaint.getCitizen().getEmail(),
                    NotificationType.STATUS_UPDATE,
                    "Complaint #" + complaint.getId() + " Submitted",
                    "Your complaint \"" + complaint.getTitle() + "\" has been received and is being reviewed.",
                    "/citizen/complaints/" + complaint.getId()
            );
            if (complaint.getOfficer() != null && complaint.getOfficer().getUser() != null) {
                notificationService.create(
                        complaint.getOfficer().getUser().getEmail(),
                        NotificationType.ASSIGNMENT,
                        "New Complaint Assigned: #" + complaint.getId(),
                        "A new complaint \"" + complaint.getTitle() + "\" has been assigned to you.",
                        "/officer/complaints/" + complaint.getId()
                );
            }
        } catch (Exception ex) {
            log.warn("Failed to create submission notifications for complaint {}: {}", complaint.getId(), ex.getMessage());
        }

        log.info("Complaint submission completed (ID: {})", complaint.getId());
        return toDto(complaint);
    }

    @Override
    @Transactional
    public ComplaintResponseDto submitComplaint(ComplaintRequestDto dto,
                                                List<MultipartFile> images,
                                                String userEmail) {
        // Legacy method — delegates to new submit() method for backward compatibility
        return submit(dto, images, userEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public ComplaintResponseDto getComplaint(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .filter(c -> !c.getIsDeleted())
                .orElseThrow(() -> new ComplaintNotFoundException(id));
        return toDto(complaint);
    }

    @Override
    @Transactional(readOnly = true)
    public ComplaintResponseDto getComplaint(Long id, String requesterEmail) {
        Complaint complaint = complaintRepository.findById(id)
                .filter(c -> !c.getIsDeleted())
                .orElseThrow(() -> new ComplaintNotFoundException(id));

        ensureCanViewComplaint(complaint, requesterEmail);
        return toDto(complaint);
    }

    @Override
    @Transactional(readOnly = true)
    public ComplaintResponseDto getById(Long id) {
        // Maps to getComplaint() for compatibility with new interface
        return getComplaint(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ComplaintResponseDto> getByUser(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));
        return complaintRepository.findByCitizenIdAndIsDeletedFalse(user.getId(), pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ComplaintResponseDto> getMyComplaints(String userEmail, Pageable pageable) {
        // Maps to getByUser() for backward compatibility
        return getByUser(userEmail, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ComplaintResponseDto> getByWard(Long wardId, Pageable pageable) {
        return complaintRepository.findByWardIdAndIsDeletedFalse(wardId, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ComplaintResponseDto> getWardComplaints(Long wardId, Pageable pageable) {
        // Maps to getByWard() for backward compatibility
        return getByWard(wardId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<ComplaintResponseDto> detectDuplicates(String category, java.math.BigDecimal latitude, java.math.BigDecimal longitude, java.time.LocalDateTime observedAt) {
        if (category == null || latitude == null || longitude == null || observedAt == null) {
            return java.util.List.of();
        }

        com.civicpulse.model.enums.ComplaintCategory catEnum = mapSubmittedCategory(category);
        java.time.LocalDateTime since = observedAt.minusHours(1);
        java.util.List<com.civicpulse.model.entity.Complaint> recent = complaintRepository.findRecentOpenByCategory(catEnum, since);

        java.util.List<ComplaintResponseDto> matches = new java.util.ArrayList<>();
        for (com.civicpulse.model.entity.Complaint c : recent) {
            if (c.getLatitude() == null || c.getLongitude() == null) continue;
            // time check: within one hour of observedAt using createdAt as proxy
            if (c.getCreatedAt() == null) continue;
            long seconds = java.time.Duration.between(c.getCreatedAt(), observedAt).abs().getSeconds();
            if (seconds > 3600) continue;

            double distKm = calculateDistance(latitude.doubleValue(), longitude.doubleValue(), c.getLatitude().doubleValue(), c.getLongitude().doubleValue());
            if (distKm <= 1.0) { // within 1 km
                matches.add(toDto(c));
            }
        }
        return matches;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ComplaintResponseDto> getOfficerQueue(String officerEmail, Pageable pageable) {
        User user = userRepository.findByEmail(officerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + officerEmail));
        Officer officer = officerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Officer profile not found"));
        return complaintRepository.findByOfficerIdAndIsDeletedFalse(officer.getId(), pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional
    public ComplaintResponseDto updateStatus(Long id, String status, String notes, String officerEmail) {
        Complaint complaint = complaintRepository.findById(id)
                .filter(c -> !c.getIsDeleted())
                .orElseThrow(() -> new ComplaintNotFoundException(id));
        ComplaintStatus oldStatus = complaint.getStatus();
        ComplaintStatus newStatus = ComplaintStatus.valueOf(status.toUpperCase());

        // Enforce state machine: OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED OR OPEN -> REJECTED
        boolean valid = switch (oldStatus) {
            case OPEN -> newStatus == ComplaintStatus.IN_PROGRESS || newStatus == ComplaintStatus.REJECTED;
            case IN_PROGRESS -> newStatus == ComplaintStatus.RESOLVED || newStatus == ComplaintStatus.REJECTED;
            case RESOLVED -> newStatus == ComplaintStatus.CLOSED || newStatus == ComplaintStatus.REOPENED;
            case REOPENED -> newStatus == ComplaintStatus.IN_PROGRESS || newStatus == ComplaintStatus.REJECTED;
            default -> false;
        };

        if (!valid) {
            throw new com.civicpulse.exception.InvalidStateTransitionException(oldStatus, newStatus);
        }

        complaint.setStatus(newStatus);
        if (notes != null) complaint.setOfficerNotes(notes);
        if (newStatus == ComplaintStatus.RESOLVED) {
            complaint.setResolvedAt(LocalDateTime.now());
            complaint.setCitizenApproved(false);
            // send citizen notification to confirm resolution
            try {
                messagingTemplate.convertAndSendToUser(
                        complaint.getCitizen().getEmail(),
                        "/queue/complaint-updates",
                        "Your complaint #" + id + " has been marked RESOLVED. You have 72 hours to dispute or confirm."
                );
                mailService.sendComplaintStatusUpdateEmail(
                        complaint.getCitizen().getEmail(),
                        complaint.getCitizen().getFullName(),
                        complaint.getId(),
                        complaint.getTitle(),
                        oldStatus.name(),
                        newStatus.name(),
                        notes
                );
            } catch (Exception ex) {
                log.warn("Failed to notify citizen about resolved complaint {}: {}", id, ex.getMessage());
            }
        }

        complaint = complaintRepository.save(complaint);

        // Notify citizen via WebSocket
        try {
            messagingTemplate.convertAndSendToUser(
                    complaint.getCitizen().getEmail(),
                    "/queue/complaint-updates",
                    "Your complaint #" + id + " status updated to: " + newStatus
            );
        } catch (Exception ex) {
            log.warn("WebSocket notification failed: {}", ex.getMessage());
        }

        // Trigger complaint status update email notification (Asynchronous)
        try {
            mailService.sendComplaintStatusUpdateEmail(
                    complaint.getCitizen().getEmail(),
                    complaint.getCitizen().getFullName(),
                    complaint.getId(),
                    complaint.getTitle(),
                    oldStatus.name(),
                    newStatus.name(),
                    notes
            );
        } catch (Exception ex) {
            log.warn("Failed to schedule status update email: {}", ex.getMessage());
        }

        // Persist notification for citizen about status change
        try {
            notificationService.create(
                    complaint.getCitizen().getEmail(),
                    NotificationType.STATUS_UPDATE,
                    "Complaint #" + id + " Status: " + newStatus.name().replace("_", " "),
                    "Your complaint \"" + complaint.getTitle() + "\" has been updated from "
                            + oldStatus.name() + " to " + newStatus.name() + "."
                            + (notes != null && !notes.isBlank() ? " Note: " + notes : ""),
                    "/citizen/complaints/" + id
            );
        } catch (Exception ex) {
            log.warn("Failed to create status update notification for complaint {}: {}", id, ex.getMessage());
        }

        return toDto(complaint);
    }

    @Override
    @Transactional
    public ComplaintResponseDto reassign(Long id, Long officerId) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ComplaintNotFoundException(id));
        Officer officer = officerRepository.findById(officerId)
                .orElseThrow(() -> new IllegalArgumentException("Officer not found"));
        complaint.setOfficer(officer);
        return toDto(complaintRepository.save(complaint));
    }

    @Override
    @Transactional
    public ComplaintResponseDto confirmResolution(Long complaintId, Integer rating, String userEmail) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .filter(c -> !c.getIsDeleted())
                .orElseThrow(() -> new ComplaintNotFoundException(complaintId));

        if (!complaint.getCitizen().getEmail().equalsIgnoreCase(userEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("Only the reporting citizen can confirm resolution");
        }

        if (complaint.getStatus() != com.civicpulse.model.enums.ComplaintStatus.RESOLVED) {
            throw new IllegalStateException("Complaint must be RESOLVED to confirm");
        }

        complaint.setCitizenApproved(true);

        // Persist satisfaction rating if valid
        if (rating != null && rating >= 1 && rating <= 5) {
            complaint.setSatisfactionRating(rating);
        }

        complaint = complaintRepository.save(complaint);

        // Notify officer that citizen confirmed
        try {
            if (complaint.getOfficer() != null && complaint.getOfficer().getUser() != null) {
                messagingTemplate.convertAndSendToUser(
                        complaint.getOfficer().getUser().getEmail(),
                        "/queue/complaint-updates",
                        "Citizen confirmed resolution for complaint #" + complaint.getId()
                );
            }
        } catch (Exception ex) {
            log.warn("Failed to notify officer about citizen confirmation: {}", ex.getMessage());
        }

        return toDto(complaint);
    }

    @Override
    @Transactional
    public ComplaintResponseDto disputeResolution(Long complaintId, String reason, String userEmail) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .filter(c -> !c.getIsDeleted())
                .orElseThrow(() -> new ComplaintNotFoundException(complaintId));

        if (!complaint.getCitizen().getEmail().equalsIgnoreCase(userEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("Only the reporting citizen can dispute resolution");
        }

        if (complaint.getStatus() != com.civicpulse.model.enums.ComplaintStatus.RESOLVED) {
            throw new IllegalStateException("Complaint must be RESOLVED to dispute");
        }

        // Reopen the complaint
        complaint.setStatus(com.civicpulse.model.enums.ComplaintStatus.REOPENED);
        complaint.setOfficerNotes((complaint.getOfficerNotes() == null ? "" : complaint.getOfficerNotes() + "\n") + "Citizen dispute: " + (reason == null ? "No reason provided" : reason));
        complaint.setCitizenApproved(false);
        complaint = complaintRepository.save(complaint);

        // Notify officer
        try {
            if (complaint.getOfficer() != null && complaint.getOfficer().getUser() != null) {
                messagingTemplate.convertAndSendToUser(
                        complaint.getOfficer().getUser().getEmail(),
                        "/queue/complaint-updates",
                        "Citizen disputed resolution for complaint #" + complaint.getId() + ": " + (reason == null ? "No reason" : reason)
                );
                mailService.sendComplaintStatusUpdateEmail(
                        complaint.getOfficer().getUser().getEmail(),
                        complaint.getOfficer().getUser().getFullName(),
                        complaint.getId(),
                        complaint.getTitle(),
                        "RESOLVED",
                        "REOPENED",
                        "Citizen disputed resolution: " + (reason == null ? "No reason" : reason)
                );
            }
        } catch (Exception ex) {
            log.warn("Failed to notify officer about dispute: {}", ex.getMessage());
        }

        return toDto(complaint);
    }

    @Override
    @Transactional
    public void softDelete(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ComplaintNotFoundException(id));
        complaint.setIsDeleted(true);
        complaintRepository.save(complaint);
    }

    private ComplaintResponseDto toDto(Complaint c) {
        List<String> imageUrls = c.getImages() != null
                ? c.getImages().stream().map(ComplaintImage::getFileUrl).toList()
                : List.of();
        return new ComplaintResponseDto(
                c.getId(), c.getTitle(), c.getDescription(),
                c.getCategory(), c.getStatus(), c.getPriority(),
            c.getLatitude(), c.getLongitude(), c.getAddress(),
            c.getIncidentDate(), c.getIncidentTime(),
                c.getWard() != null ? c.getWard().getName() : null,
                c.getWard() != null ? c.getWard().getId() : null,
                c.getCitizen() != null ? c.getCitizen().getFullName() : null,
                c.getCitizen() != null ? c.getCitizen().getId() : null,
                c.getOfficer() != null ? c.getOfficer().getUser().getFullName() : null,
                c.getOfficer() != null ? c.getOfficer().getId() : null,
                c.getDepartment() != null ? c.getDepartment().getName() : null,
                c.getDepartment() != null ? c.getDepartment().getId() : null,
                c.getSlaDeadline(), c.getResolvedAt(), c.getOfficerNotes(),
                c.getAiCategory(), c.getAiPriority(), c.getAiReason(),
                c.getSentimentScore(), imageUrls,
                c.getCreatedAt(), c.getUpdatedAt(),
                c.getSatisfactionRating(), c.getCitizenApproved()
        );
    }

    private void ensureCanViewComplaint(Complaint complaint, String requesterEmail) {
        User user = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + requesterEmail));

        if (user.getRole() == com.civicpulse.model.enums.UserRole.ADMIN) {
            return;
        }

        if (complaint.getCitizen() != null && requesterEmail.equalsIgnoreCase(complaint.getCitizen().getEmail())) {
            return;
        }

        Officer officer = officerRepository.findByUserId(user.getId()).orElse(null);
        if (officer == null) {
            throw new AccessDeniedException("You are not allowed to view this complaint");
        }

        if (complaint.getOfficer() != null
                && complaint.getOfficer().getUser() != null
                && requesterEmail.equalsIgnoreCase(complaint.getOfficer().getUser().getEmail())) {
            return;
        }

        boolean sameWard = officer.getWard() != null
                && complaint.getWard() != null
                && officer.getWard().getId() != null
                && officer.getWard().getId().equals(complaint.getWard().getId());

        boolean sameDepartment = officer.getDepartment() != null
                && complaint.getDepartment() != null
                && officer.getDepartment().getId() != null
                && officer.getDepartment().getId().equals(complaint.getDepartment().getId());

        if (sameWard || sameDepartment) {
            return;
        }

        throw new AccessDeniedException("You are not allowed to view this complaint");
    }

    private Ward findClosestWard(double lat, double lng) {
        try {
            List<Ward> wards = wardRepository.findAll();
            if (wards.isEmpty()) return null;
            
            Ward closestWard = null;
            double minDistance = Double.MAX_VALUE;
            
            for (Ward w : wards) {
                if (w.getLatitude() != null && w.getLongitude() != null) {
                    double dist = calculateDistance(
                            lat, lng, 
                            w.getLatitude().doubleValue(), 
                            w.getLongitude().doubleValue()
                    );
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestWard = w;
                    }
                }
            }
            return closestWard;
        } catch (Exception ex) {
            log.warn("Failed to dynamically resolve closest ward: {}", ex.getMessage());
            return null;
        }
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double theta = lon1 - lon2;
        double dist = Math.sin(Math.toRadians(lat1)) * Math.sin(Math.toRadians(lat2))
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.cos(Math.toRadians(theta));
        dist = Math.acos(dist);
        dist = Math.toDegrees(dist);
        dist = dist * 60 * 1.1515 * 1.609344;
        return dist;
    }

    private void ensureNotDuplicate(ComplaintCategory category, java.math.BigDecimal latitude, java.math.BigDecimal longitude) {
        if (category == null || latitude == null || longitude == null) {
            return;
        }

        List<Complaint> recentComplaints = complaintRepository.findRecentOpenByCategory(
                category,
                LocalDateTime.now().minusHours(1)
        );

        for (Complaint complaint : recentComplaints) {
            if (complaint.getLatitude() == null || complaint.getLongitude() == null) {
                continue;
            }

            double distanceKm = calculateDistance(
                    latitude.doubleValue(),
                    longitude.doubleValue(),
                    complaint.getLatitude().doubleValue(),
                    complaint.getLongitude().doubleValue());

            if (distanceKm <= 0.1) {
                throw new DuplicateComplaintException(
                        "A similar open complaint already exists nearby. Please review existing tickets before submitting again.");
            }
        }
    }

    private ComplaintCategory mapSubmittedCategory(String rawCategory) {
        if (rawCategory == null || rawCategory.isBlank()) {
            return null;
        }

        return switch (rawCategory.trim().toUpperCase()) {
            case "POTHOLE", "ROAD", "TRAFFIC" -> ComplaintCategory.ROAD;
            case "STREETLIGHT", "ELECTRICITY" -> ComplaintCategory.ELECTRICITY;
            case "DRAINAGE" -> ComplaintCategory.DRAINAGE;
            case "POLLUTION", "SANITATION" -> ComplaintCategory.SANITATION;
            case "TREE" -> ComplaintCategory.OTHER;
            case "WATER" -> ComplaintCategory.WATER;
            case "NOISE" -> ComplaintCategory.NOISE;
            default -> ComplaintCategory.OTHER;
        };
    }
}
