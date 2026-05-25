package com.civicpulse.service.ai;

import com.civicpulse.service.ai.provider.LlmProvider;
import com.civicpulse.service.ai.provider.LlmProviderException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * AI Chat Service for citizen chatbot.
 * Uses RAG (Retrieval-Augmented Generation) pattern.
 * Depends on LlmProvider abstraction for technology flexibility.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatService {

    private final LlmProvider llmProvider;
    private final VectorStore vectorStore;

    public String chat(String userId, String userMessage) {
        try {
            // 1. Retrieve relevant complaint documents from vector store
            List<Document> relevantDocs = vectorStore.similaritySearch(
                    SearchRequest.builder()
                            .query(userMessage)
                            .topK(5)
                            .build()
            );

            String context = relevantDocs.stream()
                    .map(Document::getText)
                    .collect(Collectors.joining("\n---\n"));

            // 2. Prepare RAG prompt with context
            var systemPrompt = """
                    You are CivicBot, an assistant helping citizens of Indian municipalities
                    track their grievances and civic complaints.
                    Use ONLY the provided complaint context to answer questions.
                    Be concise, helpful, and empathetic.
                    If the context doesn't have relevant information, say so politely.
                    """;

            var userPrompt = """
                    Context from complaint database:
                    {context}
                    
                    User question: {userMessage}
                    """;

            Map<String, Object> params = new HashMap<>();
            params.put("context", context.isEmpty() ? "No relevant complaints found." : context);
            params.put("userMessage", userMessage);

            // 3. Invoke LLM with RAG context
            return llmProvider.invokeWithParams(systemPrompt, userPrompt, params, String.class);

        } catch (LlmProviderException ex) {
            log.error("AI chat error: {}", ex.getMessage(), ex);
            return "I'm sorry, I'm having trouble connecting to my knowledge base right now. " +
                   "Please try again in a moment or contact support.";
        } catch (Exception ex) {
            log.error("Unexpected error in chat service: {}", ex.getMessage(), ex);
            return "An unexpected error occurred. Please try again later.";
        }
    }
}
