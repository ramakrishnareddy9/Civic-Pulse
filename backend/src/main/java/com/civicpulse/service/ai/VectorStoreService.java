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
            String content = """
                    Complaint ID: %d
                    Title: %s
                    Description: %s
                    Category: %s
                    Status: %s
                    Ward: %s
                    """.formatted(
                    complaint.getId(),
                    complaint.getTitle(),
                    complaint.getDescription(),
                    complaint.getCategory(),
                    complaint.getStatus(),
                    complaint.getWard() != null ? complaint.getWard().getName() : "Unknown"
            );

            Document doc = new Document(content, Map.of(
                    "complaintId", complaint.getId().toString(),
                    "category", complaint.getCategory() != null ? complaint.getCategory().name() : "OTHER",
                    "status", complaint.getStatus().name()
            ));

            vectorStore.add(List.of(doc));
            log.debug("Embedded complaint {} into vector store", complaint.getId());
        } catch (Exception ex) {
            log.error("Failed to embed complaint {}: {}", complaint.getId(), ex.getMessage(), ex);
        }
    }
}
