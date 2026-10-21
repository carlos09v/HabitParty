package com.habitparty.application.usecases.user;

import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.StoragePort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class DeleteUserUseCase {
    private final UserRepository port;
    private final StoragePort storagePort;

    public DeleteUserUseCase(UserRepository port, StoragePort storagePort) {
        this.port = port;
        this.storagePort = storagePort;
    }

    public void execute(UUID id) {
        // 1. O Caso de Uso pergunta à Port se o usuário existe
        User user = port.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));

        // 2. Se existir, manda deletar do banco
        port.deleteById(id);

        // 3. Remove a foto de perfil do armazenamento local, se existir
        user.getProfilePhotoUrl().ifPresent(storagePort::deleteFile);
    }
}
