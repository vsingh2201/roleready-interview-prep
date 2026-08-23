package com.roleready.notification;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class SseEmitterRegistry {

    private final ConcurrentHashMap<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    public void register(String analysisId, SseEmitter emitter) {
        emitters.put(analysisId, emitter);
    }

    public void send(String analysisId, String eventName, String data) {
        SseEmitter emitter = emitters.get(analysisId);
        if (emitter == null) {
            log.warn("No SSE emitter registered for analysisId={}", analysisId);
            return;
        }

        try {
            emitter.send(SseEmitter.event().name(eventName).data(data));
        } catch (IOException e) {
            log.warn("Failed to send SSE event for analysisId={}", analysisId, e);
            emitter.completeWithError(e);
            remove(analysisId);
        }
    }

    public void remove(String analysisId) {
        emitters.remove(analysisId);
    }
}
