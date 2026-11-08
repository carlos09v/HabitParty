package com.habitparty.application.ports;

import java.util.List;
import java.util.UUID;

import com.habitparty.core.domain.entities.achievement.UserAchievement;

public interface UserAchievementRepository {
  List<UserAchievement> findAllByUserId(UUID userId);
  List<UserAchievement> findUnseenByUserId(UUID userId);
  UserAchievement save(UserAchievement userAchievement);
  List<UserAchievement> saveAll(List<UserAchievement> userAchievements);
  void markAllSeenByUserId(UUID userId);
  void deleteAllByUserId(UUID userId);
}
