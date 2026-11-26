package com.habitparty.application.usecases.user;

import java.io.InputStream;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionOperations;
import org.springframework.transaction.support.TransactionTemplate;

import com.habitparty.application.ports.StoragePort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class UpdateProfilePhotoUseCase {
  private static final Logger log = LoggerFactory.getLogger(UpdateProfilePhotoUseCase.class);

  private final UserRepository port;
  private final StoragePort storagePort;
  private TransactionOperations transactionOperations;

  @Autowired
  public UpdateProfilePhotoUseCase(UserRepository port, StoragePort storagePort) {
    this.port = port;
    this.storagePort = storagePort;
  }

  @Autowired(required = false)
  public void setTransactionManager(@Nullable PlatformTransactionManager transactionManager) {
    this.transactionOperations = transactionManager != null
        ? new TransactionTemplate(transactionManager)
        : null;
  }

  public User execute(UUID userId, InputStream photoStream, String originalFilename, long size) {
    User user = port.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    Optional<String> oldPhotoUrl = user.getProfilePhotoUrl();

    // 1. Faz o upload da imagem fora da transação de banco para não segurar conexão do pool
    String photoUrl = storagePort.uploadFile(photoStream, originalFilename, size);

    // 2. Atualiza a URL na entidade e persiste em transação curta; compensa removendo o novo arquivo se falhar
    User savedUser;
    try {
      savedUser = executeInTransaction(() -> {
        user.updateProfilePhoto(photoUrl);
        return port.save(user);
      });
    } catch (RuntimeException e) {
      safeDeleteFile(photoUrl, "nova foto órfã após falha ao salvar usuário");
      throw e;
    }

    // 3. Remove a foto antiga somente após o commit no banco (fora da transação)
    oldPhotoUrl
        .filter(oldUrl -> !oldUrl.equals(photoUrl))
        .ifPresent(oldUrl -> safeDeleteFile(oldUrl, "foto de perfil anterior"));

    return savedUser;
  }

  private <T> T executeInTransaction(Supplier<T> action) {
    if (transactionOperations == null) {
      return action.get();
    }
    return transactionOperations.execute(status -> action.get());
  }

  private void safeDeleteFile(String fileUrl, String context) {
    try {
      storagePort.deleteFile(fileUrl);
    } catch (Exception e) {
      log.warn("[UpdateProfilePhotoUseCase] Falha ao remover {} ({}): {}", context, fileUrl, e.getMessage());
    }
  }
}
