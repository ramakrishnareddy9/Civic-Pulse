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

    @Override
    @Transactional
    public ComplaintResponseDto submit(ComplaintRequestDto dto,
                                       List<MultipartFile> images,
                                       String userEmail) {
        // 1. Get citizen
        User citizen = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        // 2. Get ward if provided
        Ward ward = dto.wardId() != null
                ? wardRepository.findById(dto.wardId()).orElse(null)
                : null;

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
}
