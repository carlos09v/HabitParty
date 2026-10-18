package com.habitparty.adapters.in.web;

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
import com.habitparty.adapters.in.web.dtos.response.UserResponseDTO;
import com.habitparty.application.usecases.user.CreateUserCommand;
import com.habitparty.application.usecases.user.CreateUserUseCase;
import com.habitparty.application.usecases.user.DeleteUserUseCase;
import com.habitparty.application.usecases.user.FindAllUsersUseCase;
import com.habitparty.application.usecases.user.FindUserByIdUseCase;
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

  @Override
  public ResponseEntity<UserResponseDTO> createUser(CreateUserDTO requestDto) {
    var command = new CreateUserCommand(
        requestDto.fullName(),
        requestDto.username(),
        requestDto.email(),
        requestDto.password(),
        requestDto.gender(),
        requestDto.birthday()
    );
    User createdUser = createUserUseCase.execute(command);
    UserResponseDTO response = UserResponseDTO.fromDomain(createdUser);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @Override
  public ResponseEntity<UserResponseDTO> getUserById(AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    User user = findUserByIdUseCase.execute(userId);
    return ResponseEntity.ok(UserResponseDTO.fromDomain(user));
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
    var command = new UpdateUserProfileCommand(dto.fullName(), dto.birthday(), dto.gender());
    User updatedUser = updateUserProfileUseCase.execute(userId, command);
    return ResponseEntity.ok(UserResponseDTO.fromDomain(updatedUser));
  }

  @Override
  public ResponseEntity<Void> updateProfilePhoto(
      AuthenticatedUser usuarioLogado,
      MultipartFile photoFile) {
    UUID userId = usuarioLogado.id();
    try {
      updateProfilePhotoUseCase.execute(userId, photoFile.getInputStream(), photoFile.getOriginalFilename(), photoFile.getSize());
    } catch (java.io.IOException e) {
      throw new RuntimeException("Falha ao processar arquivo para upload.", e);
    }
    return ResponseEntity.noContent().build();
  }
}
