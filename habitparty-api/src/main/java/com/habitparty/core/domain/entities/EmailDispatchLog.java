package com.habitparty.core.domain.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.domain.enums.EmailType;

public class EmailDispatchLog {
  private final UUID id;
  private final UUID userId;
  private final UUID taskId;
  private final EmailType emailType;
  private final String recipientEmail;
  private final String subject;
  private final EmailDispatchStatus status;
  private final String errorMessage;
  private final LocalDateTime sentAt;

  public EmailDispatchLog(
      UUID id,
      UUID userId,
      UUID taskId,
      EmailType emailType,
      String recipientEmail,
      String subject,
      EmailDispatchStatus status,
      String errorMessage,
      LocalDateTime sentAt) {
    this.id = id != null ? id : UUID.randomUUID();
    this.userId = userId;
    this.taskId = taskId;
    this.emailType = emailType != null ? emailType : EmailType.TASK_REMINDER;
    this.recipientEmail = recipientEmail;
    this.subject = subject;
    this.status = status != null ? status : EmailDispatchStatus.SENT;
    this.errorMessage = errorMessage;
    this.sentAt = sentAt != null ? sentAt : LocalDateTime.now();
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
