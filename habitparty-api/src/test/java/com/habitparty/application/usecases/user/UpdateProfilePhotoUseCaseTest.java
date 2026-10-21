package com.habitparty.application.usecases.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.StoragePort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;

@ExtendWith(MockitoExtension.class)
class UpdateProfilePhotoUseCaseTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private StoragePort storagePort;

  @InjectMocks
  private UpdateProfilePhotoUseCase updateProfilePhotoUseCase;

  private User createUserWithPhoto(UUID id, String photoUrl) {
    return new User(
        id,
        UserRole.USER,
        false,
        "Aventureiro",
        "aventureiro",
        "aventureiro@habitparty.com",
        "hashed_pass",
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(2000, 1, 1),
        photoUrl,
        UserGender.PREFER_NOT_TO_SAY,
        0,
        0,
        0,
        LocalDateTime.now()
    );
  }

  @Test
  @DisplayName("Deve fazer upload da nova foto, atualizar o usuário e apagar a foto antiga")
  void shouldUploadNewPhotoAndDeleteOldPhoto() {
    UUID userId = UUID.randomUUID();
    User user = createUserWithPhoto(userId, "/uploads/old-photo.png");
    InputStream stream = new ByteArrayInputStream(new byte[]{1, 2, 3});

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(storagePort.uploadFile(stream, "new-photo.jpg", 3L)).thenReturn("/uploads/new-photo.jpg");

    updateProfilePhotoUseCase.execute(userId, stream, "new-photo.jpg", 3L);

    assertEquals(Optional.of("/uploads/new-photo.jpg"), user.getProfilePhotoUrl());
    verify(userRepository).save(user);
    verify(storagePort).deleteFile("/uploads/old-photo.png");
  }

  @Test
  @DisplayName("Não deve chamar deleteFile quando o usuário não possuía foto anterior")
  void shouldNotCallDeleteFileWhenUserHadNoPreviousPhoto() {
    UUID userId = UUID.randomUUID();
    User user = createUserWithPhoto(userId, null);
    InputStream stream = new ByteArrayInputStream(new byte[]{1, 2, 3});

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(storagePort.uploadFile(stream, "first-photo.png", 3L)).thenReturn("/uploads/first-photo.png");

    updateProfilePhotoUseCase.execute(userId, stream, "first-photo.png", 3L);

    assertEquals(Optional.of("/uploads/first-photo.png"), user.getProfilePhotoUrl());
    verify(userRepository).save(user);
    verify(storagePort, never()).deleteFile(any());
  }

  @Test
  @DisplayName("Não deve apagar a foto antiga se o upload da nova foto falhar")
  void shouldNotDeleteOldPhotoWhenNewUploadFails() {
    UUID userId = UUID.randomUUID();
    User user = createUserWithPhoto(userId, "/uploads/old-photo.png");
    InputStream stream = new ByteArrayInputStream(new byte[]{});

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(storagePort.uploadFile(stream, "invalid.exe", 0L))
        .thenThrow(new DomainValidationException("Formato inválido"));

    assertThrows(
        DomainValidationException.class,
        () -> updateProfilePhotoUseCase.execute(userId, stream, "invalid.exe", 0L)
    );

    assertEquals(Optional.of("/uploads/old-photo.png"), user.getProfilePhotoUrl());
    verify(userRepository, never()).save(any());
    verify(storagePort, never()).deleteFile(any());
  }
}
