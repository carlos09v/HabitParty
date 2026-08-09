package com.habitparty.application.usecases.user;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.UserNotFoundException;

@Service
public class FindUserByIdUseCase {
    private final UserRepository port;

    public FindUserByIdUseCase(UserRepository port) {
        this.port = port;
    }

    public User execute(UUID id) {
        Optional<User> user = port.findById(id);
        
        // Verifica se existe:
        if (user.isEmpty()) {
            throw new UserNotFoundException("Usuário não encontrado!"); 
        }
        
        return user.get();
    }
}
