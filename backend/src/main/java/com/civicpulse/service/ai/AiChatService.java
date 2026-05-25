package com.civicpulse.service.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;

    public String chat(String userId, String userMessage) {
        try {
            // 1. Embed query and search similar complaint documents
            List<Document> relevantDocs = vectorStore.similaritySearch(
                    SearchRequest.builder()
                            .query(userMessage)
                            .topK(5)
                            .build()
            );

            String context = relevantDocs.stream()
                    .map(Document::getText)
                    .collect(Collectors.joining("\n---\n"));

            // 2. RAG-based chat
            return chatClient.prompt()
                    .system(s -> s.text("""
                            You are CivicBot, an assistant helping citizens of Indian municipalities
                            track their grievances and civic complaints.
                            Use ONLY the provided complaint context to answer questions.
                            Be concise, helpful, and empathetic.
                            If the context doesn't have relevant information, say so politely.
                            Context from complaint database:
                            {context}
                            """).param("context", context.isEmpty() ? "No relevant complaints found." : context))
                    .user(userMessage)
                    .call()
                    .content();
        } catch (Exception ex) {
            log.error("AI chat error: {}", ex.getMessage(), ex);
            return "I'm sorry, I'm having trouble connecting to my knowledge base right now. " +
                   "Please try again in a moment or contact support.";
        }
    }
}
