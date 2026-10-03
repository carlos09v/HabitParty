package com.habitparty.adapters.in.web.dtos.response;

import java.util.UUID;

import com.habitparty.core.domain.entities.task.ChecklistItem;

public record ChecklistItemResponseDTO(
    UUID id,
    String name,
    boolean isCompleted) {
  public static ChecklistItemResponseDTO fromDomain(ChecklistItem item) {
    return new ChecklistItemResponseDTO(
        item.getId(),
        item.getName(),
        item.isCompleted());
  }
}
