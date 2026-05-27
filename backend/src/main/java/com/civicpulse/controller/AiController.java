package com.civicpulse.controller;

import com.civicpulse.model.dto.request.AiChatRequestDto;
import com.civicpulse.model.dto.response.AiCategorizationResultDto;
import com.civicpulse.model.dto.response.AiChatResponseDto;
import com.civicpulse.model.dto.response.ApiResponseDto;
import com.civicpulse.repository.UserRepository;
import com.civicpulse.service.ai.AiCategorizationFacade;
import com.civicpulse.service.ai.AiChatService;
import com.civicpulse.service.ai.AiSentimentService;
import com.civicpulse.service.ai.AiSummaryService;
import org.springframework.data.redis.core.StringRedisTemplate;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Features", description = "Spring AI powered endpoints")
public class AiController {

    private final AiCategorizationFacade categorizationService;
    private final AiChatService chatService;
    private final AiSummaryService summaryService;
    private final AiSentimentService sentimentService;
    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;

    @PostMapping("/categorize")
    @Operation(summary = "AI suggest category + priority for complaint text")
    public ResponseEntity<ApiResponseDto<AiCategorizationResultDto>> categorize(
            @RequestParam String title,
            @RequestParam String description) {
        return ResponseEntity.ok(ApiResponseDto.success(
            categorizationService.categorize(title, description)));
    }

    @PostMapping("/chat")
    @Operation(summary = "Citizen chatbot with RAG-based complaint Q&A")
    public ResponseEntity<ApiResponseDto<AiChatResponseDto>> chat(
            @Valid @RequestBody AiChatRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails != null ? userDetails.getUsername() : (dto.userId() != null ? dto.userId() : "anonymous");

        // Maintain a stable session id per authenticated user via Redis
        String sessionKey = "ai:session:" + userId;
        String sessionId = null;
        try {
            sessionId = redisTemplate.opsForValue().get(sessionKey);
            if (sessionId == null) {
                sessionId = UUID.randomUUID().toString();
                redisTemplate.opsForValue().set(sessionKey, sessionId);
            }
        } catch (Exception ex) {
            // Redis not available - fallback to ephemeral session id
            sessionId = UUID.randomUUID().toString();
        }

        // Build metadata filters: if citizen, restrict to their ward and only public/resolved complaints
        java.util.Map<String, String> filters = new java.util.HashMap<>();
        try {
            if (userDetails != null) {
                userRepository.findByEmail(userDetails.getUsername()).ifPresent(user -> {
                    if (user.getWard() != null) {
                        filters.put("wardId", String.valueOf(user.getWard().getId()));
                    }
                    // enforce only public/resolved complaints in RAG
                    filters.put("public", "true");
                });
            } else {
                // For anonymous, disallow private complaints
                filters.put("public", "true");
            }
        } catch (Exception ex) {
            // ignore filter building errors
        }

        String reply = chatService.chat(userId, dto.message(), filters);
        return ResponseEntity.ok(ApiResponseDto.success(
                new AiChatResponseDto(reply, sessionId)));
    }

    @GetMapping("/summary/ward/{wardId}")
    @PreAuthorize("hasAnyRole('OFFICER','DEPT_HEAD','ADMIN')")
    @Operation(summary = "AI summary of open complaints in a ward")
    public ResponseEntity<ApiResponseDto<String>> wardSummary(@PathVariable Long wardId) {
        return ResponseEntity.ok(ApiResponseDto.success(summaryService.generateWardSummary(wardId)));
    }

    @PostMapping("/sentiment")
    @Operation(summary = "AI urgency score for a complaint text")
    public ResponseEntity<ApiResponseDto<Object>> sentiment(
            @RequestParam String title,
            @RequestParam String description) {
        return ResponseEntity.ok(ApiResponseDto.success(
                sentimentService.scoreSentiment(title, description)));
    }
}
