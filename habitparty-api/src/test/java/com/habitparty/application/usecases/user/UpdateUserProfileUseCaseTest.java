package com.habitparty.application.usecases.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.adapters.in.web.dtos.response.UserResponseDTO;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.UserMapper;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
class UpdateUserProfileUseCaseTest {

  @Mock
  private UserRepository userRepository;

  private UpdateUserProfileUseCase useCase;

  @BeforeEach
  void setUp() {
    Clock fixedClock = Clock.fixed(Instant.parse("2026-11-13T18:00:00Z"), ZoneId.of("America/Sao_Paulo"));
    useCase = new UpdateUserProfileUseCase(userRepository, new EffectiveStreakResolver(null), fixedClock);
  }

  private User createUser(UUID id, boolean isPremium) {
    return new User(
        id,
        UserRole.USER,
        isPremium,
        "Aventureiro",
        "aventureiro",
        "aventureiro@habitparty.com",
        "pwd",
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1998, 5, 20),
        null,
        UserGender.PREFER_NOT_TO_SAY,
        0,
        0,
        0,
        LocalDateTime.of(2026, 1, 1, 12, 0)
    );
  }

  @Test
  @DisplayName("Deve atualizar tema VIP via execute (PUT /users) para usuário Premium")
  void shouldUpdateVipThemeViaProfileUpdateForPremiumUser() {
    UUID userId = UUID.randomUUID();
    User user = createUser(userId, true);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    UpdateUserProfileCommand command = new UpdateUserProfileCommand(
        null, null, null, null, null, "forest-ranger");

    User updated = useCase.execute(userId, command);

    assertEquals("forest-ranger", updated.getTheme());
    assertEquals("forest-ranger", UserResponseDTO.fromDomain(updated).theme());
    verify(userRepository).save(user);
  }

  @Test
  @DisplayName("Deve preservar tema atual quando theme é omitido no comando")
  void shouldKeepExistingThemeWhenOmittedInProfileUpdate() {
    UUID userId = UUID.randomUUID();
    User user = createUser(userId, true);
    user.updateTheme("dark-knight");
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    UpdateUserProfileCommand command = new UpdateUserProfileCommand(
        "Novo Nome", null, null, null);

    User updated = useCase.execute(userId, command);

    assertEquals("Novo Nome", updated.getFullName());
    assertEquals("dark-knight", updated.getTheme());
  }

  @Test
  @DisplayName("Deve atualizar tema diretamente via updateThemeWithEffectiveStreak (PATCH /users/theme)")
  void shouldUpdateThemeDirectlyAndReturnEffectiveStreakWrapper() {
    UUID userId = UUID.randomUUID();
    User user = createUser(userId, true);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    var result = useCase.updateThemeWithEffectiveStreak(userId, "cyberpunk-neon");

    assertEquals("cyberpunk-neon", result.user().getTheme());
    assertEquals("cyberpunk-neon", UserResponseDTO.fromDomain(result.user(), result.effectiveStreak()).theme());
  }

  @Test
  @DisplayName("Deve bloquear atualização para tema VIP quando usuário não possui Premium")
  void shouldBlockVipThemeUpdateForFreeUser() {
    UUID userId = UUID.randomUUID();
    User user = createUser(userId, false);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));

    assertThrows(DomainValidationException.class, () -> useCase.updateTheme(userId, "cyberpunk-neon"));
    verify(userRepository, never()).save(any());
  }

  @Test
  @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existir")
  void shouldThrowWhenUserNotFound() {
    UUID userId = UUID.randomUUID();
    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class, () -> useCase.updateTheme(userId, "light"));
  }

  @Test
  @DisplayName("UserMapper deve persistir e restaurar o campo theme entre domínio e JPA")
  void userMapperShouldRoundtripThemeField() {
    UserMapper mapper = new UserMapper();
    User domain = createUser(UUID.randomUUID(), true);
    domain.updateTheme("dark-knight");

    UserJpaEntity entity = mapper.toEntity(domain);
    assertEquals("dark-knight", entity.getTheme());

    User restored = mapper.toDomain(entity);
    assertEquals("dark-knight", restored.getTheme());
    assertEquals("dark-knight", restored.getEffectiveTheme());
  }
}
