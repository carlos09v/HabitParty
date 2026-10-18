package com.habitparty.adapters.in.web.dtos.response.admin;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.entities.EmailDispatchLog;
import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.domain.enums.EmailType;

public record EmailDispatchLogDTO(
    UUID id,
    UUID taskId,
    EmailType emailType,
    String recipientEmail,
    String subject,
    EmailDispatchStatus status,
    String errorMessage,
    LocalDateTime sentAt
) {
  public static EmailDispatchLogDTO fromDomain(EmailDispatchLog domain) {
    return new EmailDispatchLogDTO(
        domain.getId(),
        domain.getTaskId(),
        domain.getEmailType(),
        domain.getRecipientEmail(),
        domain.getSubject(),
        domain.getStatus(),
        domain.getErrorMessage(),
        domain.getSentAt()
    );
  }
}
