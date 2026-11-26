package com.habitparty.adapters.out.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import com.habitparty.adapters.out.persistence.entities.InventoryItemJpaEntity;
import com.habitparty.adapters.out.persistence.entities.SocialNotificationJpaEntity;
import com.habitparty.adapters.out.persistence.entities.UserAchievementJpaEntity;
import com.habitparty.adapters.out.persistence.entities.UserArtifactJpaEntity;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.UserMapper;
import com.habitparty.adapters.out.persistence.repository.InventoryItemJpaRepository;
import com.habitparty.adapters.out.persistence.repository.SocialNotificationJpaRepository;
import com.habitparty.adapters.out.persistence.repository.UserJpaRepository;
import com.habitparty.application.ports.PaymentEventRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.TransactionHistoryRepository.TransactionHistoryFilter;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.domain.enums.PaymentEventStatus;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.domain.enums.SocialNotificationType;
import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;

import jakarta.persistence.EntityManagerFactory;

@SpringBootTest
class Phase2PersistenceAndJpaIntegrationTest {

  @Autowired
  private EntityManagerFactory entityManagerFactory;

  @Autowired
  private PlatformTransactionManager transactionManager;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private UserJpaRepository userJpaRepository;

  @Autowired
  private UserMapper userMapper;

  @Autowired
  private InventoryItemJpaRepository inventoryItemJpaRepository;

  @Autowired
  private SocialNotificationJpaRepository socialNotificationJpaRepository;

  @Autowired
  private PaymentEventRepository paymentEventRepository;

  @Autowired
  private TransactionHistoryRepository transactionHistoryRepository;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  private TransactionTemplate txTemplate;
  private TransactionTemplate requiresNewTx;

