package com.habitparty.application.usecases.focus;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.exceptions.LimitExceededException;

@Service
public class ReorderFocusActivitiesUseCase {
  private final FocusActivityRepository port;
  private final UserRepository userPort;

  public ReorderFocusActivitiesUseCase(FocusActivityRepository port) {
    this(port, null);
  }

  @Autowired
  public ReorderFocusActivitiesUseCase(FocusActivityRepository port, UserRepository userPort) {
    this.port = port;
    this.userPort = userPort;
  }

  @Transactional
  public void execute(UUID userIdLogado, List<FocusActivityOrderCommand> newOrder) {
    List<FocusActivity> activities = port.findAllByUserIdOrderByOrderIndex(userIdLogado);

    Map<UUID, Integer> originalPositionById = new HashMap<>();
    Set<UUID> pausedActivityIds = new HashSet<>();
    for (int i = 0; i < activities.size(); i++) {
      UUID id = activities.get(i).getId();
      originalPositionById.put(id, i);
      if (i >= FocusRecordSupport.FREE_ACTIVE_ACTIVITY_LIMIT) {
        pausedActivityIds.add(id);
      }
    }

    // Transforma em um Map para facilitar a busca rápida pelo ID
    Map<UUID, FocusActivity> mapaAtividades = activities.stream()
        .collect(Collectors.toMap(FocusActivity::getId, a -> a));

    List<FocusActivity> atividadesAtualizadas = new ArrayList<>();

    // Percorre a lista de comandos e atualiza os índices no Domínio
    for (FocusActivityOrderCommand cmd : newOrder) {
      FocusActivity activity = mapaAtividades.get(cmd.id());

      if (activity != null) { // Validação de segurança embutida
        activity.updateOrderIndex(cmd.orderIndex());
        atividadesAtualizadas.add(activity);
      }
    }

    // Impede bypass do plano Free: atividades pausadas (índice >= 4) não podem ser promovidas aos 4 slots ativos
    if (!pausedActivityIds.isEmpty() && userPort != null) {
      boolean isPremium = userPort.findById(userIdLogado).map(User::isPremium).orElse(false);
      if (!isPremium) {
        List<FocusActivity> sortedAfter = new ArrayList<>(activities);
        sortedAfter.sort(Comparator
            .comparingInt(FocusActivity::getOrderIndex)
            .thenComparingInt(a -> originalPositionById.getOrDefault(a.getId(), Integer.MAX_VALUE)));

        int activeSlots = Math.min(FocusRecordSupport.FREE_ACTIVE_ACTIVITY_LIMIT, sortedAfter.size());
        for (int i = 0; i < activeSlots; i++) {
          if (pausedActivityIds.contains(sortedAfter.get(i).getId())) {
            throw new LimitExceededException(
                "Atividades pausadas no plano Free (além das 4 ativas) não podem ser promovidas. Assine o plano Premium para desbloqueá-las!");
          }
        }
      }
    }

    // Salva todas em lote
    port.saveAll(atividadesAtualizadas);
  }
}
