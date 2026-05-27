package com.civicpulse.config;

import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.BatchingStrategy;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingOptions;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Configuration
public class LocalAiConfig {

    private static final int EMBEDDING_DIMENSIONS = 384;
    private static final Pattern TOKEN_SPLIT = Pattern.compile("[^a-z0-9]+", Pattern.CASE_INSENSITIVE);

    @Bean
    @Primary
    public EmbeddingModel localEmbeddingModel() {
        return new EmbeddingModel() {
            @Override
            public EmbeddingResponse call(EmbeddingRequest request) {
                List<Embedding> embeddings = new ArrayList<>();
                List<String> instructions = request.getInstructions();
                for (int i = 0; i < instructions.size(); i++) {
                    embeddings.add(new Embedding(embedText(instructions.get(i)), i));
                }
                return new EmbeddingResponse(embeddings);
            }

            @Override
            public float[] embed(String text) {
                return embedText(text);
            }

            @Override
            public float[] embed(Document document) {
                return embedText(document.getContent());
            }

            @Override
            public List<float[]> embed(List<String> texts) {
                List<float[]> embeddings = new ArrayList<>(texts.size());
                for (String text : texts) {
                    embeddings.add(embedText(text));
                }
                return embeddings;
            }

            @Override
            public List<float[]> embed(List<Document> documents, EmbeddingOptions options, BatchingStrategy batchingStrategy) {
                List<float[]> embeddings = new ArrayList<>(documents.size());
                for (Document document : documents) {
                    embeddings.add(embedText(document.getContent()));
                }
                return embeddings;
            }

            @Override
            public int dimensions() {
                return EMBEDDING_DIMENSIONS;
            }

            private float[] embedText(String text) {
                float[] vector = new float[EMBEDDING_DIMENSIONS];
                if (text == null || text.isBlank()) {
                    return vector;
                }

                String[] tokens = TOKEN_SPLIT.split(text.toLowerCase(Locale.ROOT));
                for (String token : tokens) {
                    if (token.isBlank()) {
                        continue;
                    }
                    int index = Math.floorMod(token.hashCode(), EMBEDDING_DIMENSIONS);
                    vector[index] += 1.0f;
                }

                float magnitude = 0.0f;
                for (float value : vector) {
                    magnitude += value * value;
                }
                magnitude = (float) Math.sqrt(magnitude);
                if (magnitude > 0.0f) {
                    for (int i = 0; i < vector.length; i++) {
                        vector[i] = vector[i] / magnitude;
                    }
                }

                return vector;
            }
        };
    }

    @Bean
    @Primary
    public VectorStore vectorStore(EmbeddingModel localEmbeddingModel) {
        return new SimpleVectorStore(localEmbeddingModel);
    }
}