package com.habitparty.application.usecases.user;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.SocialNotificationRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.application.usecases.achievement.EvaluateUserAchievementsUseCase;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.AccountResetScope;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class ResetUserAccountUseCase {

  private final UserRepository userPort;
  private final TaskRepository taskPort;
  private final BoardColumnRepository boardColumnPort;
  private final WorkspaceRepository workspacePort;
  private final RewardRepository rewardPort;
  private final InventoryItemRepository inventoryItemPort;
  private final FocusRecordRepository focusRecordPort;
  private final FocusActivityRepository focusActivityPort;
  private final TransactionHistoryRepository transactionHistoryPort;
  private final UserAchievementRepository userAchievementPort;
  private final ProfileHighlightRepository profileHighlightPort;
  private final SocialNotificationRepository socialNotificationPort;
  private final EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;

  public ResetUserAccountUseCase(
      UserRepository userPort,
      TaskRepository taskPort,
      BoardColumnRepository boardColumnPort,
      WorkspaceRepository workspacePort,
      RewardRepository rewardPort,
      InventoryItemRepository inventoryItemPort,
      FocusRecordRepository focusRecordPort,
      FocusActivityRepository focusActivityPort,
      TransactionHistoryRepository transactionHistoryPort,
      @Nullable UserAchievementRepository userAchievementPort,
      @Nullable ProfileHighlightRepository profileHighlightPort,
      @Nullable SocialNotificationRepository socialNotificationPort) {
    this(
        userPort,
        taskPort,
        boardColumnPort,
        workspacePort,
        rewardPort,
        inventoryItemPort,
        focusRecordPort,
        focusActivityPort,
        transactionHistoryPort,
        userAchievementPort,
        profileHighlightPort,
        socialNotificationPort,
        null);
  }

  @Autowired
  public ResetUserAccountUseCase(
      UserRepository userPort,
      TaskRepository taskPort,
      BoardColumnRepository boardColumnPort,
      WorkspaceRepository workspacePort,
      RewardRepository rewardPort,
      InventoryItemRepository inventoryItemPort,
      FocusRecordRepository focusRecordPort,
      FocusActivityRepository focusActivityPort,
      TransactionHistoryRepository transactionHistoryPort,
      @Nullable UserAchievementRepository userAchievementPort,
      @Nullable ProfileHighlightRepository profileHighlightPort,
      @Nullable SocialNotificationRepository socialNotificationPort,
      @Nullable EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase) {
    this.userPort = userPort;
    this.taskPort = taskPort;
    this.boardColumnPort = boardColumnPort;
    this.workspacePort = workspacePort;
    this.rewardPort = rewardPort;
    this.inventoryItemPort = inventoryItemPort;
    this.focusRecordPort = focusRecordPort;
    this.focusActivityPort = focusActivityPort;
    this.transactionHistoryPort = transactionHistoryPort;
    this.userAchievementPort = userAchievementPort;
    this.profileHighlightPort = profileHighlightPort;
    this.socialNotificationPort = socialNotificationPort;
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
  }

  /**
   * Redefine os dados do usuário conforme o escopo escolhido, mantendo conta, login e assinatura ativos.
   */
  @Transactional
  public User execute(UUID userId, AccountResetScope scope) {
    if (scope == null) {
      throw new DomainValidationException("O escopo do reset é obrigatório.");
    }

    User user = userPort.findByIdForUpdate(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));

    // Comum aos dois modos: zera métricas/economia/conquistas e limpa históricos
    transactionHistoryPort.deleteAllByUserId(userId);
    focusRecordPort.deleteAllByUserId(userId);
    if (profileHighlightPort != null) {
      profileHighlightPort.deleteAllByUserId(userId);
    }
    if (userAchievementPort != null) {
      userAchievementPort.deleteAllByUserId(userId);
    }

    if (scope == AccountResetScope.METRICS) {
      // Zera apenas contadores/streaks em tarefas existentes, preservando estrutura do usuário
      taskPort.resetMetricsByUserId(userId);
    } else if (scope == AccountResetScope.COMPLETE) {
      // Limpa todo conteúdo criado pelo usuário em ordem bottom-up, mantendo conta, assinatura e amizades
      taskPort.deleteAllByUserId(userId);
      boardColumnPort.deleteAllByUserId(userId);
      workspacePort.deleteAllByUserId(userId);
      focusActivityPort.deleteAllByUserId(userId);
      inventoryItemPort.deleteAllByUserId(userId);
      rewardPort.deleteAllByUserId(userId);
      if (socialNotificationPort != null) {
        socialNotificationPort.deleteAllByUserId(userId);
      }
      user.resetShowcaseCosmetics();
    }

    user.resetStats();
    if (scope == AccountResetScope.METRICS && user.getStats() != null) {
      // Workspaces existentes são preservados no reset de métricas; sincroniza o contador para não bloquear a conquista WORKSPACE_ARCHITECT
      int existingWorkspaces = Math.max(0, workspacePort.countByUserId(userId));
      user.getStats().setTotalWorkspacesCreated(existingWorkspaces);
    }

    User savedUser = userPort.save(user);
    if (evaluateUserAchievementsUseCase != null) {
      evaluateUserAchievementsUseCase.execute(savedUser);
    }
    return savedUser;
  }
}
