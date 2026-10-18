package com.habitparty.application.usecases.user;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.PasswordHasherPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;

@Service
@Transactional
public class CreateUserUseCase {
  private final UserRepository port;
  private final PasswordHasherPort passwordHasher;

  public CreateUserUseCase(UserRepository port, PasswordHasherPort passwordHasher) {
    this.port = port;
    this.passwordHasher = passwordHasher;
  }

  public User execute(CreateUserCommand command) {
    if (command.birthday() == null) {
      throw new DomainValidationException("A data de nascimento é obrigatória.");
    }
    if (command.birthday().isAfter(LocalDate.now())) {
      throw new DomainValidationException("A data de nascimento deve estar no passado.");
    }
    int age = Period.between(command.birthday(), LocalDate.now()).getYears();
    if (age < 12) {
      throw new DomainValidationException("Você deve ter no mínimo 12 anos para criar uma conta.");
    }
    if (age > 120) {
      throw new DomainValidationException("Data de nascimento inválida.");
    }

    // 1. Gera o hash da senha
    String hashedPassword = passwordHasher.encode(command.password());

    // Aqui ele "fabrica" o usuário a partir do Command. Obs: os dados precisam estar em ordem conforme constructor do dominio
    User newUser = new User(
        UUID.randomUUID(), // O sistema gera o ID e não o DB
        UserRole.USER,
        false, // Todo user nasce Free
        command.fullName(),
        command.username(),
        command.email(),
        hashedPassword,
        BigDecimal.ZERO, // = currentCoins. Regra de Negócio: Todo mundo começa com 0 moedas
        BigDecimal.ZERO, // = totalGoldEarned
        command.birthday(),
        null, // = profilePhotoUrl. Sem foto no cadastro
        command.gender(),
        0, // = totalXp
        0, // = currentStreak
        0, // = highestStreak
        LocalDateTime.now() // Data exata do cadastro
    );

    // 2. Manda o Adapter salvar no banco
    return port.save(newUser);
  }
}
