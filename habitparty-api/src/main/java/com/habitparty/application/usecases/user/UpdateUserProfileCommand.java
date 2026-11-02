package com.habitparty.application.usecases.user;

import java.time.LocalDate;
import com.habitparty.core.domain.enums.UserExperienceMode;
import com.habitparty.core.domain.enums.UserGender;

public record UpdateUserProfileCommand(
    String fullName,
    LocalDate birthDate,
    UserGender gender,
    UserExperienceMode experienceMode
) {
  public UpdateUserProfileCommand(String fullName, LocalDate birthDate, UserGender gender) {
    this(fullName, birthDate, gender, null);
  }
}
