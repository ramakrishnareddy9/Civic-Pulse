package com.civicpulse.controller;

import com.civicpulse.model.dto.response.ApiResponseDto;
import com.civicpulse.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Files", description = "File upload and serving")
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping("/api/files/upload")
    @Operation(summary = "Upload a file and get back the public URL")
    public ResponseEntity<ApiResponseDto<Map<String, String>>> upload(
            @RequestParam("file") MultipartFile file) {
        String url = fileStorageService.store(file);
        return ResponseEntity.ok(ApiResponseDto.success(Map.of("url", url), "File uploaded"));
    }
}
