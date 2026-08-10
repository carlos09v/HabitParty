package com.habitparty.adapters.in.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.habitparty.adapters.in.web.dtos.request.CreateUserDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateUserDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateUserPasswordDTO;
import com.habitparty.adapters.in.web.dtos.response.UserResponseDTO;
import com.habitparty.application.usecases.user.CreateUserUseCase;
import com.habitparty.application.usecases.user.DeleteUserUseCase;
import com.habitparty.application.usecases.user.FindAllUsersUseCase;
import com.habitparty.application.usecases.user.FindUserByIdUseCase;
import com.habitparty.application.usecases.user.UpdateProfilePhotoUseCase;
import com.habitparty.application.usecases.user.UpdateUserPasswordUseCase;
import com.habitparty.application.usecases.user.UpdateUserProfileUseCase;
import com.habitparty.core.domain.entities.User;

import jakarta.validation.Valid;

@RestController // 1. Avisa o Spring que essa classe vai responder para a Web (JSON)
@RequestMapping("/users") // 2. Define a rota base. Tudo aqui vai começar com "http://localhost:8080/users"
public class UserController {
  // 3. O Controller injeta apenas os CASOS DE USO.
  // Ele não sabe o que é Adapter, Repository ou Banco de Dados.
  private final CreateUserUseCase createUserUseCase;
  private final FindUserByIdUseCase findUserByIdUseCase;
  private final FindAllUsersUseCase findAllUsersUseCase;
  private final DeleteUserUseCase deleteUserUseCase;
  private final UpdateProfilePhotoUseCase updateProfilePhotoUseCase;
  private final UpdateUserPasswordUseCase updateUserPasswordUseCase;
  private final UpdateUserProfileUseCase updateUserProfileUseCase;
  
  public UserController(CreateUserUseCase createUserUseCase, FindUserByIdUseCase findUserByIdUseCase,
      FindAllUsersUseCase findAllUsersUseCase, DeleteUserUseCase deleteUserUseCase,
      UpdateProfilePhotoUseCase updateProfilePhotoUseCase, UpdateUserPasswordUseCase updateUserPasswordUseCase,
      UpdateUserProfileUseCase updateUserProfileUseCase) {
    this.createUserUseCase = createUserUseCase;
    this.findUserByIdUseCase = findUserByIdUseCase;
    this.findAllUsersUseCase = findAllUsersUseCase;
    this.deleteUserUseCase = deleteUserUseCase;
    this.updateProfilePhotoUseCase = updateProfilePhotoUseCase;
    this.updateUserPasswordUseCase = updateUserPasswordUseCase;
    this.updateUserProfileUseCase = updateUserProfileUseCase;
  }


  @PostMapping
  public ResponseEntity<UserResponseDTO> createUser(@Valid @RequestBody CreateUserDTO requestDto) {
    // O @RequestBody pega o JSON que veio e transforma no DTO.
    User createdUser = createUserUseCase.execute(requestDto);

    // Convertendo o Domínio para Response DTO
    UserResponseDTO response = UserResponseDTO.fromDomain(createdUser);

    // Retorna o usuário criado e o Status 201 (Created)
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/me")
  public ResponseEntity<UserResponseDTO> getUserById(
      @RequestHeader("X-User-Id") UUID userIdLogado) {
    User user = findUserByIdUseCase.execute(userIdLogado);

    UserResponseDTO response = UserResponseDTO.fromDomain(user);

    // Retorna o usuário e o Status 200 (OK)
    return ResponseEntity.ok(response);
  }

  // É necessario implementar o RBCA para proteger rotas como essa...
  @GetMapping
  public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
    List<User> users = findAllUsersUseCase.execute();

    // Transforma a List<User> em List<UserResponseDTO>
    List<UserResponseDTO> responseList = users.stream()
        .map(UserResponseDTO::fromDomain) // Chama o método estático para cada usuário
        .toList(); // Junta tudo numa lista nova

    return ResponseEntity.ok(responseList);
  }

  @DeleteMapping("/me")
  public ResponseEntity<Void> deleteUser(
      @RequestHeader("X-User-Id") UUID userIdLogado) {
    deleteUserUseCase.execute(userIdLogado);

    // Retorna Status 204 (No Content) - Deu certo, mas não tenho nada para te devolver
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/password")
  public ResponseEntity<Void> updatePassword(
      @RequestHeader("X-User-Id") UUID userIdLogado,
      @RequestBody @Valid UpdateUserPasswordDTO dto
  ) {
    updateUserPasswordUseCase.execute(userIdLogado, dto);

    return ResponseEntity.noContent().build();
  }

  @PutMapping
  public ResponseEntity<UserResponseDTO> update(
    @RequestBody @Valid UpdateUserDTO dto,
    @RequestHeader("X-User-Id") UUID userIdLogado
  ) {
    User updatedUser = updateUserProfileUseCase.execute(userIdLogado, dto);

    return ResponseEntity.ok(UserResponseDTO.fromDomain(updatedUser));
  }

  @PatchMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Void> updateProfilePhoto(
      @RequestHeader("X-User-Id") UUID userIdLogado,
      @RequestParam("file") MultipartFile photoFile // O Spring extrai o arquivo direto da requisição!
  ) {
    updateProfilePhotoUseCase.execute(userIdLogado, photoFile);

    return ResponseEntity.noContent().build();
  }
}
