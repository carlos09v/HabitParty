package com.habitparty.core.domain.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.domain.enums.EmailType;

public record EmailDispatchLog(
    UUID id,
    UUID userId,
    UUID taskId,
    EmailType emailType,
    String recipientEmail,
    String subject,
    EmailDispatchStatus status,
    String errorMessage,
    LocalDateTime sentAt) {

  public EmailDispatchLog {
    id = id != null ? id : UUID.randomUUID();
    emailType = emailType != null ? emailType : EmailType.TASK_REMINDER;
    status = status != null ? status : EmailDispatchStatus.SENT;
    sentAt = sentAt != null ? sentAt : LocalDateTime.now();
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public UUID getTaskId() {
    return taskId;
  }

  public EmailType getEmailType() {
    return emailType;
  }

  public String getRecipientEmail() {
    return recipientEmail;
  }

  public String getSubject() {
    return subject;
  }

  public EmailDispatchStatus getStatus() {
    return status;
  }

  public String getErrorMessage() {
    return errorMessage;
  }

  public LocalDateTime getSentAt() {
    return sentAt;
  }
}
