package com.habitparty.adapters.in.web.dtos.response;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.habitparty.application.ports.projections.DashboardTaskDTO;
import com.habitparty.core.domain.enums.task.TaskType;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "DashboardTaskDTO")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record DashboardTaskResponseDTO(
    UUID id,
    String name,
    TaskType taskType,
    LocalDate dueDate,
    String columnName,
    boolean isHardcoreModeEnabled,
    List<DayOfWeek> daysOfWeek
) {
  public static DashboardTaskResponseDTO fromProjection(DashboardTaskDTO dto) {
    return new DashboardTaskResponseDTO(
        dto.id(),
        dto.name(),
        dto.taskType(),
        dto.dueDate(),
        dto.columnName(),
        dto.isHardcoreModeEnabled(),
        dto.daysOfWeek());
  }
}
