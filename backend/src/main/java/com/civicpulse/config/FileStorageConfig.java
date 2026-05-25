package com.civicpulse.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Configuration
public class FileStorageConfig {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    @PostConstruct
    public void createUploadDirectory() throws IOException {
        Path path = Paths.get(uploadDir);
        if (!Files.exists(path)) {
            Files.createDirectories(path);
            log.info("Created upload directory: {}", path.toAbsolutePath());
        }
        // Create subdirectories
        Files.createDirectories(path.resolve("images"));
        Files.createDirectories(path.resolve("reports"));
    }

    public String getUploadDir() {
        return uploadDir;
    }
}
