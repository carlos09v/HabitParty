package com.habitparty.application.ports.projections;

public record FoundersQuotaProjection(
    int maxSlots,
    long claimedSlots,
    long remainingSlots,
    boolean isAvailable
) {}
