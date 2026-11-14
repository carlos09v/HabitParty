package com.habitparty.adapters.in.web.dtos.request;

import java.time.LocalDate;

import com.habitparty.core.domain.enums.UserExperienceMode;
import com.habitparty.core.domain.enums.UserGender;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

public record UpdateUserDTO(
  @Size(min = 1, max = 30, message = "O nome deve ter até 30 caracteres")
  String fullName,

  @Past(message = "A data de nascimento deve ser uma data no passado")
  LocalDate birthDate,

  UserGender gender,

  UserExperienceMode experienceMode,

  @Size(max = 64, message = "O fuso horário deve ter no máximo 64 caracteres")
  String timezone,

  @Size(max = 40, message = "O identificador do tema deve ter no máximo 40 caracteres")
  String theme
) {
  public UpdateUserDTO(String fullName, LocalDate birthDate, UserGender gender) {
    this(fullName, birthDate, gender, null, null, null);
  }

  public UpdateUserDTO(
      String fullName,
      LocalDate birthDate,
      UserGender gender,
      UserExperienceMode experienceMode) {
    this(fullName, birthDate, gender, experienceMode, null, null);
  }

  public UpdateUserDTO(
      String fullName,
      LocalDate birthDate,
      UserGender gender,
      UserExperienceMode experienceMode,
      String timezone) {
    this(fullName, birthDate, gender, experienceMode, timezone, null);
  }
}
