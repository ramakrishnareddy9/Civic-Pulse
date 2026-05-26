package com.civicpulse.service.complaint;

import com.civicpulse.exception.ComplaintNotFoundException;
import com.civicpulse.model.dto.request.ComplaintRequestDto;
import com.civicpulse.model.dto.response.ComplaintResponseDto;
import com.civicpulse.model.entity.*;
import com.civicpulse.model.enums.ComplaintStatus;
import com.civicpulse.model.enums.Priority;
import com.civicpulse.repository.*;
import com.civicpulse.service.FileStorageService;
import com.civicpulse.service.ai.VectorStoreService;
import com.civicpulse.service.complaint.enrichment.ComplaintEnrichmentPipeline;
import com.civicpulse.service.complaint.enrichment.EnrichmentException;
import com.civicpulse.service.mail.MailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
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
    private final OfficerRepository officerRepository;
    private final ComplaintEnrichmentPipeline enrichmentPipeline;
    private final VectorStoreService vectorStoreService;
    private final FileStorageService fileStorageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final MailService mailService;

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
        } else if (dto.latitude() != null && dto.longitude() != null) {
            ward = findClosestWard(dto.latitude().doubleValue(), dto.longitude().doubleValue());
        }

        // 3. Create base complaint
        Complaint complaint = Complaint.builder()
                .title(dto.title())
                .description(dto.description())
                .latitude(dto.latitude())
                .longitude(dto.longitude())
                .address(dto.address())
                .ward(ward)
                .citizen(citizen)
                .status(ComplaintStatus.OPEN)
                .priority(Priority.MEDIUM)
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

        // 6. Save final complaint
        complaint = complaintRepository.save(complaint);

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
        complaint.setStatus(newStatus);
        if (notes != null) complaint.setOfficerNotes(notes);
        if (newStatus == ComplaintStatus.RESOLVED) {
            complaint.setResolvedAt(LocalDateTime.now());
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
                c.getCreatedAt(), c.getUpdatedAt()
        );
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
}
