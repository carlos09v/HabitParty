package com.habitparty.core.domain.entities.focus;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.UnauthorizedException;

public class FocusRecord {
  private final UUID id;
  private final UUID userId;
  private final UUID focusActivityId;
  private final UUID inventoryItemId;
  private String notes;
  private final LocalDateTime startTime;
  private final LocalDateTime endTime;
  private final int durationMinutes;

  // NOVOS CAMPOS: Snapshot da execução
  private final FocusRecordType recordType;
  private final Integer completedPomos;

  public FocusRecord(UUID id, UUID userId, UUID focusActivityId, UUID inventoryItemId, String notes,
      LocalDateTime startTime, LocalDateTime endTime, FocusRecordType recordType,
      Integer completedPomos) {
    // 1. Validações Básicas
    if (userId == null) {
      throw new DomainValidationException("O ID do usuário é obrigatório.");
    }
    if (startTime == null || endTime == null) {
      throw new DomainValidationException("Os horários de início e fim são obrigatórios.");
    }
    if (endTime.isBefore(startTime)) {
      throw new DomainValidationException("O horário de fim não pode ser anterior ao horário de início.");
    }

    // 2. Validação de Exclusividade (Ou é Atividade, ou é Recompensa)
    if (focusActivityId == null && inventoryItemId == null) {
      throw new DomainValidationException(
          "O registro deve estar vinculado a uma Atividade ou a um Item de Inventário.");
    }
    if (focusActivityId != null && inventoryItemId != null) {
      throw new DomainValidationException(
          "Um registro não pode estar vinculado simultaneamente a uma Atividade e a um Item de Inventário.");
    }

    if (recordType == FocusRecordType.POMO) {
      if (completedPomos == null || completedPomos < 0) {
        throw new DomainValidationException(
            "A quantidade de pomodoros concluídos é obrigatória e não pode ser negativa.");
      }
      this.completedPomos = completedPomos;
    } else {
      this.completedPomos = null; // Se for Stopwatch (ou uso de inventário), ignora a quantidade de pomos
    }

    this.id = id != null ? id : UUID.randomUUID();
    this.userId = userId;
    this.focusActivityId = focusActivityId;
    this.inventoryItemId = inventoryItemId;
    this.notes = notes;
    this.startTime = startTime;
    this.endTime = endTime;
    this.recordType = recordType;

    this.durationMinutes = (int) Duration.between(startTime, endTime).toMinutes();
  }

  public void validateOwnership(UUID userIdLogado) {
    if (!this.userId.equals(userIdLogado)) {
      throw new UnauthorizedException("Você não tem permissão!");
    }
  }

  // Registros de tempo costumam ser IMUTÁVEIS (como um log financeiro).
  // A única coisa que faz sentido editar depois de salvo é a anotação (notes).
  public void updateNotes(String newNotes) {
    this.notes = newNotes;
  }

  // --- GETTERS ---
  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public Optional<UUID> getFocusActivityId() {
    return Optional.ofNullable(focusActivityId);
  }

  public Optional<UUID> getInventoryItemId() {
    return Optional.ofNullable(inventoryItemId);
  }

  public Optional<String> getNotes() {
    return Optional.ofNullable(notes);
  }

  public LocalDateTime getStartTime() {
    return startTime;
  }

  public LocalDateTime getEndTime() {
    return endTime;
  }

  public int getDurationMinutes() {
    return durationMinutes;
  }

  public Optional<FocusRecordType> getRecordType() { 
        return Optional.ofNullable(recordType); 
    }

  public Optional<Integer> getCompletedPomos() {
    return Optional.ofNullable(completedPomos);
  }
}
