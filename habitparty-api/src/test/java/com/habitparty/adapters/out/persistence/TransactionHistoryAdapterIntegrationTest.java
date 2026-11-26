package com.habitparty.adapters.out.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.TransactionHistoryRepository.TransactionHistoryFilter;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.task.TaskDifficulty;

@SpringBootTest
@Transactional
class TransactionHistoryAdapterIntegrationTest {

  @Autowired
  private TransactionHistoryRepository txRepository;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @BeforeEach
  void ensureTransactionHistoryTableInH2() {
    jdbcTemplate.execute("""
        CREATE TABLE IF NOT EXISTS transaction_history (
          transaction_history_id UUID PRIMARY KEY,
          user_id UUID NOT NULL,
          transaction_type VARCHAR(50) NOT NULL,
          reference_id UUID,
          name_snapshot VARCHAR(255) NOT NULL,
          gold_amount NUMERIC(38, 2),
          xp_amount INTEGER,
          price_snapshot NUMERIC(38, 2),
          icon_snapshot VARCHAR(255),
          difficulty_snapshot VARCHAR(50),
          package_level_snapshot VARCHAR(50),
          tags_snapshot VARCHAR ARRAY,
          column_name_snapshot VARCHAR(255),
          description_snapshot VARCHAR(500),
          checklist_completed_snapshot BOOLEAN,
          effort_units_snapshot INTEGER,
          hidden_from_history BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL
        )
        """);
  }

