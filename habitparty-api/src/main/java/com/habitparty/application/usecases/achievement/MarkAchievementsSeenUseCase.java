package com.habitparty.application.usecases.achievement;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.UserAchievementRepository;

@Service
public class MarkAchievementsSeenUseCase {
  private final UserAchievementRepository userAchievementPort;

  public MarkAchievementsSeenUseCase(UserAchievementRepository userAchievementPort) {
    this.userAchievementPort = userAchievementPort;
  }

  @Transactional
  public void execute(UUID userId) {
    userAchievementPort.markAllSeenByUserId(userId);
  }
}
