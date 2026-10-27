package com.venuebooking.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtendSessionResponseDto {
    private boolean success;
    private boolean conflict;
    private String message;
    private Long sessionId;
    private Long currentResourceId;
    private Instant newEndUtc;
    private List<ResourceAlternativeDto> alternativeResources;
}
