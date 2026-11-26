package com.habitparty.application.usecases.user;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;

@Service
@Transactional(readOnly = true)
public class FindAllUsersUseCase {
  public static final int DEFAULT_PAGE_SIZE = 50;
  public static final int MAX_PAGE_SIZE = 100;

  private final UserRepository port;

  public FindAllUsersUseCase(UserRepository port) {
    this.port = port;
  }

  public List<User> execute() {
    return execute(0, DEFAULT_PAGE_SIZE);
  }

  public List<User> execute(int page, int size) {
    int safePage = Math.max(0, page);
    int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    return port.searchUsers(null, null, null, null, null, PageRequest.of(safePage, safeSize))
        .getContent();
  }
}
