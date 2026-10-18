package com.habitparty.application.usecases.focus;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.core.domain.entities.focus.FocusActivity;

@Service
public class ReorderFocusActivitiesUseCase {
  private final FocusActivityRepository port;

    public ReorderFocusActivitiesUseCase(FocusActivityRepository port) {
        this.port = port;
    }

    @Transactional
    public void execute(UUID userIdLogado, List<FocusActivityOrderCommand> newOrder) {
        List<FocusActivity> activities = port.findAllByUserIdOrderByOrderIndex(userIdLogado);

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

        // Salva todas em lote
        port.saveAll(atividadesAtualizadas);
    }
}
