package com.habitparty.core.domain.entities.focus;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.UnauthorizedException;

public class FocusActivity {
  private final UUID id;
  private final UUID userId;
  private String name;
  private String icon;
  private int orderIndex;
  private FocusRecordType recordType;
  private Integer pomoDurationMinutes;
  private final LocalDateTime createdAt;

  public FocusActivity(UUID id, UUID userId, String name, String icon, int orderIndex,
      FocusRecordType recordType, Integer pomoDurationMinutes, LocalDateTime createdAt) {
    validateInputs(name, icon);

    if (recordType == null) {
      throw new DomainValidationException("O tipo de registro (POMO ou STOPWATCH) é obrigatório na criação.");
    }

    this.id = id != null ? id : UUID.randomUUID();
    this.userId = userId;
    this.name = name;
    this.icon = icon;
    this.orderIndex = orderIndex;
    this.recordType = recordType;
    this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();

    validateAndAssignTargetTime(pomoDurationMinutes);
  }

  public void validateOwnership(UUID userIdLogado) {
    if (!this.userId.equals(userIdLogado)) {
      throw new UnauthorizedException("Você não tem permissão!");
    }
  }

  private void validateInputs(String name, String icon) {
    if (name == null || name.trim().isEmpty()) {
      throw new DomainValidationException("O nome da atividade não pode ser vazio.");
    }
    if (name.length() > 50) {
      throw new DomainValidationException("O nome da atividade não pode exceder 50 caracteres.");
    }
    if (icon == null || icon.trim().isEmpty()) {
      throw new DomainValidationException("O ícone da atividade é obrigatório.");
    }
  }

  private void validateAndAssignTargetTime(Integer timeMinutes) {
    if (this.recordType == FocusRecordType.POMO) {
      // O Front-end deve mandar o 30 (ou o valor escolhido), o Back-end barra se esquecerem
      if (timeMinutes == null || timeMinutes <= 0) {
        throw new DomainValidationException("Para o tipo Pomodoro (POMO), um tempo alvo maior que zero é obrigatório.");
      }
      this.pomoDurationMinutes = timeMinutes;
    } else if (this.recordType == FocusRecordType.STOPWATCH) {
      this.pomoDurationMinutes = null;
    }
  }

  public void updateDetails(String newName, String newIcon, FocusRecordType newRecordType,
      Integer newPomoTimeMinutes) {
    if (newName != null && !newName.trim().isEmpty()) {
      this.name = newName;
    }
    if (newIcon != null && !newIcon.trim().isEmpty()) {
      this.icon = newIcon;
    }
    if (newRecordType != null) {
      this.recordType = newRecordType;
    }

    // Usamos o novo valor de tempo se vier no update, senão mantemos o atual para revalidar
    Integer timeToValidate = newPomoTimeMinutes != null ? newPomoTimeMinutes : this.pomoDurationMinutes;
    validateAndAssignTargetTime(timeToValidate);

    validateInputs(this.name, this.icon);
  }

  public void updateOrderIndex(int newOrderIndex) {
      if (newOrderIndex < 0) {
          throw new DomainValidationException("O índice de ordem não pode ser negativo.");
      }
      this.orderIndex = newOrderIndex;
  }

  // --- Getters  ---
  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public String getName() {
    return name;
  }

  public String getIcon() {
    return icon;
  }

  public int getOrderIndex() {
    return orderIndex;
  }

  public FocusRecordType getRecordType() {
    return recordType;
  }

  public Optional<Integer> getPomoDurationMinutes() {
    return Optional.ofNullable(pomoDurationMinutes);
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }
}
