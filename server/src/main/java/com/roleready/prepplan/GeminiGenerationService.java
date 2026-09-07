package com.roleready.prepplan;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.JsonNode;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class GeminiGenerationService {

    private static final String GENERATION_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={apiKey}";

    private final RestClient restClient;
    private final String apiKey;

    public GeminiGenerationService(@Value("${app.gemini.api-key}") String apiKey) {
        this.apiKey = apiKey;
        this.restClient = RestClient.create();
    }

    public String generate(String prompt) {
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "maxOutputTokens", 8192,
                        "temperature", 0.3));

        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                JsonNode response = restClient.post()
                        .uri(GENERATION_URL, apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(requestBody)
                        .retrieve()
                        .body(JsonNode.class);

                return response.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            } catch (HttpServerErrorException e) {
                if (e.getStatusCode().value() == 503 && attempt < 3) {
                    log.warn("Gemini 503 on attempt {}, retrying in 5s...", attempt);
                    try {
                        Thread.sleep(5000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new IllegalStateException("Interrupted while retrying Gemini request", ie);
                    }
                } else {
                    throw e;
                }
            }
        }

        throw new IllegalStateException("Gemini request failed after retries");
    }
}
