package com.habitparty.application.usecases.achievement;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.UserArtifactRepository;

@Service
public class MarkArtifactsSeenUseCase {
  private final UserArtifactRepository userArtifactPort;

  public MarkArtifactsSeenUseCase(UserArtifactRepository userArtifactPort) {
    this.userArtifactPort = userArtifactPort;
  }

  @Transactional
  public void execute(UUID userId) {
    if (userId != null) {
      userArtifactPort.markAllSeenByUserId(userId);
    }
  }
}
