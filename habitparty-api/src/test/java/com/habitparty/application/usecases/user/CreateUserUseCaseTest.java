package com.habitparty.application.usecases.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.PasswordHasherPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.exceptions.DomainValidationException;

@ExtendWith(MockitoExtension.class)
class CreateUserUseCaseTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private PasswordHasherPort passwordHasher;

  @InjectMocks
  private CreateUserUseCase createUserUseCase;

  @Test
  @DisplayName("Deve criar usuário com sucesso quando idade for maior ou igual a 12 anos")
  void shouldCreateUserSuccessfullyWhenAgeIs12OrOlder() {
    LocalDate validBirthday = LocalDate.now().minusYears(15);
    CreateUserCommand command = new CreateUserCommand(
        "Aventureiro Valido",
        "aventureiro",
        "aventureiro@habitparty.com",
        "SenhaForte@123",
        UserGender.PREFER_NOT_TO_SAY,
        validBirthday
    );

    when(passwordHasher.encode("SenhaForte@123")).thenReturn("hashed_password");
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

    User created = createUserUseCase.execute(command);

    assertNotNull(created);
    assertEquals("aventureiro", created.getUsername());
    assertEquals("hashed_password", created.getPassword());
    verify(userRepository).save(any(User.class));
  }

  @Test
  @DisplayName("Deve permitir cadastro quando usuário completa exatamente 12 anos hoje")
  void shouldAllowUserWhoTurns12Today() {
    LocalDate exactly12YearsAgo = LocalDate.now().minusYears(12);
    CreateUserCommand command = new CreateUserCommand(
        "Aventureiro Doze",
        "doze_anos",
        "doze@habitparty.com",
        "SenhaForte@123",
        UserGender.FEMALE,
        exactly12YearsAgo
    );

    when(passwordHasher.encode("SenhaForte@123")).thenReturn("hashed_password");
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

    User created = createUserUseCase.execute(command);

    assertNotNull(created);
    verify(userRepository).save(any(User.class));
  }

  @Test
  @DisplayName("Deve lançar exceção quando idade for menor que 12 anos")
  void shouldThrowExceptionWhenAgeIsUnder12() {
    LocalDate under12Birthday = LocalDate.now().minusYears(11);
    CreateUserCommand command = new CreateUserCommand(
        "Criança",
        "crianca",
        "crianca@habitparty.com",
        "SenhaForte@123",
        UserGender.MALE,
        under12Birthday
    );

    DomainValidationException exception = assertThrows(
        DomainValidationException.class,
        () -> createUserUseCase.execute(command)
    );

    assertTrue(exception.getMessage().contains("no mínimo 12 anos"));
    verify(userRepository, never()).save(any());
  }

  @Test
  @DisplayName("Deve lançar exceção quando data de nascimento for futura")
  void shouldThrowExceptionWhenBirthdayIsInFuture() {
    LocalDate futureBirthday = LocalDate.now().plusDays(1);
    CreateUserCommand command = new CreateUserCommand(
        "Viajante do Tempo",
        "viajante",
        "viajante@habitparty.com",
        "SenhaForte@123",
        UserGender.PREFER_NOT_TO_SAY,
        futureBirthday
    );

    DomainValidationException exception = assertThrows(
        DomainValidationException.class,
        () -> createUserUseCase.execute(command)
    );

    assertTrue(exception.getMessage().contains("deve estar no passado"));
    verify(userRepository, never()).save(any());
  }

  @Test
  @DisplayName("Deve lançar exceção quando data de nascimento for nula")
  void shouldThrowExceptionWhenBirthdayIsNull() {
    CreateUserCommand command = new CreateUserCommand(
        "Sem Data",
        "sem_data",
        "semdata@habitparty.com",
        "SenhaForte@123",
        UserGender.PREFER_NOT_TO_SAY,
        null
    );

    DomainValidationException exception = assertThrows(
        DomainValidationException.class,
        () -> createUserUseCase.execute(command)
    );

    assertTrue(exception.getMessage().contains("obrigatória"));
    verify(userRepository, never()).save(any());
  }
}
