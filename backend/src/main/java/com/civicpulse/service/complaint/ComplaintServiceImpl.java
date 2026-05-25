package com.civicpulse.service.complaint;

import com.civicpulse.exception.ComplaintNotFoundException;
import com.civicpulse.model.dto.request.ComplaintRequestDto;
import com.civicpulse.model.dto.response.AiCategorizationResultDto;
import com.civicpulse.model.dto.response.ComplaintResponseDto;
import com.civicpulse.model.entity.*;
import com.civicpulse.model.enums.ComplaintCategory;
import com.civicpulse.model.enums.ComplaintStatus;
import com.civicpulse.model.enums.Priority;
import com.civicpulse.repository.*;
import com.civicpulse.service.FileStorageService;
import com.civicpulse.service.ai.AiCategorizationService;
import com.civicpulse.service.ai.AiSentimentService;
import com.civicpulse.service.ai.VectorStoreService;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final WardRepository wardRepository;
    private final OfficerRepository officerRepository;
    private final DepartmentRepository departmentRepository;
    private final AiCategorizationService aiCategorizationService;
    private final AiSentimentService aiSentimentService;
    private final VectorStoreService vectorStoreService;
    private final SlaService slaService;
    private final FileStorageService fileStorageService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public ComplaintResponseDto submitComplaint(ComplaintRequestDto dto,
                                                List<MultipartFile> images,
                                                String userEmail) {
        User citizen = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Ward ward = dto.wardId() != null
                ? wardRepository.findById(dto.wardId()).orElse(null)
                : null;

        // Build complaint
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

        // AI enrichment (async-like — happens synchronously but failures don't block)
        try {
            AiCategorizationResultDto aiResult = aiCategorizationService.categorize(
                    dto.title(), dto.description());

            complaint.setAiCategory(aiResult.category());
            complaint.setAiPriority(aiResult.priority());
            complaint.setAiDepartment(aiResult.department());
            complaint.setAiReason(aiResult.reason());

            // Apply AI-suggested category and priority
            try {
                complaint.setCategory(ComplaintCategory.valueOf(aiResult.category()));
            } catch (IllegalArgumentException e) {
                complaint.setCategory(ComplaintCategory.OTHER);
            }
            try {
                complaint.setPriority(Priority.valueOf(aiResult.priority()));
            } catch (IllegalArgumentException e) {
                complaint.setPriority(Priority.MEDIUM);
            }

            // Find matching department
            if (aiResult.department() != null) {
                departmentRepository.findByName(aiResult.department())
                        .ifPresent(complaint::setDepartment);
            }

            // Sentiment score
            complaint.setSentimentScore(
                    aiSentimentService.scoreSentiment(dto.title(), dto.description()));

            // SLA deadline
            complaint.setSlaDeadline(slaService.calculateDeadline(
                    complaint.getCategory(), complaint.getPriority()));

        } catch (Exception ex) {
            log.warn("AI enrichment failed for complaint, using defaults: {}", ex.getMessage());
        }

        // Handle image uploads
        if (images != null && !images.isEmpty()) {
            for (MultipartFile image : images) {
                if (!image.isEmpty()) {
                    String fileUrl = fileStorageService.store(image);
                    ComplaintImage ci = ComplaintImage.builder()
                            .complaint(complaint)
                            .fileName(image.getOriginalFilename())
                            .fileUrl(fileUrl)
                            .contentType(image.getContentType())
                            .fileSize(image.getSize())
                            .build();
                    complaint.getImages().add(ci);
                }
            }
        }

        complaint = complaintRepository.save(complaint);

        // Embed into vector store for RAG
        final Complaint finalComplaint = complaint;
        try {
            vectorStoreService.embedComplaint(finalComplaint);
        } catch (Exception ex) {
            log.warn("Vector store embedding failed: {}", ex.getMessage());
        }

        return toDto(complaint);
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
    public Page<ComplaintResponseDto> getMyComplaints(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return complaintRepository.findByCitizenIdAndIsDeletedFalse(user.getId(), pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ComplaintResponseDto> getWardComplaints(Long wardId, Pageable pageable) {
        return complaintRepository.findByWardIdAndIsDeletedFalse(wardId, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ComplaintResponseDto> getOfficerQueue(String officerEmail, Pageable pageable) {
        User user = userRepository.findByEmail(officerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
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
