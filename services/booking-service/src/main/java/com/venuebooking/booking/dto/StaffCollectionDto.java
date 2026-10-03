package com.venuebooking.booking.dto;

public record StaffCollectionDto(
    Long staffUserId,
    String staffName,
    Integer sessionsHandled,
    Long cashCollectedPaise,
    Long upiCollectedPaise,
    Long totalCollectedPaise
) {}
