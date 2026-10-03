package com.habitparty.core.domain.entities.task;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.enums.task.DailyDaysOfWeek;
import com.habitparty.core.domain.enums.task.DailyRepeatMonthlyOption;
import com.habitparty.core.domain.enums.task.DailyRepeatType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.exceptions.DomainValidationException;

public class Daily extends Task {
  private int currentStreak;
  private LocalDate startDate;
  private DailyRepeatType repeatType;
  private int repeatEvery;
  private List<DailyDaysOfWeek> daysOfWeek;
  private DailyRepeatMonthlyOption monthlyOpt;
  private LocalDateTime lastCompletedAt;

  public Daily(
      // --- Campos da Base (Task) ---
      UUID id, UUID boardColumnId, UUID userId, String name,
      String description, int orderIndex, TaskPriority priority,
      List<String> tags, TaskDifficulty difficulty, TaskStatus status,
      TaskType taskType, boolean isHardcoreModeEnabled, LocalDate dueDate,
      LocalDateTime createdAt, List<ChecklistItem> checklist,

      // --- Campos Específicos (Daily) ---
      int currentStreak, LocalDate startDate, DailyRepeatType repeatType,
      int repeatEvery, List<DailyDaysOfWeek> daysOfWeek, DailyRepeatMonthlyOption monthlyOpt,
      LocalDateTime lastCompletedAt) {

    super(id, boardColumnId, userId, name, description, orderIndex, priority,
        tags, difficulty, status, taskType, isHardcoreModeEnabled, dueDate, createdAt, checklist);

    // --- VALIDAÇÕES DE DOMÍNIO ---
    if (startDate == null) {
      throw new DomainValidationException("A data de início (startDate) é obrigatória para tarefas Diárias.");
    }
    if (repeatType == null) {
      throw new DomainValidationException("O tipo de repetição (repeatType) é obrigatório.");
    }
    if (repeatEvery <= 0) {
      throw new DomainValidationException("O intervalo de repetição (repeatEvery) deve ser maior que zero.");
    }

    switch (repeatType) {
      case DAILY -> {
        this.daysOfWeek = null;
        this.monthlyOpt = null;
      }
      case WEEKLY -> {
        if (daysOfWeek == null || daysOfWeek.isEmpty()) {
          throw new DomainValidationException("Para repetições semanais, informe ao menos um dia da semana.");
        }
        this.daysOfWeek = daysOfWeek;
        this.monthlyOpt = null;
      }
      case MONTHLY -> {
        if (monthlyOpt == null) {
          throw new DomainValidationException("Para repetições mensais, a regra do mês (monthlyOpt) é obrigatória.");
        }
        this.monthlyOpt = monthlyOpt;
        this.daysOfWeek = null;
      }
      case YEARLY -> {
        this.daysOfWeek = null;
        this.monthlyOpt = null;
      }
    }

    this.currentStreak = currentStreak;
    this.startDate = startDate;
    this.repeatType = repeatType;
    this.repeatEvery = repeatEvery;
    this.lastCompletedAt = lastCompletedAt;

    this.dueDate = (dueDate != null) ? dueDate : calculateNextOccurrence(this.startDate, true);
  }

  public LocalDate calculateNextOccurrence(LocalDate referenceDate, boolean isFirstTime) {
    // Se for a primeira vez que a tarefa é criada, não aplicamos o multiplicador.
    // Se estivermos concluindo a tarefa, aplicamos o salto (ex: +2 meses, +1 ano).
    int jump = isFirstTime ? 0 : this.repeatEvery;

    switch (this.repeatType) {
      case DAILY:
        return referenceDate.plusDays(jump);

      case WEEKLY:
        LocalDate next = referenceDate.plusWeeks(jump);

        // Varre até 7 dias para encontrar o próximo dia compatível na lista
        for (int i = 0; i < 7; i++) {
          final LocalDate currentDate = next;
          boolean isMatch = this.daysOfWeek != null &&
              this.daysOfWeek.stream()
                  .anyMatch(d -> d.name().equals(currentDate.getDayOfWeek().name()));
          if (isMatch) {
            return next;
          }
          next = next.plusDays(1);
        }
        return referenceDate; // Fallback

      case MONTHLY:
        LocalDate nextMonth = referenceDate.plusMonths(jump);

        if (this.monthlyOpt == DailyRepeatMonthlyOption.DAY_OF_THE_MONTH) {
          // Mantém o exato mesmo dia do mês (ex: todo dia 15).
          return nextMonth;
        } else {
          // DAY_OF_THE_WEEK (Ex: Repete toda "2ª Terça-feira" do mês)
          
          // 1. Descobrimos qual é a semana do mês da data inicial (ex: 2)
          int ordinalWeek = (referenceDate.getDayOfMonth() - 1) / 7 + 1;
          
          // 2. Descobrimos qual é o dia da semana (ex: TUESDAY)
          java.time.DayOfWeek dayOfWeek = referenceDate.getDayOfWeek();
          
          // 3. Aplicamos o ajuste no próximo mês (ex: busca a 2ª Terça do mês seguinte)
          return nextMonth.with(java.time.temporal.TemporalAdjusters.dayOfWeekInMonth(ordinalWeek, dayOfWeek));
        }

      case YEARLY:
        // Ex: Se repeatEvery for 2, pula 2 anos no mesmo dia do startDate
        return referenceDate.plusYears(jump);

      default:
        return referenceDate;
    }
  }

