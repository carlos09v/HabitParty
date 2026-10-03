package com.habitparty.adapters.in.web.dtos.response;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.domain.enums.FocusRecordType;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record FocusActivityResponseDTO(
    UUID id,
    String name,
    String icon,
    int orderIndex,
    FocusRecordType recordType,
    Integer targetTimeMinutes,
    LocalDateTime createdAt) {
      public static FocusActivityResponseDTO fromDomain(FocusActivity activity) {
        return new FocusActivityResponseDTO(
            activity.getId(),
            activity.getName(),
            activity.getIcon(),
            activity.getOrderIndex(),
            activity.getRecordType(),
            activity.getPomoDurationMinutes().orElse(null),
            activity.getCreatedAt()
        );
    }
}
