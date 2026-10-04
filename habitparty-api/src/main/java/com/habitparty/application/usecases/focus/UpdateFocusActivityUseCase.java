package com.habitparty.application.usecases.focus;

import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.UpdateFocusActivityDTO;
import com.habitparty.adapters.in.web.dtos.response.FocusActivityResponseDTO;
import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class UpdateFocusActivityUseCase {
  private final FocusActivityRepository port;

    public UpdateFocusActivityUseCase(FocusActivityRepository port) {
        this.port = port;
    }

    public FocusActivityResponseDTO execute(UUID userIdLogado, UUID activityId, UpdateFocusActivityDTO dto) {
        FocusActivity activity = port.findById(activityId)
            .orElseThrow(() -> new ResourceNotFoundException("Atividade de foco não encontrada."));
       activity.validateOwnership(userIdLogado);

        // Delega a responsabilidade de atualização e validação para o Domínio
        activity.updateDetails(dto.name(), dto.icon(), dto.recordType(), dto.pomoTimeMinutes());

        FocusActivity savedActivity = port.save(activity);

        return FocusActivityResponseDTO.fromDomain(savedActivity);
    }
}
