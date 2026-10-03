package com.habitparty.adapters.in.web.dtos.response;

import java.util.UUID;

public record BoardColumnSummaryDTO(
    UUID id,
    String name,
    String icon,
    int orderIndex,
    long totalTasks,
    long completedTasks
) {

}
