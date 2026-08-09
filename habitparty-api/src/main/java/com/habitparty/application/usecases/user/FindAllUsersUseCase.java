package com.habitparty.application.usecases.user;

import java.util.List;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;

@Service
public class FindAllUsersUseCase {
  private final UserRepository port;

    public FindAllUsersUseCase(UserRepository port) {
        this.port = port;
    }

    public List<User> execute() {
        return port.findAll();
    }
}