  @Test
  @DisplayName("findFiltered, summarizeFiltered, keyset slice e soft-delete/restore funcionam ponta a ponta em SQL/JPA")
  void shouldFilterSummarizeSliceSoftHideAndRestoreTransactions() {
    UUID userId = UUID.randomUUID();
    User user = new User(
        userId, UserRole.USER, false, false, null, null, SubscriptionStatus.FREE, null,
        "History Tester", "hist_" + userId.toString().substring(0, 8),
        "hist_" + userId.toString().substring(0, 8) + "@habitparty.test",
        "hashed", true, LocalDateTime.now(), BigDecimal.ZERO, BigDecimal.ZERO,
        LocalDate.of(1995, 1, 1), null, UserGender.PREFER_NOT_TO_SAY, 0, 0, 0, LocalDateTime.now());
    user.initializeTimezone("America/Sao_Paulo", Clock.systemUTC());
    userRepository.save(user);

    UUID tx1Id = UUID.randomUUID();
    UUID tx2Id = UUID.randomUUID();
    UUID tx3Id = UUID.randomUUID();
    LocalDateTime t1 = LocalDateTime.of(2026, 11, 20, 10, 0);
    LocalDateTime t2 = LocalDateTime.of(2026, 11, 21, 10, 0);
    LocalDateTime t3 = LocalDateTime.of(2026, 11, 22, 10, 0);

    txRepository.save(new TransactionHistory(
        tx1Id, userId, UUID.randomUUID(), new BigDecimal("10.00"), 25, null,
        TransactionType.HABIT_COMPLETED, "100% Foco", null, null, TaskDifficulty.MEDIUM,
        List.of("estudos", "prioridade"), "Rotina Manhã", "Descrição detalhada", t1));
    txRepository.save(new TransactionHistory(
        tx2Id, userId, UUID.randomUUID(), new BigDecimal("-4.50"), 0, new BigDecimal("4.50"),
        TransactionType.REWARD_BOUGHT, "Café Especial", "coffee", null, null,
        List.of("lazer"), null, "Pausa merecida", t2));
    txRepository.save(new TransactionHistory(
        tx3Id, userId, UUID.randomUUID(), new BigDecimal("-2.00"), -10, null,
        TransactionType.BAD_HABIT_PENALTY, "Procrastinar", null, null, null,
        List.of("alerta"), "Hábitos", null, t3));

    // 1. Busca escapando wildcard literal '%' encontra somente "100% Foco"
    var pctPage = txRepository.findFiltered(
        userId, new TransactionHistoryFilter(null, null, null, "100%", null, "NEWEST"), 0, 10);
    assertEquals(1, pctPage.getTotalElements());
    assertEquals(tx1Id, pctPage.getContent().get(0).getId());

    // 2. Busca por columnNameSnapshot, descriptionSnapshot e tagsSnapshot (via SQL CAST)
    var colPage = txRepository.findFiltered(
        userId, new TransactionHistoryFilter(null, null, null, "manhã", null, "NEWEST"), 0, 10);
    assertEquals(1, colPage.getTotalElements());
    var descPage = txRepository.findFiltered(
        userId, new TransactionHistoryFilter(null, null, null, "merecida", null, "NEWEST"), 0, 10);
    assertEquals(1, descPage.getTotalElements());
    var tagPage = txRepository.findFiltered(
        userId, new TransactionHistoryFilter(null, null, null, "estudos", null, "NEWEST"), 0, 10);
    assertEquals(1, tagPage.getTotalElements());
    assertEquals(tx1Id, tagPage.getContent().get(0).getId());

    // 2b. Busca direta sem COUNT(*) redundante respeitando HIGHEST_GOLD / LOWEST_GOLD / OLDEST
    assertTrue(txRepository.supportsDirectPageContent());
    var highestGold = txRepository.findFilteredPageContent(
        userId, new TransactionHistoryFilter(null, null, null, null, null, "HIGHEST_GOLD"), 0, 10);
    assertEquals(List.of(tx1Id, tx3Id, tx2Id), highestGold.stream().map(TransactionHistory::getId).toList());
    var lowestGold = txRepository.findFilteredPageContent(
        userId, new TransactionHistoryFilter(null, null, null, null, null, "LOWEST_GOLD"), 0, 10);
    assertEquals(List.of(tx2Id, tx3Id, tx1Id), lowestGold.stream().map(TransactionHistory::getId).toList());
    var oldestSlice = txRepository.findFilteredSliceAfterCursor(
        userId, new TransactionHistoryFilter(null, null, null, null, null, "OLDEST"), null, null, 2);
    assertEquals(List.of(tx1Id, tx2Id), oldestSlice.stream().map(TransactionHistory::getId).toList());
    var oldestSlice2 = txRepository.findFilteredSliceAfterCursor(
        userId, new TransactionHistoryFilter(null, null, null, null, null, "OLDEST"),
        oldestSlice.get(1).getCreatedAt(), oldestSlice.get(1).getId(), 2);
    assertEquals(List.of(tx3Id), oldestSlice2.stream().map(TransactionHistory::getId).toList());

    // 3. Filtro por direção OUT e summary agregado
    var outSummary = txRepository.summarizeFiltered(
        userId, new TransactionHistoryFilter(null, null, null, null, "OUT", "NEWEST"));
    assertEquals(2L, outSummary.totalCount());
    assertEquals(0, new BigDecimal("6.50").compareTo(outSummary.goldSpent()));
    assertEquals(10, outSummary.xpLost());

    // 4. Keyset pagination retorna na ordem NEWEST sem duplicatas
    var slice1 = txRepository.findFilteredSliceAfterCursor(
        userId, new TransactionHistoryFilter(null, null, null, null, null, "NEWEST"), null, null, 2);
    assertEquals(2, slice1.size());
    assertEquals(tx3Id, slice1.get(0).getId());
    assertEquals(tx2Id, slice1.get(1).getId());
    var slice2 = txRepository.findFilteredSliceAfterCursor(
        userId, new TransactionHistoryFilter(null, null, null, null, null, "NEWEST"),
        slice1.get(1).getCreatedAt(), slice1.get(1).getId(), 2);
    assertEquals(1, slice2.size());
    assertEquals(tx1Id, slice2.get(0).getId());

    // 5. Soft-hide remove do extrato visível, mas preserva para consultas operacionais e permite restore!
    assertEquals(1, txRepository.hideByIdAndUserId(tx1Id, userId));
    var afterHide = txRepository.findFiltered(
        userId, new TransactionHistoryFilter(null, null, null, null, null, "NEWEST"), 0, 10);
    assertEquals(2, afterHide.getTotalElements());
    assertEquals(3, txRepository.findAllByUserIdAndPeriod(userId, t1.minusDays(1), t3.plusDays(1)).size());

    assertEquals(1, txRepository.restoreAllByIdsAndUserId(List.of(tx1Id), userId));
    var afterRestore = txRepository.findFiltered(
        userId, new TransactionHistoryFilter(null, null, null, null, null, "NEWEST"), 0, 10);
    assertEquals(3, afterRestore.getTotalElements());
    assertTrue(txRepository.summarizeFiltered(
        userId, new TransactionHistoryFilter(null, null, null, null, null, "NEWEST")).goldEarned().compareTo(new BigDecimal("10.00")) == 0);
  }
}
