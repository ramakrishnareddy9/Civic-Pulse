package com.civicpulse.service.ai.provider;

import com.civicpulse.model.dto.response.AiCategorizationResultDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@ConditionalOnExpression("!T(org.springframework.util.StringUtils).hasText('${OPENAI_API_KEY:}')")
@Slf4j
public class FallbackLlmProvider implements LlmProvider {

    @Override
    public <T> T invoke(String systemPrompt, String userMessage, Class<T> responseType) throws LlmProviderException {
        // Very limited fallback: return a simple message or throw for non-categorization use
        if (responseType == String.class) {
            return responseType.cast("[AI UNAVAILABLE] " + userMessage);
        }
        throw new LlmProviderException("Fallback provider cannot handle invoke for type " + responseType,
                LlmProviderException.ErrorType.API_ERROR);
    }

    @Override
    public <T> T invokeWithParams(String systemPrompt, String userMessage, Map<String, Object> parameters, Class<T> responseType) throws LlmProviderException {
        // Support categorization fallback using rule based heuristics
        if (responseType == AiCategorizationResultDto.class) {
            String title = parameters.getOrDefault("title", "").toString();
            String description = parameters.getOrDefault("description", "").toString();

            // Simple keyword-based categorization
            String text = (title + " " + description).toLowerCase();
            String category = "OTHER";
            if (text.contains("water") || text.contains("sewage") || text.contains("leak")) category = "WATER";
            else if (text.contains("road") || text.contains("pothole") || text.contains("traffic")) category = "ROAD";
            else if (text.contains("light") || text.contains("electric") || text.contains("power")) category = "ELECTRICITY";
            else if (text.contains("garbage") || text.contains("trash") || text.contains("sanitation")) category = "SANITATION";
            else if (text.contains("drain") || text.contains("flood")) category = "DRAINAGE";
            else if (text.contains("noise") || text.contains("loud")) category = "NOISE";

            String priority = "MEDIUM";
            if (text.contains("injur") || text.contains("accident") || text.contains("collapse") || text.contains("fire")) priority = "CRITICAL";
            else if (text.contains("major") || text.contains("blocked") || text.contains("overflow") || text.contains("outage")) priority = "HIGH";

            AiCategorizationResultDto dto = new AiCategorizationResultDto(category, priority, "General Administration",
                    "Fallback rule-based categorization applied");
            return responseType.cast(dto);
        }
        throw new LlmProviderException("Fallback provider cannot handle invokeWithParams for type " + responseType,
                LlmProviderException.ErrorType.API_ERROR);
    }

    @Override
    public String invokeText(String systemPrompt, String userMessage) throws LlmProviderException {
        return "[AI UNAVAILABLE]";
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public String getProviderName() {
        return "FallbackRules";
    }
}
