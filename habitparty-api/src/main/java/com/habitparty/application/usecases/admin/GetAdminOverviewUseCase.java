package com.habitparty.application.usecases.admin;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.in.web.dtos.response.admin.AdminOverviewDTO;
import com.habitparty.adapters.in.web.dtos.response.admin.UserStorageBreakdownDTO;
import com.habitparty.adapters.out.persistence.repository.UserJpaRepository;
import com.habitparty.application.ports.AdminMetricsRepository;
import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.core.domain.enums.UserRole;

@Service
@Transactional(readOnly = true)
public class GetAdminOverviewUseCase {

  private final UserJpaRepository userRepository;
  private final EmailDispatchLogRepository emailLogPort;
  private final AdminMetricsRepository adminMetricsPort;

  public GetAdminOverviewUseCase(
      UserJpaRepository userRepository,
      EmailDispatchLogRepository emailLogPort,
      AdminMetricsRepository adminMetricsPort) {
    this.userRepository = userRepository;
    this.emailLogPort = emailLogPort;
    this.adminMetricsPort = adminMetricsPort;
  }

  public AdminOverviewDTO execute() {
    long totalUsers = userRepository.count();
    long freeUsers = userRepository.countByIsPremium(false);
    long premiumUsers = userRepository.countByIsPremium(true);
    long founderUsers = userRepository.countByIsFounderTrue();
    long adminUsers = userRepository.countByRole(UserRole.ADMIN);

    LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
    long emailsSentThisMonth = emailLogPort.countBySentAtAfter(startOfMonth);

    long resendMonthlyQuota = 3000L;
    double resendQuotaPercentage = Math.round(((double) emailsSentThisMonth / resendMonthlyQuota * 100.0) * 10.0) / 10.0;

    long totalTasks = adminMetricsPort.countTotalTasks();
    long totalActiveTasks = adminMetricsPort.countTotalActiveTasks();

    long storageBytes = adminMetricsPort.calculateTotalDatabaseStorageBytes();
    String formattedStorage = UserStorageBreakdownDTO.formatBytes(storageBytes);

    return new AdminOverviewDTO(
        totalUsers,
        freeUsers,
        premiumUsers,
        founderUsers,
        adminUsers,
        emailsSentThisMonth,
        resendMonthlyQuota,
        resendQuotaPercentage,
        totalTasks,
        totalActiveTasks,
        storageBytes,
        formattedStorage
    );
  }
}
