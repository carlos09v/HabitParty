package com.habitparty.application.usecases.user;

import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class DeleteUserUseCase {
    private final UserRepository port;

    public DeleteUserUseCase(UserRepository port) {
        this.port = port;
    }

    public void execute(UUID id) {
        // 1. O Caso de Uso pergunta à Port se o usuário existe
        port.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));

        // 2. Se existir, manda deletar tranquilamente.
        port.deleteById(id);
    }
}
