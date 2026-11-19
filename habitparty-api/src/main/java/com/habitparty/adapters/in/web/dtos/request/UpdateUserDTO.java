package com.habitparty.adapters.in.web.dtos.request;

import java.time.LocalDate;
import java.util.List;

import com.habitparty.core.domain.enums.UserExperienceMode;
import com.habitparty.core.domain.enums.UserGender;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

public record UpdateUserDTO(
  @Size(min = 1, max = 150, message = "O nome deve ter até 150 caracteres")
  String fullName,

  @Past(message = "A data de nascimento deve ser uma data no passado")
  LocalDate birthDate,

  UserGender gender,

  UserExperienceMode experienceMode,

  @Size(max = 64, message = "O fuso horário deve ter no máximo 64 caracteres")
  String timezone,

  @Size(max = 40, message = "O identificador do tema deve ter no máximo 40 caracteres")
  String theme,

  @Size(max = 20, message = "O modo de uso deve ter no máximo 20 caracteres")
  String usageMode,

  @Size(max = 3, message = "Selecione no máximo 3 objetivos principais")
  List<@Size(max = 40, message = "Cada objetivo deve ter até 40 caracteres") String> primaryGoals,

  @Size(max = 30, message = "O obstáculo principal deve ter no máximo 30 caracteres")
  String mainObstacle,

  @Min(value = 15, message = "A meta diária de foco deve ser de pelo menos 15 minutos")
  @Max(value = 720, message = "A meta diária de foco não pode exceder 720 minutos")
  Integer dailyFocusGoalMinutes,

  @Size(max = 20, message = "O período de pico deve ter no máximo 20 caracteres")
  String peakPeriod,

  @Size(max = 20, message = "O estilo de disciplina deve ter no máximo 20 caracteres")
  String disciplineStyle
) {
  public UpdateUserDTO(String fullName, LocalDate birthDate, UserGender gender) {
    this(fullName, birthDate, gender, null, null, null, null, null, null, null, null, null);
  }

  public UpdateUserDTO(
      String fullName,
      LocalDate birthDate,
      UserGender gender,
      UserExperienceMode experienceMode) {
    this(fullName, birthDate, gender, experienceMode, null, null, null, null, null, null, null, null);
  }

  public UpdateUserDTO(
      String fullName,
      LocalDate birthDate,
      UserGender gender,
      UserExperienceMode experienceMode,
      String timezone) {
    this(fullName, birthDate, gender, experienceMode, timezone, null, null, null, null, null, null, null);
  }

  public UpdateUserDTO(
      String fullName,
      LocalDate birthDate,
      UserGender gender,
      UserExperienceMode experienceMode,
      String timezone,
      String theme) {
    this(fullName, birthDate, gender, experienceMode, timezone, theme, null, null, null, null, null, null);
  }
}
