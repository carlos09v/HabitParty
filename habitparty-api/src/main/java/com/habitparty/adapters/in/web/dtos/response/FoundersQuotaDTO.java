package com.habitparty.adapters.in.web.dtos.response;

public record FoundersQuotaDTO(
    int maxSlots,
    long claimedSlots,
    long remainingSlots,
    boolean isAvailable
) {}
