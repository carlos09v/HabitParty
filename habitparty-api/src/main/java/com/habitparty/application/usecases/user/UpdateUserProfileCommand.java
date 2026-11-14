package com.habitparty.application.usecases.user;

import java.time.LocalDate;
import com.habitparty.core.domain.enums.UserExperienceMode;
import com.habitparty.core.domain.enums.UserGender;

public record UpdateUserProfileCommand(
    String fullName,
    LocalDate birthDate,
    UserGender gender,
    UserExperienceMode experienceMode,
    String timezone,
    String theme
) {
  public UpdateUserProfileCommand(String fullName, LocalDate birthDate, UserGender gender) {
    this(fullName, birthDate, gender, null, null, null);
  }

  public UpdateUserProfileCommand(
      String fullName,
      LocalDate birthDate,
      UserGender gender,
      UserExperienceMode experienceMode) {
    this(fullName, birthDate, gender, experienceMode, null, null);
  }

  public UpdateUserProfileCommand(
      String fullName,
      LocalDate birthDate,
      UserGender gender,
      UserExperienceMode experienceMode,
      String timezone) {
    this(fullName, birthDate, gender, experienceMode, timezone, null);
  }
}
