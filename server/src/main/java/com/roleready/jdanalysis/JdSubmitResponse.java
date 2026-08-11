package com.roleready.jdanalysis;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class JdSubmitResponse {

    private UUID analysisId;

    private String status;

    public JdSubmitResponse(UUID analysisId) {
        this(analysisId, "processing");
    }
}
