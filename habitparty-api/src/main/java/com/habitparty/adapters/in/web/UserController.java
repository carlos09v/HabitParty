package com.habitparty.adapters.in.web;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.habitparty.adapters.in.web.api.UserApi;
import com.habitparty.adapters.in.web.dtos.request.CreateUserDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateUserDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateUserPasswordDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateUserThemeDTO;
import com.habitparty.adapters.in.web.dtos.request.user.ResetAccountDTO;
import com.habitparty.adapters.in.web.dtos.request.user.UpdatePrivacySettingsDTO;
import com.habitparty.adapters.in.web.dtos.response.UserLayoutSummaryResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.UserResponseDTO;
import com.habitparty.application.usecases.social.RegenerateFriendCodeUseCase;
import com.habitparty.application.usecases.social.UpdatePrivacySettingsCommand;
import com.habitparty.application.usecases.social.UpdatePrivacySettingsUseCase;
import com.habitparty.application.usecases.user.CreateUserCommand;
import com.habitparty.application.usecases.user.CreateUserUseCase;
import com.habitparty.application.usecases.user.DeleteUserUseCase;
import com.habitparty.application.usecases.user.EffectiveStreakResolver;
import com.habitparty.application.usecases.user.FindAllUsersUseCase;
import com.habitparty.application.usecases.user.FindUserByIdUseCase;
import com.habitparty.application.usecases.user.GetUserLayoutSummaryUseCase;
import com.habitparty.application.usecases.user.ResetUserAccountUseCase;
import com.habitparty.application.usecases.user.UpdateProfilePhotoUseCase;
import com.habitparty.application.usecases.user.UpdateUserPasswordUseCase;
import com.habitparty.application.usecases.user.UpdateUserProfileCommand;
import com.habitparty.application.usecases.user.UpdateUserProfileUseCase;
import com.habitparty.core.domain.entities.User;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class UserController implements UserApi {
  private final CreateUserUseCase createUserUseCase;
  private final FindUserByIdUseCase findUserByIdUseCase;
  private final FindAllUsersUseCase findAllUsersUseCase;
  private final DeleteUserUseCase deleteUserUseCase;
  private final UpdateProfilePhotoUseCase updateProfilePhotoUseCase;
  private final UpdateUserPasswordUseCase updateUserPasswordUseCase;
  private final UpdateUserProfileUseCase updateUserProfileUseCase;
  private final RegenerateFriendCodeUseCase regenerateFriendCodeUseCase;
  private final UpdatePrivacySettingsUseCase updatePrivacySettingsUseCase;
  private final ResetUserAccountUseCase resetUserAccountUseCase;
  private final EffectiveStreakResolver effectiveStreakResolver;
  private final GetUserLayoutSummaryUseCase getUserLayoutSummaryUseCase;

  @Override
  public ResponseEntity<UserResponseDTO> createUser(CreateUserDTO requestDto) {
    var command = new CreateUserCommand(
        requestDto.fullName(),
        requestDto.username(),
        requestDto.email(),
        requestDto.password(),
        requestDto.gender(),
        requestDto.birthDate(),
        requestDto.timezone()
    );
    User createdUser = createUserUseCase.execute(command);
    UserResponseDTO response = UserResponseDTO.fromDomain(createdUser);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @Override
  public ResponseEntity<UserResponseDTO> getUserById(AuthenticatedUser usuarioLogado) {
    var result = findUserByIdUseCase.executeWithEffectiveStreak(usuarioLogado.id());
    return ResponseEntity.ok(UserResponseDTO.fromDomain(result.user(), result.effectiveStreak()));
  }

  @Override
  public ResponseEntity<UserLayoutSummaryResponseDTO> getLayoutSummary(AuthenticatedUser usuarioLogado) {
    return ResponseEntity.ok(getUserLayoutSummaryUseCase.execute(usuarioLogado.id()));
  }

  @Override
  public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
    List<User> users = findAllUsersUseCase.execute();
    List<UserResponseDTO> responseList = users.stream()
        .map(UserResponseDTO::fromDomain)
        .toList();

    return ResponseEntity.ok(responseList);
  }

  @Override
  public ResponseEntity<Void> deleteUser(AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    deleteUserUseCase.execute(userId);
    return ResponseEntity.noContent().build();
  }

  @Override
  public ResponseEntity<UserResponseDTO> resetUserAccount(
      ResetAccountDTO dto,
      AuthenticatedUser usuarioLogado) {
    boolean deleteHistory = Boolean.TRUE.equals(dto.deleteHistory());
    User resetUser = resetUserAccountUseCase.execute(usuarioLogado.id(), dto.scope(), deleteHistory);
    return ResponseEntity.ok(UserResponseDTO.fromDomain(resetUser, 0));
  }

  @Override
  public ResponseEntity<Void> updatePassword(
      AuthenticatedUser usuarioLogado,
      UpdateUserPasswordDTO dto) {
    UUID userId = usuarioLogado.id();
    updateUserPasswordUseCase.execute(userId, dto.currentPassword(), dto.newPassword());
    return ResponseEntity.noContent().build();
  }

  @Override
  public ResponseEntity<UserResponseDTO> update(
      UpdateUserDTO dto,
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    var command = new UpdateUserProfileCommand(
        dto.fullName(),
        dto.birthDate(),
        dto.gender(),
        dto.experienceMode(),
        dto.timezone(),
        dto.theme(),
        dto.usageMode(),
        dto.primaryGoals(),
        dto.mainObstacle(),
        dto.dailyFocusGoalMinutes(),
        dto.peakPeriod(),
        dto.disciplineStyle());
    var updated = updateUserProfileUseCase.executeWithEffectiveStreak(userId, command);
    return ResponseEntity.ok(UserResponseDTO.fromDomain(updated.user(), updated.effectiveStreak()));
  }

  @Override
  public ResponseEntity<UserResponseDTO> updateTheme(
      UpdateUserThemeDTO dto,
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    var updated = updateUserProfileUseCase.updateThemeWithEffectiveStreak(userId, dto.theme());
    return ResponseEntity.ok(UserResponseDTO.fromDomain(updated.user(), updated.effectiveStreak()));
  }

  @Override
  public ResponseEntity<UserResponseDTO> updateProfilePhoto(
      AuthenticatedUser usuarioLogado,
      MultipartFile photoFile) {
    UUID userId = usuarioLogado.id();
    try {
      User updatedUser = updateProfilePhotoUseCase.execute(
          userId, photoFile.getInputStream(), photoFile.getOriginalFilename(), photoFile.getSize());
      var wrapped = effectiveStreakResolver.wrap(updatedUser);
      return ResponseEntity.ok(UserResponseDTO.fromDomain(wrapped.user(), wrapped.effectiveStreak()));
    } catch (IOException e) {
      throw new RuntimeException("Falha ao processar arquivo para upload.", e);
    }
  }

  @Override
  public ResponseEntity<UserResponseDTO> regenerateFriendCode(AuthenticatedUser usuarioLogado) {
    var result = regenerateFriendCodeUseCase.execute(usuarioLogado.id());
    return ResponseEntity.ok(UserResponseDTO.fromDomain(result.user(), result.effectiveStreak()));
  }

  @Override
  public ResponseEntity<UserResponseDTO> updatePrivacySettings(
      UpdatePrivacySettingsDTO dto,
      AuthenticatedUser usuarioLogado) {
    var command = new UpdatePrivacySettingsCommand(
        dto.profileVisibility(),
        dto.statsVisibility(),
        dto.achievementsVisibility(),
        dto.friendRequestPolicy());
    var result = updatePrivacySettingsUseCase.execute(usuarioLogado.id(), command);
    return ResponseEntity.ok(UserResponseDTO.fromDomain(result.user(), result.effectiveStreak()));
  }
}
