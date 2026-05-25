package com.civicpulse.controller;

import com.civicpulse.model.dto.request.AiChatRequestDto;
import com.civicpulse.model.dto.response.AiCategorizationResultDto;
import com.civicpulse.model.dto.response.AiChatResponseDto;
import com.civicpulse.model.dto.response.ApiResponseDto;
import com.civicpulse.service.ai.AiCategorizationService;
import com.civicpulse.service.ai.AiChatService;
import com.civicpulse.service.ai.AiSentimentService;
import com.civicpulse.service.ai.AiSummaryService;
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

    private final AiCategorizationService categorizationService;
    private final AiChatService chatService;
    private final AiSummaryService summaryService;
    private final AiSentimentService sentimentService;

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
        String userId = userDetails != null ? userDetails.getUsername() : "anonymous";
        String reply = chatService.chat(userId, dto.message());
        return ResponseEntity.ok(ApiResponseDto.success(
                new AiChatResponseDto(reply, UUID.randomUUID().toString())));
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
