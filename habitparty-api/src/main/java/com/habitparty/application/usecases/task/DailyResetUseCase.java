package com.habitparty.application.usecases.task;

import java.time.LocalDate;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class DailyResetUseCase {
  private final TaskRepository port;
  private final UserRepository userPort;
  private final TransactionHistoryRepository transactionPort;

  public DailyResetUseCase(TaskRepository port, TransactionHistoryRepository transactionPort, UserRepository userPort) {
    this.port = port;
    this.transactionPort = transactionPort;
    this.userPort = userPort;
  }

  // Roda todo dia exatamente à meia-noite (00:00:00)
  @Scheduled(cron = "0 0 0 * * *")
  @Transactional
  public void executeDailyRollover() {
    LocalDate today = LocalDate.now();
    LocalDate yesterday = today.minusDays(1);

    List<Task> recurringTasks = port.findAllRecurringTasks();
    for (Task task : recurringTasks) {
      // Cenário 1: Usuário concluiu a tarefa (O targetDate dela já foi atualizado no UseCase de conclusão)
      if (task.getStatus() == TaskStatus.COMPLETED) {
        task.changeStatus(TaskStatus.PENDING); // Deixa pronta para o próximo ciclo
      }
      // Cenário 2: Tarefa pendente. Falhou ou apenas ainda não chegou o dia?
      else if (task.getStatus() == TaskStatus.PENDING) {
        boolean hasFailed = false;
        // Quebra o Streak! (Cast seguro porque sabemos que recurringTasks só traz Habit/Daily)
        if (task instanceof Habit h) {
          // Hábitos são avaliados diariamente (não usam dueDate). Se não fez ontem, falhou.
          h.breakStreak();
          hasFailed = true;
        } else if (task instanceof Daily d) {
          // Dailies só falham se o vencimento era até ontem.
          if (d.getDueDate().isPresent() && !d.getDueDate().get().isAfter(yesterday)) {
            d.breakStreak();
            hasFailed = true;

            // CRÍTICO: Calcula a próxima data baseada em HOJE, para empurrar a tarefa pra frente e evitar que ela seja cobrada de novo na próxima madrugada.
            d.shiftToNextOccurrence(today);
          }
          // A Regra do Hardcore (Punição)
          if (hasFailed && task.isHardcoreModeEnabled()) {
            Task.TaskReward penalty = task.calculatePenalty();

            User user = userPort.findById(task.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado para penalidade."));
            // Aplica a punição no perfil do usuário (garante que não cai de nível)
            user.applyPenalty(penalty.coins(), penalty.xp());
            userPort.save(user);

            TransactionHistory negativeTransaction = new TransactionHistory(
                null,
                task.getUserId(),
                task.getId(), // referenceId = ID da Task que falhou
                penalty.coins().negate(), // goldAmount = Penalidade de ouro
                -penalty.xp(), // xpAmount = 0 (ou coloque um valor negativo se perder XP também)
                null, // priceSnapshot (Não se aplica a task)
                TransactionType.TASK_FAILED,
                "Falhou: " + task.getName(), // Nome limpo pro extrato
                null, // iconSnapshot
                null, // packageLevel
                task.getDifficulty(), // difficulty
                task.getTags(), // tags
                null);

            transactionPort.save(negativeTransaction);
          }
        }
      }

      // 5. Salva todas as tarefas com os streaks zerados e status PENDING (prontas pro novo dia)
      port.saveAll(recurringTasks);
    }
  }
}