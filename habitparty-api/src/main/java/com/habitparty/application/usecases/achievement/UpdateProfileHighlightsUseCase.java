package com.habitparty.application.usecases.achievement;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.achievement.ProfileHighlight;
import com.habitparty.core.domain.entities.achievement.UserAchievement;
import com.habitparty.core.domain.enums.HighlightType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class UpdateProfileHighlightsUseCase {
  private static final Set<String> VALID_STAT_METRICS = Set.of(
      "HIGHEST_STREAK",
      "CURRENT_STREAK",
      "TOTAL_TASKS",
      "FOCUS_HOURS",
      "TOTAL_XP",
      "ACHIEVEMENT_POINTS"
  );

  private final UserRepository userPort;
  private final UserAchievementRepository userAchievementPort;
  private final ProfileHighlightRepository profileHighlightPort;
  private final EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;

  public UpdateProfileHighlightsUseCase(
      UserRepository userPort,
      UserAchievementRepository userAchievementPort,
      ProfileHighlightRepository profileHighlightPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase) {
    this.userPort = userPort;
    this.userAchievementPort = userAchievementPort;
    this.profileHighlightPort = profileHighlightPort;
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
  }

  public record HighlightSlotCommand(
      int displayOrder,
      HighlightType highlightType,
      UUID referenceId,
      String highlightKey) {}

  @Transactional
  public List<ProfileHighlight> execute(UUID userId, List<HighlightSlotCommand> commands) {
    User user = userPort.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    if (commands != null && commands.size() > ProfileHighlight.MAX_SHOWCASE_SLOTS) {
      throw new DomainValidationException(
          "A vitrine permite no máximo " + ProfileHighlight.MAX_SHOWCASE_SLOTS + " destaques.");
    }

    Set<UUID> unlockedAchievementIds = userAchievementPort.findAllByUserId(userId).stream()
        .map(UserAchievement::getAchievementId)
        .collect(Collectors.toSet());

    Set<Integer> usedOrders = new HashSet<>();
    Set<String> usedReferences = new HashSet<>();
    List<ProfileHighlight> domainHighlights = new ArrayList<>();

    if (commands != null) {
      for (HighlightSlotCommand cmd : commands) {
        if (!usedOrders.add(cmd.displayOrder())) {
          throw new DomainValidationException("Slot duplicado na vitrine: posição " + cmd.displayOrder());
        }

        if (cmd.highlightType() == HighlightType.ACHIEVEMENT) {
          if (cmd.referenceId() == null || !unlockedAchievementIds.contains(cmd.referenceId())) {
            throw new DomainValidationException("Você só pode destacar na vitrine conquistas já desbloqueadas.");
          }
          String refKey = "ACH:" + cmd.referenceId();
          if (!usedReferences.add(refKey)) {
            throw new DomainValidationException("Não é permitido repetir a mesma conquista em mais de um slot.");
          }
        } else if (cmd.highlightType() == HighlightType.ACCOUNT_BADGE) {
          validateAccountBadgeOwnership(user, cmd.highlightKey());
          String refKey = "BADGE:" + cmd.highlightKey();
          if (!usedReferences.add(refKey)) {
            throw new DomainValidationException("Não é permitido repetir a mesma insígnia em mais de um slot.");
          }
        } else if (cmd.highlightType() == HighlightType.STAT_METRIC) {
          validateStatMetricKey(cmd.highlightKey());
          String refKey = "STAT:" + cmd.highlightKey();
          if (!usedReferences.add(refKey)) {
            throw new DomainValidationException("Não é permitido repetir a mesma métrica em mais de um slot.");
          }
        }

        domainHighlights.add(new ProfileHighlight(
            UUID.randomUUID(),
            userId,
            cmd.displayOrder(),
            cmd.highlightType(),
            cmd.referenceId(),
            cmd.highlightKey(),
            LocalDateTime.now()));
      }
    }

    List<ProfileHighlight> saved = profileHighlightPort.replaceAllForUser(userId, domainHighlights);
    evaluateUserAchievementsUseCase.executeWithSnapshot(user, saved);
    return saved;
  }

  private void validateAccountBadgeOwnership(User user, String key) {
    if (key == null || key.isBlank()) {
      throw new DomainValidationException("Chave da insígnia não informada.");
    }
    switch (key.trim().toUpperCase()) {
      case "FOUNDER" -> {
        if (!user.isFounder()) {
          throw new DomainValidationException("A Insígnia de Membro Fundador é exclusiva para fundadores.");
        }
      }
      case "PREMIUM_GUARDIAN" -> {
        if (!user.isPremium()) {
          throw new DomainValidationException("A Insígnia de Guardião Cósmico requer assinatura ativa.");
        }
      }
      case "VERIFIED_ADVENTURER" -> {
        if (!user.isEmailVerified()) {
          throw new DomainValidationException("Verifique seu e-mail para destacar o selo de conta verificada.");
        }
      }
      case "LEVEL_RANK" -> {
        // Todo usuário possui patente de nível
      }
      default -> throw new DomainValidationException("Insígnia desconhecida: " + key);
    }
  }

  private void validateStatMetricKey(String key) {
    if (key == null || key.isBlank()) {
      throw new DomainValidationException("Chave da métrica não informada.");
    }
    if (!VALID_STAT_METRICS.contains(key.trim().toUpperCase())) {
      throw new DomainValidationException("Métrica de vitrine inválida: " + key);
    }
  }
}
