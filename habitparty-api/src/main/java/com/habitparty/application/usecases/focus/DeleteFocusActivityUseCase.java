package com.habitparty.application.usecases.focus;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.exceptions.ResourceNotFoundException;

import jakarta.transaction.Transactional;

@Service
public class DeleteFocusActivityUseCase {
  private final FocusActivityRepository port;
  private final FocusRecordRepository focusRecordPort;

    public DeleteFocusActivityUseCase(FocusActivityRepository port, FocusRecordRepository focusRecordPort) {
        this.port = port;
        this.focusRecordPort = focusRecordPort;
    }

    @Transactional
    public void execute(UUID userIdLogado, UUID activityId, boolean deleteHistory) {
        FocusActivity activity = port.findById(activityId)
            .orElseThrow(() -> new ResourceNotFoundException("Atividade de foco não encontrada."));
        activity.validateOwnership(userIdLogado);

        if (deleteHistory) {
            focusRecordPort.deleteAllByFocusActivityId(activityId);
        } else {
            focusRecordPort.nullifyFocusActivityId(activityId);
        }

        int deletedOrderIndex = activity.getOrderIndex();

        port.deleteById(activityId);

        // Reorganiza a lista, puxando todos os itens abaixo um passo para cima
        port.shiftOrderIndexDown(userIdLogado, deletedOrderIndex);
    }
}
