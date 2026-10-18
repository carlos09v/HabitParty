package com.habitparty.adapters.in.web.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;

@JsonInclude(JsonInclude.Include.NON_NULL) // <-- Esconde do JSON tudo que for 'null'
public record TransactionHistoryResponseDTO(
    UUID id,
    UUID referenceId,
    TransactionType transactionType,
    String name,
    
    // Os campos que eram Optional no Domínio viram nulos (null) automaticamente no JSON se não existirem
    BigDecimal goldAmount,
    int xpAmount,
    BigDecimal priceSnapshot,
    String icon,
    TaskDifficulty difficulty, // Usando String ou o seu Enum de Dificuldade
    RewardPackageLevel packageLevel,
    List<String> tags,
    LocalDateTime createdAt
) {

  public static TransactionHistoryResponseDTO fromDomain(TransactionHistory tx) {
    return new TransactionHistoryResponseDTO(
        tx.getId(),
        tx.getReferenceId().orElse(null),
        tx.getTransactionType(),
        tx.getNameSnapshot(),
        tx.getGoldAmount().orElse(null),
        tx.getXpAmount(),
        tx.getPriceSnapshot().orElse(null),
        tx.getIconSnapshot().orElse(null),
        tx.getDifficultySnapshot().orElse(null),
        tx.getPackageLevelSnapshot().orElse(null),
        tx.getTagsSnapshot().orElse(null),
        tx.getCreatedAt()
    );
  }
}
