package com.habitparty.application.usecases.user;

import java.time.LocalDate;
import com.habitparty.core.domain.enums.UserGender;

public record UpdateUserProfileCommand(
    String fullName,
    LocalDate birthday,
    UserGender gender
) {}
