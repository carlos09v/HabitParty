package com.habitparty.application.usecases.focus;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.response.FocusActivityResponseDTO;
import com.habitparty.application.ports.FocusActivityRepository;

@Service
public class GetFocusActivitiesUseCase {
  private final FocusActivityRepository port;

  public GetFocusActivitiesUseCase(FocusActivityRepository port) {
    this.port = port;
  }

  public List<FocusActivityResponseDTO> execute(UUID userIdLogado) {

    return port.findAllByUserIdOrderByOrderIndex(userIdLogado)
        .stream()
        .map(FocusActivityResponseDTO::fromDomain)
        .toList();
  }
}
