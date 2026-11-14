package com.habitparty.application.usecases.focus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.achievement.EvaluateUserAchievementsUseCase;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.focus.FocusReward;
import com.habitparty.core.domain.entities.focus.FocusRewardCalculator;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class CreateFocusRecordUseCase {
  private final FocusRecordRepository port;
  private final InventoryItemRepository inventoryItemPort;
  private final FocusActivityRepository focusActivityPort;
  private final TransactionHistoryRepository transactionHistoryPort;
  private final UserRepository userPort;
  private TaskRepository taskPort;
  private EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;

  public CreateFocusRecordUseCase(
      FocusRecordRepository port,
      InventoryItemRepository inventoryItemPort,
      FocusActivityRepository focusActivityPort,
      TransactionHistoryRepository transactionHistoryPort,
      UserRepository userPort) {
    this.port = port;
    this.inventoryItemPort = inventoryItemPort;
    this.focusActivityPort = focusActivityPort;
    this.transactionHistoryPort = transactionHistoryPort;
    this.userPort = userPort;
  }

  @Autowired(required = false)
  public void setTaskPort(TaskRepository taskPort) {
    this.taskPort = taskPort;
  }

  @Autowired(required = false)
  public void setEvaluateUserAchievementsUseCase(EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase) {
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
  }

  @Transactional
  public FocusRecord execute(UUID userIdLogado, CreateFocusRecordCommand command) {
    Task loadedTask = null;
    String taskNameSnapshot = null;

    if (command.taskId() != null && taskPort != null) {
      loadedTask = taskPort.findById(command.taskId())
          .orElseThrow(() -> new ResourceNotFoundException("Tarefa vinculada ao foco não foi encontrada."));
      loadedTask.validateOwnership(userIdLogado);
      if (loadedTask.getTaskType() == TaskType.HABIT) {
        throw new DomainValidationException("Apenas tarefas Diárias e Afazeres podem ser vinculadas a sessões de foco.");
      }
      taskNameSnapshot = loadedTask.getName();
    }

    // 1. Instancia o registro preliminar para validações de domínio (datas, ownership, exclusividade)
    FocusRecord record = new FocusRecord(
        null,
        userIdLogado,
        command.focusActivityId(),
        command.inventoryItemId(),
        command.taskId(),
        taskNameSnapshot,
        command.notes(),
        command.startTime(),
        command.endTime(),
        command.recordType(),
        command.completedPomos());

    FocusActivity loadedActivity = null;
    User loadedUser = null;

    // Se for uma atividade personalizada, valida posse e se a atividade está ativa no plano (máx. 4 ativas no Free)
    if (command.focusActivityId() != null) {
      loadedActivity = focusActivityPort.findById(command.focusActivityId())
          .orElseThrow(() -> new ResourceNotFoundException("Atividade de foco não encontrada."));
      loadedActivity.validateOwnership(userIdLogado);

      loadedUser = userPort.findById(userIdLogado)
          .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

      if (!loadedUser.isPremium()) {
        List<FocusActivity> userActivities = focusActivityPort.findAllByUserIdOrderByOrderIndex(userIdLogado);
        int actIndex = -1;
        for (int i = 0; i < userActivities.size(); i++) {
          if (userActivities.get(i).getId().equals(command.focusActivityId())) {
            actIndex = i;
            break;
          }
        }
        if (actIndex >= 4) {
          throw new LimitExceededException(
              "Esta atividade está pausada no plano Free (máximo de 4 atividades ativas). Assine o plano Premium para utilizá-la!"
          );
        }
      }
    }

    // 2. Se for o uso de uma recompensa (mochila), aplica a lógica de inventário (NUNCA gera XP ou Gold)
    if (record.getInventoryItemId().isPresent()) {
      UUID itemId = record.getInventoryItemId().get();

      InventoryItem item = inventoryItemPort.findById(itemId)
          .orElseThrow(() -> new ResourceNotFoundException("Item de inventário não encontrado."));
      item.validateOwnership(userIdLogado);

      if (loadedUser == null && userPort != null) {
        loadedUser = userPort.findById(userIdLogado).orElse(null);
      }
      ZoneId itemUserZone = loadedUser != null ? loadedUser.resolveZoneId(ZoneId.systemDefault()) : ZoneId.systemDefault();
      LocalDateTime serverStartTime = record.getStartTime()
          .atZone(itemUserZone)
          .withZoneSameInstant(ZoneId.systemDefault())
          .toLocalDateTime();
      LocalDateTime serverEndTime = record.getEndTime()
          .atZone(itemUserZone)
          .withZoneSameInstant(ZoneId.systemDefault())
          .toLocalDateTime();

      long secondsSpent = java.time.Duration.between(
          record.getStartTime().atZone(itemUserZone),
          record.getEndTime().atZone(itemUserZone)).toSeconds();
      int secondsBefore = item.getRemainingSeconds().orElse(0);
      if (secondsSpent > 0) {
        item.deductSeconds((int) secondsSpent);
      }
      int secondsAfter = item.getRemainingSeconds().orElse(0);

      inventoryItemPort.save(item);
      FocusRecord serverInventoryRecord = new FocusRecord(
          record.getId(),
          record.getUserId(),
          null,
          itemId,
          command.taskId(),
          taskNameSnapshot,
          record.getNotes().orElse(null),
          serverStartTime,
          serverEndTime,
          record.getRecordType().orElse(null),
          record.getCompletedPomos().orElse(null),
          0,
          BigDecimal.ZERO);
      FocusRecord savedInventoryRecord = port.save(serverInventoryRecord);

      // Cupom de tempo esgotado nesta sessão (saldo cruzou para <= 1s): conta para a conquista "Alquimista do Tempo"
      boolean isTimeBasedCoupon = item.getRemainingSeconds().isPresent();
      if (isTimeBasedCoupon && secondsBefore > 1 && secondsAfter <= 1) {
        User couponOwner = loadedUser != null
            ? loadedUser
            : userPort.findById(userIdLogado)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        if (couponOwner.getStats() != null) {
          couponOwner.getStats().recordCouponDepleted();
          userPort.save(couponOwner);
          if (evaluateUserAchievementsUseCase != null) {
            evaluateUserAchievementsUseCase.execute(couponOwner);
          }
        }
      }

      return savedInventoryRecord;
    }

    // 3. Atividade produtiva ou foco livre: calcula recompensas matemáticas calibradas
    if (loadedUser == null && userPort != null) {
      loadedUser = userPort.findById(userIdLogado).orElse(null);
    }
    ZoneId userZone = loadedUser != null ? loadedUser.resolveZoneId(ZoneId.systemDefault()) : ZoneId.systemDefault();
    int priorMinutesToday = port.sumFocusMinutesToday(userIdLogado, userZone);
    FocusReward reward = FocusRewardCalculator.calculate(record, priorMinutesToday);

    LocalDateTime userStartTime = record.getStartTime();
    LocalDateTime userEndTime = record.getEndTime();
    LocalDateTime serverStartTime = userStartTime
        .atZone(userZone)
        .withZoneSameInstant(ZoneId.systemDefault())
        .toLocalDateTime();
    LocalDateTime serverEndTime = userEndTime
        .atZone(userZone)
        .withZoneSameInstant(ZoneId.systemDefault())
        .toLocalDateTime();

    // Cria o registro definitivo com os ganhos de XP e moedas persistidos em referência canônica do servidor
    FocusRecord recordWithRewards = new FocusRecord(
        record.getId(),
        record.getUserId(),
        command.focusActivityId(),
        null,
        command.taskId(),
        taskNameSnapshot,
        record.getNotes().orElse(null),
        serverStartTime,
        serverEndTime,
        record.getRecordType().orElse(null),
        record.getCompletedPomos().orElse(null),
        reward.xp(),
        reward.coins());

    FocusRecord savedRecord = port.save(recordWithRewards);

    // 3.1. Se houver Tarefa vinculada, acumula os minutos e ciclos de foco na Task
    if (loadedTask != null && taskPort != null) {
      int durationMins = Math.max(1, savedRecord.getDurationMinutes());
      int pomos = savedRecord.getCompletedPomos().orElse(0);
      loadedTask.addFocusSession(durationMins, pomos);
      taskPort.save(loadedTask);
    }

    // 4. Credita XP e moedas ao perfil do usuário (reutilizando loadedUser se já carregado)
    if (reward.xp() > 0 || reward.coins().compareTo(BigDecimal.ZERO) > 0) {
      User user = loadedUser != null
          ? loadedUser
          : userPort.findById(userIdLogado)
              .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
      if (reward.xp() > 0) {
        user.addXp(reward.xp());
      }
      if (reward.coins().compareTo(BigDecimal.ZERO) > 0) {
        user.addCoins(reward.coins());
      }
      long focusDurationMinutes = Math.max(
          0,
          java.time.Duration.between(userStartTime.atZone(userZone), userEndTime.atZone(userZone)).toMinutes());
      int completedPomos = savedRecord.getCompletedPomos().orElse(0);
      if (user.getStats() != null) {
        user.getStats().recordFocusCompleted((int) focusDurationMinutes, completedPomos);
        user.getStats().recordFocusTimeOfDay(
            userStartTime, userEndTime, (int) focusDurationMinutes);
        if (savedRecord.getFocusActivityId().isPresent()) {
          FocusActivity targetActivity = loadedActivity != null
              ? loadedActivity
              : focusActivityPort.findById(savedRecord.getFocusActivityId().get()).orElse(null);
          int activityTargetMinutes = targetActivity != null
              ? targetActivity.getPomoDurationMinutes().orElse(25)
              : 25;
          if (completedPomos >= 1 || focusDurationMinutes >= activityTargetMinutes) {
            user.getStats().recordActivityGoalMet();
          }
        }
      }
      userPort.save(user);
      if (evaluateUserAchievementsUseCase != null) {
        evaluateUserAchievementsUseCase.execute(user);
      }
    }

    // 5. Registra a transação no extrato financeiro (reutilizando loadedActivity e loadedTask sem query extra)
    String activityName = "Sessão de Foco Livre";
    String activityIcon = "timer";

    if (savedRecord.getFocusActivityId().isPresent()) {
      FocusActivity activity = loadedActivity != null
          ? loadedActivity
          : focusActivityPort.findById(savedRecord.getFocusActivityId().get())
              .orElseThrow(() -> new ResourceNotFoundException("Atividade de foco não encontrada."));
      activity.validateOwnership(userIdLogado);
      activityName = activity.getName();
      if (activity.getIcon() != null && !activity.getIcon().isBlank()) {
        activityIcon = activity.getIcon();
      }
      if (loadedTask != null) {
        String combined = activityName + " • " + loadedTask.getName();
        activityName = combined.length() > 250 ? combined.substring(0, 250) : combined;
      }
    } else if (loadedTask != null) {
      activityName = loadedTask.getName();
    }

    long totalSeconds = java.time.Duration.between(savedRecord.getStartTime(), savedRecord.getEndTime()).toSeconds();
    String durationLabel;
    if (totalSeconds < 60) {
      durationLabel = Math.max(1, totalSeconds) + "s";
    } else {
      long mins = totalSeconds / 60;
      long remainingSecs = totalSeconds % 60;
      if (remainingSecs > 0) {
        durationLabel = mins + "m " + remainingSecs + "s";
      } else {
        durationLabel = mins + " min";
      }
    }

    TransactionHistory transaction = new TransactionHistory(
        null,
        userIdLogado,
        savedRecord.getId(),
        reward.coins(),
        reward.xp(),
        null,
        TransactionType.FOCUS_COMPLETED,
        activityName,
        activityIcon,
        null,
        null,
        java.util.List.of(durationLabel),
        null);

    transactionHistoryPort.save(transaction);

    return savedRecord;
  }
}