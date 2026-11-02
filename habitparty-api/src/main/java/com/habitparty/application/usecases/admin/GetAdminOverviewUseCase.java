package com.habitparty.application.usecases.admin;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.AdminMetricsRepository;
import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.projections.AdminOverviewProjection;
import com.habitparty.application.ports.projections.UserStorageBreakdownProjection;
import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.domain.enums.UserRole;

@Service
@Transactional(readOnly = true)
public class GetAdminOverviewUseCase {

  private final UserRepository userRepository;
  private final EmailDispatchLogRepository emailLogPort;
  private final AdminMetricsRepository adminMetricsPort;
  private final long resendMonthlyQuota;
  private final int resendResetDay;

  public GetAdminOverviewUseCase(
      UserRepository userRepository,
      EmailDispatchLogRepository emailLogPort,
      AdminMetricsRepository adminMetricsPort,
      @Value("${resend.quota.monthly-limit:3000}") long resendMonthlyQuota,
      @Value("${resend.quota.reset-day:16}") int resendResetDay) {
    this.userRepository = userRepository;
    this.emailLogPort = emailLogPort;
    this.adminMetricsPort = adminMetricsPort;
    this.resendMonthlyQuota = resendMonthlyQuota > 0 ? resendMonthlyQuota : 3000L;
    this.resendResetDay = Math.max(1, Math.min(31, resendResetDay));
  }

  public AdminOverviewProjection execute() {
    long totalUsers = userRepository.countAll();
    long freeUsers = userRepository.countByIsPremium(false);
    long premiumUsers = userRepository.countByIsPremium(true);
    long founderUsers = userRepository.countFounders();
    long adminUsers = userRepository.countByRole(UserRole.ADMIN);

    LocalDate today = LocalDate.now();
    LocalDate cycleStartDate = resolveCycleStartDate(today, resendResetDay);
    LocalDate cycleResetDate = resolveCycleResetDate(today, resendResetDay);
    LocalDateTime cycleStart = cycleStartDate.atStartOfDay();

    long emailsSentThisMonth = emailLogPort.countByStatusAndSentAtAfter(EmailDispatchStatus.SENT, cycleStart);

    double resendQuotaPercentage = Math.round(((double) emailsSentThisMonth / resendMonthlyQuota * 100.0) * 10.0) / 10.0;

    long totalTasks = adminMetricsPort.countTotalTasks();
    long totalActiveTasks = adminMetricsPort.countTotalActiveTasks();

    long storageBytes = adminMetricsPort.calculateTotalDatabaseStorageBytes();
    String formattedStorage = UserStorageBreakdownProjection.formatBytes(storageBytes);

    return new AdminOverviewProjection(
        totalUsers,
        freeUsers,
        premiumUsers,
        founderUsers,
        adminUsers,
        emailsSentThisMonth,
        resendMonthlyQuota,
        resendQuotaPercentage,
        cycleResetDate,
        totalTasks,
        totalActiveTasks,
        storageBytes,
        formattedStorage
    );
  }

  public static LocalDate resolveCycleStartDate(LocalDate today, int resetDay) {
    int safeDay = Math.max(1, Math.min(31, resetDay));
    YearMonth currentYm = YearMonth.from(today);
    LocalDate anchorThisMonth = currentYm.atDay(Math.min(safeDay, currentYm.lengthOfMonth()));

    if (!today.isBefore(anchorThisMonth)) {
      return anchorThisMonth;
    }
    YearMonth prevYm = currentYm.minusMonths(1);
    return prevYm.atDay(Math.min(safeDay, prevYm.lengthOfMonth()));
  }

  public static LocalDate resolveCycleResetDate(LocalDate today, int resetDay) {
    int safeDay = Math.max(1, Math.min(31, resetDay));
    YearMonth currentYm = YearMonth.from(today);
    LocalDate anchorThisMonth = currentYm.atDay(Math.min(safeDay, currentYm.lengthOfMonth()));

    if (!today.isBefore(anchorThisMonth)) {
      YearMonth nextYm = currentYm.plusMonths(1);
      return nextYm.atDay(Math.min(safeDay, nextYm.lengthOfMonth()));
    }
    return anchorThisMonth;
  }
}
