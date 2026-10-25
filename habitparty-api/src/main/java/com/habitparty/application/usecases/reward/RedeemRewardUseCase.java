package com.habitparty.application.usecases.reward;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.reward.MysteryBoxResult;
import com.habitparty.core.domain.entities.reward.MysteryBoxLootTable;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class RedeemRewardUseCase {
  private final RewardRepository port;
  private final UserRepository userPort;
  private final InventoryItemRepository inventoryItemRepositoryPort;
  private final TransactionHistoryRepository transactionHistoryRepositoryPort;

  public RedeemRewardUseCase(RewardRepository port, UserRepository userPort,
      InventoryItemRepository inventoryItemRepositoryPort,
      TransactionHistoryRepository transactionHistoryRepositoryPort) {
    this.port = port;
    this.userPort = userPort;
    this.inventoryItemRepositoryPort = inventoryItemRepositoryPort;
    this.transactionHistoryRepositoryPort = transactionHistoryRepositoryPort;
  }

  @Transactional
  public void execute(UUID rewardId, UUID userIdLogado) {
    // 1. Busca a Recompensa e valida propriedade (evita IDOR)
    Reward reward = port.findById(rewardId)
        .orElseThrow(() -> new ResourceNotFoundException("Recompensa não encontrada."));
    reward.validateOwnership(userIdLogado);

    // 2. Busca o Usuário
    User user = userPort.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    // Limite de itens no inventário (20 Free / 100 Premium)
    int maxItems = user.isPremium() ? 100 : 20;
    int totalItems = inventoryItemRepositoryPort.countByUserId(userIdLogado);
    if (totalItems >= maxItems) {
      throw new LimitExceededException(user.isPremium()
          ? "Sua mochila está lotada com 100 itens! Consuma alguns antes de comprar mais."
          : "Sua mochila atingiu o limite de 20 itens do plano gratuito! Consuma alguns itens ou assine o Premium para expandir para 100 itens.");
    }

    // 3. Regra de Negócio: Desconta o dinheiro usando BigDecimal
    user.spendMoney(reward.getPrice());

    // 4. Calcula o novo índice da mochila
    int maxIndex = inventoryItemRepositoryPort.getMaxOrderIndex(userIdLogado);
    int newIndex = maxIndex + 1;

    // === INÍCIO DA LÓGICA DOS SNAPSHOTS ===
    String finalName = reward.getName();
    String finalIcon = reward.getIcon().orElse(null);
    Integer finalMinutes = reward.getBaseDurationMinutes().orElse(null); // Pega o tempo base da recompensa
    RewardType finalType = reward.getType(); // <- Pega o tipo inicial
    RewardPackageLevel finalPackageLevel = reward.getPackageLevel().orElse(null);

    if (reward.getType() == RewardType.MISTERY_BOX) {
      finalType = RewardType.MISTERY_BOX;
      finalMinutes = null;
      if (finalIcon == null || finalIcon.isBlank()) {
        finalIcon = "mystery_box";
      }
      if (finalPackageLevel == null) {
        finalPackageLevel = RewardPackageLevel.BASIC;
      }
    }

    // 5. Cria o item copiando os Snapshots
    InventoryItem newItem = new InventoryItem(
        UUID.randomUUID(),
        userIdLogado,
        reward.getId(),
        finalName,
        reward.getPrice(),
        finalType,
        InventoryItemStatus.AVAILABLE,
        newIndex,
        finalIcon,
        finalPackageLevel,
        finalMinutes != null ? finalMinutes * 60 : null,
        LocalDateTime.now()); // acquiredAt puro no domínio

    // 6. Salva usando as portas corretas
    userPort.save(user); // update no price

    // -> Inventory_Item -> cria o item na mochila
    inventoryItemRepositoryPort.save(newItem);

    // -> Transaction_History -> Cria o recibo da compra
   TransactionHistory transaction = new TransactionHistory(
        null, // O Domínio gera o UUID
        userIdLogado, 
        reward.getId(), // referenceId = ID da Reward comprada
        reward.getPrice().negate(), // goldAmount = Preço negativado (saiu do bolso)
        0,
        reward.getPrice(),
        TransactionType.REWARD_BOUGHT, 
        reward.getName(), 
        reward.getIcon().orElse(null),
        reward.getPackageLevel().orElse(null),
        null, // difficulty (não se aplica)
        reward.getTags(), // tagsSnapshot
        null // createdAt
    );

    transactionHistoryRepositoryPort.save(transaction);
  }
}
