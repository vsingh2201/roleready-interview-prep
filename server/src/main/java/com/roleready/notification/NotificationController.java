package com.roleready.notification;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class NotificationController {

    private static final long TIMEOUT_MS = 5 * 60 * 1000L;

    private final SseEmitterRegistry sseEmitterRegistry;

    @GetMapping("/{analysisId}")
    public SseEmitter subscribe(@PathVariable String analysisId) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        sseEmitterRegistry.register(analysisId, emitter);

        emitter.onTimeout(() -> sseEmitterRegistry.remove(analysisId));
        emitter.onCompletion(() -> sseEmitterRegistry.remove(analysisId));

        return emitter;
    }
}
