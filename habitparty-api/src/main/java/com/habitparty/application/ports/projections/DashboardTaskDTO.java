package com.habitparty.application.ports.projections;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.habitparty.core.domain.enums.task.TaskType;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DashboardTaskDTO(
    UUID id,
    String name,
    TaskType taskType,
    LocalDate dueDate,
    String columnName,
    boolean isHardcoreModeEnabled,
    List<DayOfWeek> daysOfWeek
) {
}
