package com.habitparty.application.usecases.focus;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.springframework.lang.Nullable;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.achievement.EvaluateUserAchievementsUseCase;
import com.habitparty.application.usecases.common.UtcDateTimeMapper;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

/**
 * Helpers compartilhados pelos casos de uso de criação e atualização de registros de foco,
 * centralizando validações de acesso, vínculos de tarefas, fusos horários e conquistas de cupons.
 */
final class FocusRecordSupport {

  static final int FREE_ACTIVE_ACTIVITY_LIMIT = 4;

  private FocusRecordSupport() {}

  static Task loadAndValidateLinkedTask(
      UUID userId,
      UUID taskId,
      @Nullable TaskRepository taskPort,
      String missingPortMessage) {
    return loadAndValidateLinkedTask(userId, taskId, taskPort, null, missingPortMessage);
  }

  static Task loadAndValidateLinkedTask(
      UUID userId,
      UUID taskId,
      @Nullable TaskRepository taskPort,
      @Nullable WorkspaceWriteGuard workspaceWriteGuard,
      String missingPortMessage) {
    if (taskPort == null) {
      throw new IllegalStateException(missingPortMessage);
    }
    Task task = taskPort.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Tarefa vinculada ao foco não foi encontrada."));
    task.validateOwnership(userId);
    if (task.getTaskType() == TaskType.HABIT) {
      throw new DomainValidationException(
          "Apenas tarefas Diárias e Afazeres podem ser vinculadas a sessões de foco.");
    }
    if (workspaceWriteGuard != null && task.getBoardColumnId() != null) {
      workspaceWriteGuard.assertColumnWritable(
          task.getBoardColumnId(),
          userId,
          "Esta tarefa pertence a um ambiente em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para vinculá-la ao foco!");
    }
    return task;
  }

  static void validateFreePlanActivityAccess(
      UUID userId,
      UUID activityId,
      @Nullable User user,
      @Nullable FocusActivityRepository focusActivityPort) {
    if (user == null || user.isPremium() || focusActivityPort == null) {
      return;
    }
    List<FocusActivity> userActivities = focusActivityPort.findAllByUserIdOrderByOrderIndex(userId);
    int actIndex = -1;
    for (int i = 0; i < userActivities.size(); i++) {
      if (userActivities.get(i).getId().equals(activityId)) {
        actIndex = i;
        break;
      }
    }
    if (actIndex >= FREE_ACTIVE_ACTIVITY_LIMIT) {
      throw new LimitExceededException(
          "Esta atividade está pausada no plano Free (máximo de 4 atividades ativas). Assine o plano Premium para utilizá-la!");
    }
  }

  static void evaluateCouponDepletionAchievement(
      UUID userId,
      InventoryItem item,
      int secondsBefore,
      int secondsAfter,
      @Nullable User loadedUser,
      @Nullable UserRepository userPort,
      @Nullable EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase) {
    boolean isTimeBasedCoupon = item.getRemainingSeconds().isPresent();
    if (!isTimeBasedCoupon || secondsBefore <= 1 || secondsAfter > 1 || userPort == null) {
      return;
    }
    User couponOwner = loadedUser != null
        ? loadedUser
        : userPort.findById(userId).orElse(null);
    if (couponOwner != null && couponOwner.getStats() != null) {
      couponOwner.getStats().recordCouponDepleted();
      userPort.save(couponOwner);
      if (evaluateUserAchievementsUseCase != null) {
        evaluateUserAchievementsUseCase.execute(couponOwner);
      }
    }
  }

  static ZoneId resolveUserZone(@Nullable User user) {
    return user != null
        ? user.resolveZoneId(ZoneId.of(User.DEFAULT_TIMEZONE))
        : ZoneId.of(User.DEFAULT_TIMEZONE);
  }

  static LocalDateTime toServerTime(LocalDateTime userTime, ZoneId userZone) {
    return UtcDateTimeMapper.toServerLocalDateTime(userTime, userZone);
  }
}
