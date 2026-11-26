package com.habitparty.adapters.out.persistence.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.domain.enums.EmailType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "email_dispatch_logs", indexes = {
    @Index(name = "idx_email_dispatch_logs_user_id", columnList = "user_id"),
    @Index(name = "idx_email_dispatch_logs_sent_at", columnList = "sent_at")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
public class EmailDispatchLogJpaEntity extends BaseUuidJpaEntity {

  @Id
  @ToString.Include
  @Column(name = "id", nullable = false)
  private UUID id;

  @Column(name = "user_id")
  private UUID userId;

  @Column(name = "task_id")
  private UUID taskId;

  @ToString.Include
  @Enumerated(EnumType.STRING)
  @Column(name = "email_type", nullable = false, length = 30)
  private EmailType emailType;

  @Column(name = "recipient_email", nullable = false, length = 255)
  private String recipientEmail;

  @Column(name = "subject", length = 255)
  private String subject;

  @ToString.Include
  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 20)
  private EmailDispatchStatus status;

  @Column(name = "error_message", length = 500)
  private String errorMessage;

  @Column(name = "sent_at", nullable = false)
  private LocalDateTime sentAt;
}