  public void updateDailyDetails(LocalDate newStartDate, DailyRepeatType newRepeatType, int newRepeatEvery,
      List<DailyDaysOfWeek> newDaysOfWeek, DailyRepeatMonthlyOption newMonthlyOpt) {
    // 1. Só atualiza a Data de Início se o Front-end mandar uma nova. Se não mandar, mantém a atual!
    if (newStartDate != null) {
      this.startDate = newStartDate;
    }

    if (newRepeatType != null) {
      this.repeatType = newRepeatType;
    }

    if (newRepeatEvery > 0) {
      this.repeatEvery = newRepeatEvery;
    }

    // 2. Aplica as regras de limpeza baseadas no novo repeatType (igual fizemos no construtor para manter a consistência)
    switch (this.repeatType) {
      case DAILY -> {
        this.daysOfWeek = null;
        this.monthlyOpt = null;
      }
      case WEEKLY -> {
        if (newDaysOfWeek != null && !newDaysOfWeek.isEmpty()) {
          this.daysOfWeek = newDaysOfWeek;
        }
        this.monthlyOpt = null;
      }
      case MONTHLY -> {
        if (newMonthlyOpt != null) {
          this.monthlyOpt = newMonthlyOpt;
        }
        this.daysOfWeek = null;
      }
      case YEARLY -> {
        this.daysOfWeek = null;
        this.monthlyOpt = null;
      }
    }

    // Qual é a data base para calcular o novo vencimento?
    LocalDate today = LocalDate.now();

    // Se a tarefa começou no passado, calculamos do dia de hoje pra frente. 
    // Se ela vai começar no futuro, usamos a data de início dela.
    LocalDate referenceDate = today.isAfter(this.startDate) ? today : this.startDate;
    
    this.dueDate = calculateNextOccurrence(referenceDate, true);
  }

  public void shiftToNextOccurrence(LocalDate referenceDate) {
    this.dueDate = calculateNextOccurrence(referenceDate, false);
  }

  @Override
  public TaskReward calculateReward() {
    // 1. Base pela DIFICULDADE (Exclusivo de Daily/Todo)
    int baseXp = switch (this.getDifficulty()) {
      case TRIVIAL -> 2;
      case EASY -> 5;
      case MEDIUM -> 15;
      case HARD -> 30;
    };
    
    BigDecimal baseCoins = switch (this.getDifficulty()) {
      case TRIVIAL -> new BigDecimal("0.25");
      case EASY -> new BigDecimal("0.75");
      case MEDIUM -> new BigDecimal("2.50");
      case HARD -> new BigDecimal("5.00");
    };

    // 2. Threshold baseado na frequência (Semelhante ao Hábito, mas usa o repeatType)
    int daysToForm = switch (this.repeatType) {
      case DAILY -> 21; // 21 repetições para tornar rotina
      case WEEKLY -> 8; // 8 semanas
      case MONTHLY -> 6; // 6 meses
      case YEARLY -> 3; // 3 anos
    };

    int adaptationThreshold = Math.max(1, daysToForm / 3);

    // 3. Aplica o decaimento baseado no Streak
    double multiplier = 1.0;
    if (this.currentStreak >= daysToForm) {
      multiplier = 0.5; // Rotina cravada: paga 50%
    } else if (this.currentStreak >= adaptationThreshold) {
      multiplier = 0.75; // Adaptação: paga 75%
    }

    int finalXp = Math.max(1, (int) (baseXp * multiplier));
    
    BigDecimal finalCoins = baseCoins
            .multiply(BigDecimal.valueOf(multiplier))
            .setScale(2, java.math.RoundingMode.HALF_DOWN);

    if (finalCoins.compareTo(new BigDecimal("0.01")) < 0) {
        finalCoins = new BigDecimal("0.01");
    }

    return new TaskReward(finalXp, finalCoins);
  }

  @Override
  public void registerCompletion() {
    this.lastCompletedAt = LocalDateTime.now();
    this.currentStreak++;
  }

  public void breakStreak() {
    this.currentStreak = 0;
  }

  // Apenas Getters (Sem Setters!)
  public int getCurrentStreak() {
    return currentStreak;
  }

  public LocalDate getStartDate() {
    return startDate;
  }

  public DailyRepeatType getRepeatType() {
    return repeatType;
  }

  public int getRepeatEvery() {
    return repeatEvery;
  }

  public List<DailyDaysOfWeek> getDaysOfWeek() {
    return daysOfWeek;
  }

  public Optional<DailyRepeatMonthlyOption> getMonthlyOpt() {
    return Optional.ofNullable(monthlyOpt);
  }

  public LocalDateTime getLastCompletedAt() {
    return lastCompletedAt;
  }
}