package com.habitparty.application.usecases.admin;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.in.web.dtos.response.admin.AdminUserDetailDTO;
import com.habitparty.adapters.in.web.dtos.response.admin.AdminUserSummaryDTO;
import com.habitparty.adapters.in.web.dtos.response.admin.EmailDispatchLogDTO;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.adapters.out.persistence.repository.UserJpaRepository;
import com.habitparty.application.ports.AdminMetricsRepository;
import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional(readOnly = true)
public class GetAdminUserDetailUseCase {

  private final UserJpaRepository userRepository;
  private final EmailDispatchLogRepository emailLogPort;
  private final TaskRepository taskPort;
  private final AdminMetricsRepository adminMetricsPort;

  public GetAdminUserDetailUseCase(
      UserJpaRepository userRepository,
      EmailDispatchLogRepository emailLogPort,
      TaskRepository taskPort,
      AdminMetricsRepository adminMetricsPort) {
    this.userRepository = userRepository;
    this.emailLogPort = emailLogPort;
    this.taskPort = taskPort;
    this.adminMetricsPort = adminMetricsPort;
  }

  public AdminUserDetailDTO execute(UUID userId) {
    UserJpaEntity u = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
    long emailsSentThisMonth = emailLogPort.countByUserIdAndSentAtAfter(u.getId(), startOfMonth);
    long activeEmailReminders = taskPort.countActiveEmailRemindersByUserId(u.getId());
    var storage = adminMetricsPort.calculateUserStorageBreakdown(u.getId());

    AdminUserSummaryDTO summary = new AdminUserSummaryDTO(
        u.getId(),
        u.getFullName(),
        u.getUsername(),
        u.getEmail(),
        u.getProfilePhotoUrl(),
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

    List<EmailDispatchLogDTO> recentLogs = emailLogPort.findRecentByUserId(userId, 20)
        .stream()
        .map(EmailDispatchLogDTO::fromDomain)
        .toList();

    return new AdminUserDetailDTO(summary, storage, recentLogs);
  }
}