  @BeforeEach
  void setUp() {
    txTemplate = new TransactionTemplate(transactionManager);
    requiresNewTx = new TransactionTemplate(transactionManager);
    requiresNewTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

    jdbcTemplate.execute("""
        CREATE TABLE IF NOT EXISTS transaction_history (
          transaction_history_id UUID PRIMARY KEY,
          user_id UUID NOT NULL,
          transaction_type VARCHAR(50) NOT NULL,
          reference_id UUID,
          name_snapshot VARCHAR(255) NOT NULL,
          gold_amount NUMERIC(10, 2),
          xp_amount INTEGER,
          price_snapshot NUMERIC(10, 2),
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
  @DisplayName("Persistable<UUID> deve inserir lote novo via em.persist() sem SELECT prévio por linha")
  void persistableShouldInsertNewEntitiesWithoutPreSelects() {
    SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
    Statistics stats = sessionFactory.getStatistics();
    boolean previouslyEnabled = stats.isStatisticsEnabled();
    stats.setStatisticsEnabled(true);

    UUID recipientId = UUID.randomUUID();
    List<UUID> insertedIds = new ArrayList<>();
    try {
      txTemplate.executeWithoutResult(status -> {
        stats.clear();

        List<SocialNotificationJpaEntity> batch = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
          UUID id = UUID.randomUUID();
          insertedIds.add(id);
          batch.add(SocialNotificationJpaEntity.builder()
              .id(id)
              .recipientId(recipientId)
              .notificationType(SocialNotificationType.FRIEND_REQUEST_RECEIVED)
              .payload("{\"n\":" + i + "}")
              .seen(false)
              .createdAt(Instant.now())
              .build());
        }

        socialNotificationJpaRepository.saveAll(batch);
        socialNotificationJpaRepository.flush();

        assertEquals(5L, stats.getEntityInsertCount());
        assertEquals(0L, stats.getEntityLoadCount(), "Persistable não deve disparar SELECT/load antes do INSERT");
        // Em lote com batch_size=50, os 5 inserts compartilham 1 único PreparedStatement (nenhum SELECT extra)
        assertTrue(stats.getPrepareStatementCount() <= 5L,
            "Esperava apenas statements de INSERT, mas foram preparados: " + stats.getPrepareStatementCount());
      });
    } finally {
      stats.setStatisticsEnabled(previouslyEnabled);
      txTemplate.executeWithoutResult(status -> socialNotificationJpaRepository.deleteAllByIdInBatch(insertedIds));
    }
  }

  @Test
  @DisplayName("@Version em InventoryItemJpaEntity deve detectar atualização concorrente obsoleta (Optimistic Locking)")
  void optimisticLockingShouldFailOnStaleInventoryItemVersion() {
    User user = createAndSaveUser("optlock");
    UUID itemId = UUID.randomUUID();

    try {
      requiresNewTx.executeWithoutResult(status -> {
        InventoryItemJpaEntity item = InventoryItemJpaEntity.builder()
            .id(itemId)
            .userId(user.getId())
            .rewardId(UUID.randomUUID())
            .nameSnapshot("Caixa Mágica")
            .priceSnapshot(new BigDecimal("15.00"))
            .rewardTypeSnapshot(RewardType.MISTERY_BOX)
            .status(InventoryItemStatus.AVAILABLE)
            .orderIndex(0)
            .acquiredAt(LocalDateTime.now())
            .build();
        inventoryItemJpaRepository.saveAndFlush(item);
      });

      // Carrega snapshot antigo fora da transação (detached, version = 0)
      InventoryItemJpaEntity staleCopy = requiresNewTx.execute(
          status -> inventoryItemJpaRepository.findById(itemId).orElseThrow());
      assertNotNull(staleCopy);
      assertEquals(0L, staleCopy.getVersion());

      // Outra transação concorrente atualiza o item (version 0 -> 1)
      requiresNewTx.executeWithoutResult(status -> {
        InventoryItemJpaEntity concurrent = inventoryItemJpaRepository.findById(itemId).orElseThrow();
        concurrent.setStatus(InventoryItemStatus.CONSUMED);
        inventoryItemJpaRepository.saveAndFlush(concurrent);
      });

      // Tentar salvar a cópia desatualizada (version = 0) deve lançar ObjectOptimisticLockingFailureException
      staleCopy.setStatus(InventoryItemStatus.DISCARDED);
      assertThrows(ObjectOptimisticLockingFailureException.class, () ->
          requiresNewTx.executeWithoutResult(status -> inventoryItemJpaRepository.saveAndFlush(staleCopy)));
    } finally {
      requiresNewTx.executeWithoutResult(status -> {
        inventoryItemJpaRepository.deleteById(itemId);
        userRepository.deleteById(user.getId());
      });
    }
  }

  @Test
  @DisplayName("Entidades Lombok devem ter @ToString seguro (sem senha/email), equals proxy-safe e @IdClass em Java record")
  void lombokEntitiesShouldHaveSafeToStringProxySafeEqualsAndRecordIdClasses() {
    assertTrue(UserAchievementJpaEntity.UserAchievementId.class.isRecord());
    assertTrue(UserArtifactJpaEntity.UserArtifactId.class.isRecord());

    UUID id = UUID.randomUUID();
    UserJpaEntity u1 = UserJpaEntity.builder()
        .id(id)
        .username("safe_user")
        .email("secret@habitparty.com")
        .password("super_secret_hash")
        .build();
    UserJpaEntity u2 = UserJpaEntity.builder()
        .id(id)
        .username("other_snapshot")
        .build();

    assertEquals(u1, u2);
    assertEquals(u1.hashCode(), u2.hashCode());
    String ts = u1.toString();
    assertFalse(ts.contains("super_secret_hash"), "toString() nunca deve vazar password");
    assertFalse(ts.contains("secret@habitparty.com"), "toString() nunca deve vazar email");
    assertTrue(ts.contains("safe_user"));
  }

  @Test
  @DisplayName("claimEvent atômico deve impedir duplicação, permitir reclaim de FAILED e recordEvent não deve dar crash em PROCESSED")
  void paymentEventClaimShouldBeAtomicAndIdempotent() {
    String eventId = "evt_phase2_" + UUID.randomUUID().toString().substring(0, 12);
    UUID userId = UUID.randomUUID();

    assertTrue(paymentEventRepository.claimEvent(eventId, "checkout.session.completed", userId));
    assertFalse(paymentEventRepository.claimEvent(eventId, "checkout.session.completed", userId));

    // Chamar recordEvent novamente sobre evento já PROCESSED não pode estourar DataIntegrityViolationException
    paymentEventRepository.recordEvent(eventId, "checkout.session.completed", userId, PaymentEventStatus.PROCESSED, null);

    // Evento marcado como FAILED pode ser reclamado por uma nova tentativa do webhook
    String failedEventId = "evt_failed_" + UUID.randomUUID().toString().substring(0, 12);
    paymentEventRepository.recordEvent(failedEventId, "invoice.paid", userId, PaymentEventStatus.FAILED, "timeout");
    assertTrue(paymentEventRepository.claimEvent(failedEventId, "invoice.paid", userId));
    assertFalse(paymentEventRepository.claimEvent(failedEventId, "invoice.paid", userId));
  }

  @Test
  @DisplayName("UserMapper deve persistir rawIsPremium e UserJpaRepository deve alinhar isPremium/searchUsers/searchSocialUsers com escape LIKE")
  void userPremiumQueriesAndLikeEscapingShouldMatchDomainRules() {
    User pastDueWithPrepaid = createAndSaveUser("prepaid");
    User pastDueNoPrepaid = createAndSaveUser("pastdue");
    User literalPercentUser = createAndSaveUser("pct%hero");

    try {
      // PAST_DUE mas com saldo pré-pago Pix ativo => domínio e SQL devem considerar PREMIUM
      pastDueWithPrepaid.getSubscription().setSubscriptionStatus(SubscriptionStatus.PAST_DUE);
      pastDueWithPrepaid.getSubscription().setPrepaidEndsAt(LocalDateTime.now().plusDays(15));
      pastDueWithPrepaid.getSubscription().setPremium(false);
      // Valida também que UserMapper preserva rawIsPremium=false sem sobrescrever com isPremium()=true
      UserJpaEntity mapped = userMapper.toEntity(pastDueWithPrepaid);
      assertFalse(mapped.getSubscription().isPremium(), "UserMapper deve persistir rawIsPremium");
      userRepository.save(pastDueWithPrepaid);

      // PAST_DUE sem saldo pré-pago => domínio e SQL devem considerar NÃO PREMIUM mesmo com subscriptionEndsAt futuro
      pastDueNoPrepaid.getSubscription().setSubscriptionStatus(SubscriptionStatus.PAST_DUE);
      pastDueNoPrepaid.getSubscription().setSubscriptionEndsAt(LocalDateTime.now().plusDays(15));
      pastDueNoPrepaid.getSubscription().setPrepaidEndsAt(null);
      pastDueNoPrepaid.getSubscription().setPremium(true);
      userRepository.save(pastDueNoPrepaid);

      assertTrue(pastDueWithPrepaid.getSubscription().isPremium());
      assertFalse(pastDueNoPrepaid.getSubscription().isPremium());

      var premiumPage = userRepository.searchUsers("prepaid", null, true, false, null, PageRequest.of(0, 10));
      assertTrue(premiumPage.getContent().stream().anyMatch(u -> u.getId().equals(pastDueWithPrepaid.getId())));

      var pastDueAsPremium = userRepository.searchUsers("pastdue", null, true, null, null, PageRequest.of(0, 10));
      assertTrue(pastDueAsPremium.getContent().stream().noneMatch(u -> u.getId().equals(pastDueNoPrepaid.getId())));

      // Busca social com "%" deve escapar o wildcard e retornar apenas quem tem "%" literal
      List<User> socialMatches = userRepository.searchSocialUsers("%", pastDueWithPrepaid.getId(), 20);
      assertEquals(1, socialMatches.size());
      assertEquals(literalPercentUser.getId(), socialMatches.getFirst().getId());

      // Busca admin com "%" também deve escapar o wildcard
      var adminMatches = userRepository.searchUsers("%", null, null, null, null, PageRequest.of(0, 20));
      assertEquals(1, adminMatches.getTotalElements());
      assertEquals(literalPercentUser.getId(), adminMatches.getContent().getFirst().getId());
    } finally {
      userRepository.deleteById(pastDueWithPrepaid.getId());
      userRepository.deleteById(pastDueNoPrepaid.getId());
      userRepository.deleteById(literalPercentUser.getId());
    }
  }

  @Test
  @DisplayName("HIGHEST_GOLD deve ordenar NULLS LAST e findAllByIdInForUpdate deve usar batch fetching sem explosão 2N+1")
  void transactionNullsLastAndUserBatchFetchingShouldWork() {
    List<User> createdUsers = new ArrayList<>();
    for (int i = 0; i < 6; i++) {
      createdUsers.add(createAndSaveUser("batch" + i));
    }
    UUID txOwnerId = createdUsers.getFirst().getId();
    UUID txNullGoldId = UUID.randomUUID();
    UUID txHighGoldId = UUID.randomUUID();

    try {
      // Insere 1 transação com gold_amount = NULL diretamente e 1 com gold_amount = 25.00
      jdbcTemplate.update("""
          INSERT INTO transaction_history
            (transaction_history_id, user_id, transaction_type, name_snapshot, gold_amount, xp_amount, hidden_from_history, created_at)
          VALUES (?, ?, ?, ?, NULL, 10, FALSE, ?)
          """, txNullGoldId, txOwnerId, TransactionType.TASK_COMPLETED.name(), "Sem Ouro", LocalDateTime.of(2026, 11, 20, 12, 0));
      jdbcTemplate.update("""
          INSERT INTO transaction_history
            (transaction_history_id, user_id, transaction_type, name_snapshot, gold_amount, xp_amount, hidden_from_history, created_at)
          VALUES (?, ?, ?, ?, 25.00, 10, FALSE, ?)
          """, txHighGoldId, txOwnerId, TransactionType.TASK_COMPLETED.name(), "Com Ouro", LocalDateTime.of(2026, 11, 20, 11, 0));

      var sorted = transactionHistoryRepository.findFiltered(
          txOwnerId,
          new TransactionHistoryFilter(null, null, null, null, null, "HIGHEST_GOLD"),
          0,
          10);
      assertEquals(2, sorted.getContent().size());
      assertEquals(txHighGoldId, sorted.getContent().get(0).getId(), "Transação com valor deve vir antes de NULL");
      assertEquals(txNullGoldId, sorted.getContent().get(1).getId(), "NULL deve ficar por último (NULLS LAST)");

      // Verifica batch fetching em findAllByIdInForUpdate (6 usuários devem gerar bem menos que 1 + 2*6 = 13 queries)
      SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
      Statistics stats = sessionFactory.getStatistics();
      boolean prev = stats.isStatisticsEnabled();
      stats.setStatisticsEnabled(true);
      try {
        txTemplate.executeWithoutResult(status -> {
          stats.clear();
          List<UUID> ids = createdUsers.stream().map(User::getId).toList();
          List<UserJpaEntity> locked = userJpaRepository.findAllByIdInForUpdate(ids);
          assertEquals(6, locked.size());
          // Inicializa stats e subscription de todos os 6 usuários
          for (UserJpaEntity entity : locked) {
            assertNotNull(entity.getStats());
            assertNotNull(entity.getSubscription());
          }
          long prepared = stats.getPrepareStatementCount();
          assertTrue(prepared <= 6,
              "Esperava batch fetching de stats/subscription (<= 6 queries), mas executou: " + prepared);
        });
      } finally {
        stats.setStatisticsEnabled(prev);
      }
    } finally {
      txTemplate.executeWithoutResult(status -> transactionHistoryRepository.deleteAllByUserId(txOwnerId));
      for (User u : createdUsers) {
        userRepository.deleteById(u.getId());
      }
    }
  }

  private User createAndSaveUser(String prefix) {
    String suffix = UUID.randomUUID().toString().substring(0, 8);
    User user = new User(
        UUID.randomUUID(),
        UserRole.USER,
        false,
        false,
        null,
        null,
        SubscriptionStatus.FREE,
        null,
        "Phase2 " + prefix + " " + suffix,
        prefix + "_" + suffix,
        prefix.replace("%", "pct") + "_" + suffix + "@habitparty.test",
        "hashed_password",
        true,
        LocalDateTime.now(),
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1995, 5, 10),
        null,
        UserGender.PREFER_NOT_TO_SAY,
        0,
        0,
        0,
        LocalDateTime.now());
    user.initializeTimezone(User.DEFAULT_TIMEZONE, Clock.systemUTC());
    return userRepository.save(user);
  }
}
