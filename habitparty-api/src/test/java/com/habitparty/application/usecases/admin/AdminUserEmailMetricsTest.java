package com.habitparty.application.usecases.admin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.habitparty.application.ports.AdminMetricsRepository;
import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.projections.AdminUserDetailProjection;
import com.habitparty.application.ports.projections.AdminUserSummaryProjection;
import com.habitparty.application.ports.projections.UserStorageBreakdownProjection;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.domain.enums.UserRole;

@ExtendWith(MockitoExtension.class)
class AdminUserEmailMetricsTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private EmailDispatchLogRepository emailLogPort;

  @Mock
  private TaskRepository taskPort;

  @Mock
  private AdminMetricsRepository adminMetricsPort;

  private ListAdminUsersUseCase listAdminUsersUseCase;
  private GetAdminUserDetailUseCase getAdminUserDetailUseCase;

  private final int resendResetDay = 16;

  @BeforeEach
  void setUp() {
    listAdminUsersUseCase = new ListAdminUsersUseCase(
        userRepository,
        emailLogPort,
        taskPort,
        adminMetricsPort,
        resendResetDay
    );

    getAdminUserDetailUseCase = new GetAdminUserDetailUseCase(
        userRepository,
        emailLogPort,
        taskPort,
        adminMetricsPort,
        resendResetDay
    );
  }

  private User createTestUser(UUID userId) {
    return new User(
        userId, UserRole.USER, false, "Carlos Teste", "carlosteste", "carlos@example.com",
        "hashedpass", java.math.BigDecimal.TEN, java.math.BigDecimal.TEN, java.time.LocalDate.of(1995, 5, 20),
        null, com.habitparty.core.domain.enums.UserGender.MALE, 100, 5, 10, LocalDateTime.now()
    );
  }

  @Test
  @DisplayName("ListAdminUsersUseCase deve consultar e-mails filtrando estritamente por status SENT")
  void shouldQueryOnlySentEmailsInListUsers() {
    UUID userId = UUID.randomUUID();
    User user = createTestUser(userId);

    Pageable pageable = PageRequest.of(0, 10);
    when(userRepository.searchUsers(null, null, null, null, null, pageable))
        .thenReturn(new PageImpl<>(List.of(user), pageable, 1));

    when(emailLogPort.countByUserIdsAndStatusAndSentAtAfter(eq(List.of(userId)), eq(EmailDispatchStatus.SENT), any(LocalDateTime.class)))
        .thenReturn(Map.of(userId, 0L));

    when(taskPort.countActiveEmailRemindersByUserIds(List.of(userId)))
        .thenReturn(Map.of(userId, 0L));

    when(adminMetricsPort.calculateUsersStorageBreakdown(List.of(userId)))
        .thenReturn(Map.of(userId, UserStorageBreakdownProjection.empty()));

    var pageResult = listAdminUsersUseCase.execute(null, "ALL", pageable);

    assertNotNull(pageResult);
    assertEquals(1, pageResult.getTotalElements());
    AdminUserSummaryProjection summary = pageResult.getContent().getFirst();
    assertEquals(0L, summary.emailsSentThisMonth(), "E-mails que falharam não devem ser computados na cota");

    verify(emailLogPort).countByUserIdsAndStatusAndSentAtAfter(
        eq(List.of(userId)),
        eq(EmailDispatchStatus.SENT),
        any(LocalDateTime.class)
    );
  }

  @Test
  @DisplayName("GetAdminUserDetailUseCase deve consultar e-mails do usuário filtrando por status SENT")
  void shouldQueryOnlySentEmailsInUserDetail() {
    UUID userId = UUID.randomUUID();
    User user = createTestUser(userId);

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(emailLogPort.countByUserIdAndStatusAndSentAtAfter(eq(userId), eq(EmailDispatchStatus.SENT), any(LocalDateTime.class)))
        .thenReturn(0L);
    when(taskPort.countActiveEmailRemindersByUserId(userId)).thenReturn(0L);
    when(adminMetricsPort.calculateUserStorageBreakdown(userId))
        .thenReturn(UserStorageBreakdownProjection.empty());
    when(emailLogPort.findRecentByUserId(userId, 20)).thenReturn(List.of());

    AdminUserDetailProjection detail = getAdminUserDetailUseCase.execute(userId);

    assertNotNull(detail);
    assertEquals(0L, detail.summary().emailsSentThisMonth());

    verify(emailLogPort).countByUserIdAndStatusAndSentAtAfter(
        eq(userId),
        eq(EmailDispatchStatus.SENT),
        any(LocalDateTime.class)
    );
  }
}
