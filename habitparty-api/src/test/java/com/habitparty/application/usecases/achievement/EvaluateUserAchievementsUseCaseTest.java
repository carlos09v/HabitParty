package com.habitparty.application.usecases.achievement;

import com.habitparty.application.ports.AchievementRepository;
import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.achievement.Achievement;
import com.habitparty.core.domain.entities.achievement.ProfileHighlight;
import com.habitparty.core.domain.entities.achievement.UserAchievement;
import com.habitparty.core.domain.enums.*;
import com.habitparty.core.exceptions.DomainValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EvaluateUserAchievementsUseCaseTest {

    @Mock
    private AchievementRepository achievementRepository;

    @Mock
    private UserAchievementRepository userAchievementRepository;

    @Mock
    private ProfileHighlightRepository profileHighlightRepository;

    @Mock
    private UserRepository userRepository;

    private EvaluateUserAchievementsUseCase evaluateUseCase;

    @BeforeEach
    void setUp() {
        evaluateUseCase = new EvaluateUserAchievementsUseCase(
                achievementRepository,
                userAchievementRepository,
                profileHighlightRepository,
                userRepository
        );
    }

    private User buildSampleUser() {
        return new User(
                UUID.randomUUID(),
                UserRole.USER,
                false,
                "Carlos Vinicius",
                "carlosv",
                "carlos@habitparty.com",
                "hashed_pw",
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                LocalDate.of(1998, 5, 10),
                null,
                UserGender.MALE,
                0,
                0,
                0,
                LocalDateTime.now()
        );
    }

    @Test
    @DisplayName("Should unlock achievements whose target threshold is met and update achievementPoints")
    void shouldUnlockEligibleAchievementsAndSkipExisting() {
        User user = buildSampleUser();
        user.getStats().recordTaskCompleted(false, false); // totalTasksCompleted = 1

        Achievement firstTaskAch = new Achievement(
                UUID.randomUUID(),
                "TASK_FIRST",
                "Primeira Missão",
                "Conclua sua primeira tarefa na plataforma.",
                "CheckCircle2",
                10,
                AchievementCategory.TASKS,
                AchievementRarity.COMMON,
                1,
                1,
                false
        );
        Achievement tenTasksAch = new Achievement(
                UUID.randomUUID(),
                "TASK_10",
                "Ritmo de Caçada",
                "Conclua 10 tarefas acumuladas.",
                "ListChecks",
                10,
                AchievementCategory.TASKS,
                AchievementRarity.COMMON,
                10,
                2,
                false
        );
        Achievement showcaseCuratorAch = new Achievement(
                UUID.randomUUID(),
                "SHOWCASE_CURATOR",
                "Identidade Forjada",
                "Personalize sua Vitrine de Destaques ou ostente a Insígnia de Fundador.",
                "Shield",
                50,
                AchievementCategory.SPECIAL,
                AchievementRarity.RARE,
                1,
                30,
                false
        );

        when(achievementRepository.findAllOrdered())
                .thenReturn(List.of(firstTaskAch, tenTasksAch, showcaseCuratorAch));
        when(userAchievementRepository.findAllByUserId(user.getId()))
                .thenReturn(List.of());
        when(profileHighlightRepository.countByUserId(user.getId()))
                .thenReturn(1L);

        List<Achievement> newlyUnlocked = evaluateUseCase.execute(user);

        assertEquals(2, newlyUnlocked.size());
        assertTrue(newlyUnlocked.stream().anyMatch(a -> a.getCode().equals("TASK_FIRST")));
        assertTrue(newlyUnlocked.stream().anyMatch(a -> a.getCode().equals("SHOWCASE_CURATOR")));
        assertEquals(60, user.getStats().getAchievementPoints());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<UserAchievement>> captor = ArgumentCaptor.forClass(List.class);
        verify(userAchievementRepository, times(1)).saveAll(captor.capture());
        assertEquals(2, captor.getValue().size());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    @DisplayName("ProfileHighlight should enforce displayOrder between 0 and 3")
    void profileHighlightShouldEnforceSlotBounds() {
        UUID userId = UUID.randomUUID();
        UUID achId = UUID.randomUUID();
        ProfileHighlight valid = new ProfileHighlight(
                UUID.randomUUID(),
                userId,
                3,
                HighlightType.ACHIEVEMENT,
                achId,
                "TASK_FIRST",
                LocalDateTime.now()
        );
        assertEquals(3, valid.getDisplayOrder());

        assertThrows(DomainValidationException.class, () -> new ProfileHighlight(
                UUID.randomUUID(),
                userId,
                4,
                HighlightType.ACHIEVEMENT,
                achId,
                "TASK_FIRST",
                LocalDateTime.now()
        ));
    }
}
