package com.habitparty.application.usecases.admin;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.AdminMetricsRepository;
import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.projections.AdminUserSummaryProjection;
import com.habitparty.application.ports.projections.UserStorageBreakdownProjection;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.domain.enums.UserRole;

@Service
@Transactional(readOnly = true)
public class ListAdminUsersUseCase {

  private final UserRepository userRepository;
  private final EmailDispatchLogRepository emailLogPort;
  private final TaskRepository taskPort;
  private final AdminMetricsRepository adminMetricsPort;
  private final int resendResetDay;

  public ListAdminUsersUseCase(
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

  public Page<AdminUserSummaryProjection> execute(String search, String filter, Pageable pageable) {
    String cleanSearch = (search != null && !search.trim().isBlank()) ? search.trim() : null;

    UserRole roleFilter = null;
    Boolean isPremiumFilter = null;
    Boolean isFounderFilter = null;

    if ("ADMIN".equalsIgnoreCase(filter)) {
      roleFilter = UserRole.ADMIN;
    } else if ("PREMIUM".equalsIgnoreCase(filter)) {
      isPremiumFilter = true;
    } else if ("FOUNDER".equalsIgnoreCase(filter)) {
      isFounderFilter = true;
    } else if ("FREE".equalsIgnoreCase(filter)) {
      isPremiumFilter = false;
    }

    Page<User> usersPage = userRepository.searchUsers(cleanSearch, roleFilter, isPremiumFilter, isFounderFilter, pageable);
    if (usersPage.isEmpty()) {
      return usersPage.map(u -> null);
    }

    List<UUID> userIds = usersPage.getContent().stream().map(User::getId).toList();
    LocalDateTime cycleStart = GetAdminOverviewUseCase
        .resolveCycleStartDate(LocalDate.now(), resendResetDay)
        .atStartOfDay();

    // Consultas em lote (eliminam o N+1 por usuário da página)
    Map<UUID, Long> emailsSentMap = emailLogPort.countByUserIdsAndStatusAndSentAtAfter(
        userIds,
        EmailDispatchStatus.SENT,
        cycleStart
    );
    Map<UUID, Long> activeRemindersMap = taskPort.countActiveEmailRemindersByUserIds(userIds);
    Map<UUID, UserStorageBreakdownProjection> storageMap = adminMetricsPort.calculateUsersStorageBreakdown(userIds);

    return usersPage.map(u -> {
      long emailsSentThisMonth = emailsSentMap.getOrDefault(u.getId(), 0L);
      long activeEmailReminders = activeRemindersMap.getOrDefault(u.getId(), 0L);
      UserStorageBreakdownProjection storage = storageMap.getOrDefault(u.getId(), UserStorageBreakdownProjection.empty());

      return new AdminUserSummaryProjection(
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
    });
  }
}
