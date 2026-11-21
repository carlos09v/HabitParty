package com.habitparty.adapters.in.web.dtos.response;

import java.time.OffsetDateTime;

/**
 * Resumo leve para renderização do AppLayout autenticado sem buscar o extrato completo.
 */
public record UserLayoutSummaryResponseDTO(
    OffsetDateTime lastTaskCompletionAt,
    int todayFocusMinutes
) {}
