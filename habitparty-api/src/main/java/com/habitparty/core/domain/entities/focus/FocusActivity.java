package com.habitparty.core.domain.entities.focus;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.OwnedByUser;
import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.exceptions.DomainValidationException;

public class FocusActivity implements OwnedByUser {
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

    this.pomoDurationMinutes = resolveValidatedTargetTime(recordType, pomoDurationMinutes);
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

  private Integer resolveValidatedTargetTime(FocusRecordType targetType, Integer timeMinutes) {
    if (targetType == FocusRecordType.POMO) {
      // O Front-end deve mandar o 30 (ou o valor escolhido), o Back-end barra se esquecerem
      if (timeMinutes == null || timeMinutes <= 0) {
        throw new DomainValidationException("Para o tipo Pomodoro (POMO), um tempo alvo maior que zero é obrigatório.");
      }
      return timeMinutes;
    }
    if (targetType == FocusRecordType.STOPWATCH) {
      return null;
    }
    return this.pomoDurationMinutes;
  }

  public void updateDetails(String newName, String newIcon, FocusRecordType newRecordType,
      Integer newPomoTimeMinutes) {
    String nextName = (newName != null && !newName.trim().isEmpty()) ? newName : this.name;
    String nextIcon = (newIcon != null && !newIcon.trim().isEmpty()) ? newIcon : this.icon;
    FocusRecordType nextRecordType = newRecordType != null ? newRecordType : this.recordType;
    Integer timeToValidate = newPomoTimeMinutes != null ? newPomoTimeMinutes : this.pomoDurationMinutes;

    // Valida todas as invariantes antes de mutar qualquer campo (atomicidade em caso de erro)
    validateInputs(nextName, nextIcon);
    Integer nextPomoDurationMinutes = resolveValidatedTargetTime(nextRecordType, timeToValidate);

    this.name = nextName;
    this.icon = nextIcon;
    this.recordType = nextRecordType;
    this.pomoDurationMinutes = nextPomoDurationMinutes;
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
