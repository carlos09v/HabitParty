package com.habitparty.application.usecases.admin;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.in.web.dtos.response.admin.AdminUserSummaryDTO;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.adapters.out.persistence.repository.UserJpaRepository;
import com.habitparty.application.ports.AdminMetricsRepository;
import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.core.domain.enums.UserRole;

@Service
@Transactional(readOnly = true)
public class ListAdminUsersUseCase {

  private final UserJpaRepository userRepository;
  private final EmailDispatchLogRepository emailLogPort;
  private final TaskRepository taskPort;
  private final AdminMetricsRepository adminMetricsPort;

  public ListAdminUsersUseCase(
      UserJpaRepository userRepository,
      EmailDispatchLogRepository emailLogPort,
      TaskRepository taskPort,
      AdminMetricsRepository adminMetricsPort) {
    this.userRepository = userRepository;
    this.emailLogPort = emailLogPort;
    this.taskPort = taskPort;
    this.adminMetricsPort = adminMetricsPort;
  }

  public Page<AdminUserSummaryDTO> execute(String search, String filter, Pageable pageable) {
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

    Page<UserJpaEntity> usersPage = userRepository.searchUsers(cleanSearch, roleFilter, isPremiumFilter, isFounderFilter, pageable);

    LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

    return usersPage.map(u -> {
      long emailsSentThisMonth = emailLogPort.countByUserIdAndSentAtAfter(u.getId(), startOfMonth);
      long activeEmailReminders = taskPort.countActiveEmailRemindersByUserId(u.getId());
      var storage = adminMetricsPort.calculateUserStorageBreakdown(u.getId());

      return new AdminUserSummaryDTO(
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
    });
  }
}
