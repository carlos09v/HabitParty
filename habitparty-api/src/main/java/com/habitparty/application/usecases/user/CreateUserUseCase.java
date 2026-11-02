package com.habitparty.application.usecases.user;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.habitparty.application.ports.PasswordHasherPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.auth.SendEmailVerificationUseCase;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.auth.DisposableEmailValidator;
import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;

@Service
public class CreateUserUseCase {
  private static final Logger log = LoggerFactory.getLogger(CreateUserUseCase.class);

  private final UserRepository port;
  private final PasswordHasherPort passwordHasher;
  private final SendEmailVerificationUseCase sendEmailVerificationUseCase;

  public CreateUserUseCase(UserRepository port, PasswordHasherPort passwordHasher) {
    this(port, passwordHasher, null);
  }

  @Autowired
  public CreateUserUseCase(
      UserRepository port,
      PasswordHasherPort passwordHasher,
      SendEmailVerificationUseCase sendEmailVerificationUseCase) {
    this.port = port;
    this.passwordHasher = passwordHasher;
    this.sendEmailVerificationUseCase = sendEmailVerificationUseCase;
  }

  public User execute(CreateUserCommand command) {
    if (command.birthDate() == null) {
      throw new DomainValidationException("A data de nascimento é obrigatória.");
    }
    if (command.birthDate().isAfter(LocalDate.now())) {
      throw new DomainValidationException("A data de nascimento deve estar no passado.");
    }
    int age = Period.between(command.birthDate(), LocalDate.now()).getYears();
    if (age < 12) {
      throw new DomainValidationException("Você deve ter no mínimo 12 anos para criar uma conta.");
    }
    if (age > 120) {
      throw new DomainValidationException("Data de nascimento inválida.");
    }

    // Valida e bloqueia domínios de e-mails temporários/descartáveis (Anti-Bot)
    DisposableEmailValidator.validate(command.email());

    // 1. Gera o hash da senha
    String hashedPassword = passwordHasher.encode(command.password());

    // 2. Cria o usuário no cadastro comum com emailVerified = false
    User newUser = new User(
        UUID.randomUUID(),
        UserRole.USER,
        false,
        false,
        null,
        null,
        SubscriptionStatus.FREE,
        null,
        command.fullName(),
        command.username(),
        command.email() != null ? command.email().trim().toLowerCase() : null,
        hashedPassword,
        false, // emailVerified = false até confirmar no link enviado por e-mail
        null,  // emailVerifiedAt
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        command.birthDate(),
        null,
        command.gender(),
        0,
        0,
        0,
        LocalDateTime.now()
    );

    // 3. Salva no banco
    User savedUser = port.save(newUser);

    // 4. Dispara o e-mail de confirmação pós-cadastro
    if (sendEmailVerificationUseCase != null) {
      try {
        sendEmailVerificationUseCase.executeForUser(savedUser);
      } catch (Exception e) {
        log.error("[CreateUserUseCase] Falha ao enviar e-mail de verificação inicial para {}: {}",
            savedUser.getEmail(), e.getMessage());
      }
    }

    return savedUser;
  }
}
