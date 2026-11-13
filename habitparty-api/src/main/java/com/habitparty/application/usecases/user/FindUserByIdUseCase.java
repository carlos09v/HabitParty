package com.habitparty.application.usecases.user;

import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.user.EffectiveStreakResolver.UserWithEffectiveStreak;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class FindUserByIdUseCase {
    private final UserRepository port;
    private final EffectiveStreakResolver effectiveStreakResolver;

    @Autowired
    public FindUserByIdUseCase(
        UserRepository port,
        EffectiveStreakResolver effectiveStreakResolver) {
      this.port = port;
      this.effectiveStreakResolver = effectiveStreakResolver != null
          ? effectiveStreakResolver
          : new EffectiveStreakResolver(null);
    }

    public FindUserByIdUseCase(UserRepository port) {
      this(port, new EffectiveStreakResolver(null));
    }

    public User execute(UUID id) {
        Optional<User> user = port.findById(id);
        
        // Verifica se existe:
        if (user.isEmpty()) {
            throw new ResourceNotFoundException("Usuário não encontrado!"); 
        }
        
        return user.get();
    }

    public UserWithEffectiveStreak executeWithEffectiveStreak(UUID id) {
        return effectiveStreakResolver.wrap(execute(id));
    }
}
