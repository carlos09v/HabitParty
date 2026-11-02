package com.habitparty.application.usecases.admin;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.AdminMetricsRepository;
import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.projections.AdminUserDetailProjection;
import com.habitparty.application.ports.projections.AdminUserSummaryProjection;
import com.habitparty.core.domain.entities.EmailDispatchLog;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional(readOnly = true)
public class GetAdminUserDetailUseCase {

  private final UserRepository userRepository;
  private final EmailDispatchLogRepository emailLogPort;
  private final TaskRepository taskPort;
  private final AdminMetricsRepository adminMetricsPort;
  private final int resendResetDay;

  public GetAdminUserDetailUseCase(
      UserRepository userRepository,
      EmailDispatchLogRepository emailLogPort,
      TaskRepository taskPort,
      AdminMetricsRepository adminMetricsPort,
      @Value("${resend.quota.reset-day:16}") int resendResetDay) {
    this.userRepository = userRepository;
    this.emailLogPort = emailLogPort;
    this.taskPort = taskPort;
    this.adminMetricsPort = adminMetricsPort;
    this.resendResetDay = Math.max(1, Math.min(31, resendResetDay));
  }

  public AdminUserDetailProjection execute(UUID userId) {
    User u = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    LocalDateTime cycleStart = GetAdminOverviewUseCase
        .resolveCycleStartDate(LocalDate.now(), resendResetDay)
        .atStartOfDay();
    long emailsSentThisMonth = emailLogPort.countByUserIdAndStatusAndSentAtAfter(
        u.getId(),
        EmailDispatchStatus.SENT,
        cycleStart
    );
    long activeEmailReminders = taskPort.countActiveEmailRemindersByUserId(u.getId());
    var storage = adminMetricsPort.calculateUserStorageBreakdown(u.getId());

    AdminUserSummaryProjection summary = new AdminUserSummaryProjection(
        u.getId(),
        u.getFullName(),
        u.getUsername(),
        u.getEmail(),
        u.getProfilePhotoUrl().orElse(null),
        u.getRole(),
        u.isPremium(),
        u.isFounder(),
        u.getSubscriptionStatus(),
        u.getCreatedAt(),
        emailsSentThisMonth,
        activeEmailReminders,
        storage.tasksCount(),
        storage.activeTasksCount(),
        storage.totalBytes(),
        storage.totalFormatted()
    );

    List<EmailDispatchLog> recentLogs = emailLogPort.findRecentByUserId(userId, 20);

    return new AdminUserDetailProjection(summary, storage, recentLogs);
  }
}
