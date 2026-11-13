package com.habitparty.adapters.in.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.ShowcaseApi;
import com.habitparty.adapters.in.web.dtos.request.UpdateProfileHighlightsRequestDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateShowcaseProfileRequestDTO;
import com.habitparty.adapters.in.web.dtos.response.UserResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.showcase.AchievementItemResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.showcase.ProfileHighlightResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.showcase.UserShowcaseResponseDTO;
import com.habitparty.application.usecases.achievement.GetUnseenAchievementsUseCase;
import com.habitparty.application.usecases.achievement.GetUserShowcaseUseCase;
import com.habitparty.application.usecases.achievement.GetUserShowcaseUseCase.AchievementProgressItem;
import com.habitparty.application.usecases.achievement.MarkAchievementsSeenUseCase;
import com.habitparty.application.usecases.achievement.UpdateProfileHighlightsUseCase;
import com.habitparty.application.usecases.achievement.UpdateProfileHighlightsUseCase.HighlightSlotCommand;
import com.habitparty.application.usecases.achievement.UpdateShowcaseProfileUseCase;
import com.habitparty.application.usecases.achievement.UpdateShowcaseProfileUseCase.UpdateShowcaseProfileCommand;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.achievement.ProfileHighlight;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class ShowcaseController implements ShowcaseApi {
  private final GetUserShowcaseUseCase getUserShowcaseUseCase;
  private final UpdateProfileHighlightsUseCase updateProfileHighlightsUseCase;
  private final UpdateShowcaseProfileUseCase updateShowcaseProfileUseCase;
  private final GetUnseenAchievementsUseCase getUnseenAchievementsUseCase;
  private final MarkAchievementsSeenUseCase markAchievementsSeenUseCase;

  @Override
  public ResponseEntity<UserShowcaseResponseDTO> getMyShowcase(AuthenticatedUser usuarioLogado) {
    var result = getUserShowcaseUseCase.execute(usuarioLogado.id());
    return ResponseEntity.ok(UserShowcaseResponseDTO.fromDomain(result));
  }

  @Override
  public ResponseEntity<List<ProfileHighlightResponseDTO>> updateMyHighlights(
      AuthenticatedUser usuarioLogado,
      UpdateProfileHighlightsRequestDTO requestDto) {
    List<HighlightSlotCommand> commands = requestDto.highlights() == null
        ? List.of()
        : requestDto.highlights().stream()
            .map(h -> new HighlightSlotCommand(
                h.displayOrder(),
                h.highlightType(),
                h.referenceId(),
                h.highlightKey()))
            .toList();

    List<ProfileHighlight> saved = updateProfileHighlightsUseCase.execute(usuarioLogado.id(), commands);
    return ResponseEntity.ok(saved.stream().map(ProfileHighlightResponseDTO::fromDomain).toList());
  }

  @Override
  public ResponseEntity<UserResponseDTO> updateMyShowcaseProfile(
      AuthenticatedUser usuarioLogado,
      UpdateShowcaseProfileRequestDTO requestDto) {
    var updated = updateShowcaseProfileUseCase.executeWithEffectiveStreak(
        usuarioLogado.id(),
        new UpdateShowcaseProfileCommand(requestDto.bio(), requestDto.avatarFrame()));
    return ResponseEntity.ok(UserResponseDTO.fromDomain(updated.user(), updated.effectiveStreak()));
  }

  @Override
  public ResponseEntity<List<AchievementItemResponseDTO>> getUnseenAchievements(AuthenticatedUser usuarioLogado) {
    var items = getUnseenAchievementsUseCase.execute(usuarioLogado.id());
    List<AchievementItemResponseDTO> dtos = items.stream()
        .map(item -> AchievementItemResponseDTO.fromDomain(
            new AchievementProgressItem(
                item.achievement(),
                true,
                item.unlockedAt(),
                false,
                item.achievement().getTargetValue(),
                100)))
        .toList();
    return ResponseEntity.ok(dtos);
  }

  @Override
  public ResponseEntity<Void> markAchievementsSeen(AuthenticatedUser usuarioLogado) {
    markAchievementsSeenUseCase.execute(usuarioLogado.id());
    return ResponseEntity.noContent().build();
  }
}
