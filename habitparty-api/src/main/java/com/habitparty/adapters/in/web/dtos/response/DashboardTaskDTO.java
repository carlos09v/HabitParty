package com.habitparty.adapters.in.web.dtos.response;

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
    List<DayOfWeek> daysOfWeek) {
  // O UseCase/Adapter usará isso para converter a Projeção do Banco no DTO da Web
  // public static DashboardTaskDTO fromProjection(DashboardTaskProjection p) {
  //   return new DashboardTaskDTO(
  //       p.getId(),
  //       p.getName(),
  //       p.getTaskType(),
  //       p.getDueDate(),
  //       p.getColumnName(),
  //       p.getIsHardcoreModeEnabled(),
  //       p.getDaysOfWeek());
  // }
}
