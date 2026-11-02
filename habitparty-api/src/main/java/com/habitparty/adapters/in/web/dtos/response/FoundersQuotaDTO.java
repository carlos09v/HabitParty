package com.habitparty.adapters.in.web.dtos.response;

import com.habitparty.application.ports.projections.FoundersQuotaProjection;

public record FoundersQuotaDTO(
    int maxSlots,
    long claimedSlots,
    long remainingSlots,
    boolean isAvailable
) {
  public static FoundersQuotaDTO fromProjection(FoundersQuotaProjection p) {
    return new FoundersQuotaDTO(
        p.maxSlots(),
        p.claimedSlots(),
        p.remainingSlots(),
        p.isAvailable()
    );
  }
}
