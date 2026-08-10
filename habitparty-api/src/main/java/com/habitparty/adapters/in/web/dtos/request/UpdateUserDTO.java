package com.habitparty.adapters.in.web.dtos.request;

import java.time.LocalDate;

import com.habitparty.core.domain.enums.UserGender;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

public record UpdateUserDTO(
  @Size(min = 1, max = 30, message = "O nome deve ter até 30 caracteres")
  String fullName,

  @Past(message = "A data de nascimento deve ser uma data no passado")
  LocalDate birthday,

  UserGender gender
) {
  
}
