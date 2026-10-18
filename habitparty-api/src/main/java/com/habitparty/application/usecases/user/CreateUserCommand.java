package com.habitparty.application.usecases.user;

import java.time.LocalDate;
import com.habitparty.core.domain.enums.UserGender;

public record CreateUserCommand(
    String fullName,
    String username,
    String email,
    String password,
    UserGender gender,
    LocalDate birthday
) {}
