package com.civicpulse.service.ai;

import com.civicpulse.model.entity.Complaint;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class VectorStoreService {

    private final VectorStore vectorStore;

    /**
     * Embeds a complaint's text into the pgvector store for RAG retrieval.
     */
    public void embedComplaint(Complaint complaint) {
        try {
                // Avoid embedding PII (address, names). Only include non-sensitive fields and ward id.
                String content = """
                    Complaint ID: %d
                    Title: %s
                    Description: %s
                    Category: %s
                    Status: %s
                    """.formatted(
                    complaint.getId(),
                    complaint.getTitle(),
                    complaint.getDescription(),
                    complaint.getCategory(),
                    complaint.getStatus()
                );

                Map<String, Object> metadata = new java.util.HashMap<>();
                metadata.put("complaintId", String.valueOf(complaint.getId()));
                metadata.put("category", complaint.getCategory() != null ? complaint.getCategory().name() : "OTHER");
                metadata.put("status", complaint.getStatus() != null ? complaint.getStatus().name() : "OPEN");
                if (complaint.getWard() != null && complaint.getWard().getId() != null) {
                metadata.put("wardId", String.valueOf(complaint.getWard().getId()));
                }
                // Mark public/resolved complaints as searchable
                metadata.put("public", complaint.getStatus() != null && complaint.getStatus().name().equalsIgnoreCase("RESOLVED") ? "true" : "false");

                Document doc = new Document(content, metadata);

            vectorStore.add(List.of(doc));
            log.debug("Embedded complaint {} into vector store", complaint.getId());
        } catch (Exception ex) {
            log.error("Failed to embed complaint {}: {}", complaint.getId(), ex.getMessage(), ex);
        }
    }
}
