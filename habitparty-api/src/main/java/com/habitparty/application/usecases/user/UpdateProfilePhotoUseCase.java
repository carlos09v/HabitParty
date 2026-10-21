package com.habitparty.application.usecases.user;

import java.io.InputStream;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.StoragePort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class UpdateProfilePhotoUseCase {
  private final UserRepository port;
  private final StoragePort storagePort;

  public UpdateProfilePhotoUseCase(UserRepository port, StoragePort storagePort) {
    this.port = port;
    this.storagePort = storagePort;
  }

  public void execute(UUID userId, InputStream photoStream, String originalFilename, long size) {
    User user = port.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    Optional<String> oldPhotoUrl = user.getProfilePhotoUrl();

    // 1. Faz o upload da imagem e recebe o link público
    String photoUrl = storagePort.uploadFile(photoStream, originalFilename, size);

    // 2. Atualiza a URL na entidade e salva no banco
    user.updateProfilePhoto(photoUrl);
    port.save(user);

    // 3. Remove a foto antiga do armazenamento local, se existir
    oldPhotoUrl.ifPresent(storagePort::deleteFile);
  }
}
