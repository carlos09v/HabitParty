package com.habitparty.application.usecases.focus;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.core.domain.entities.focus.FocusActivity;

@Service
public class GetFocusActivitiesUseCase {
  private final FocusActivityRepository port;

  public GetFocusActivitiesUseCase(FocusActivityRepository port) {
    this.port = port;
  }

  public List<FocusActivity> execute(UUID userIdLogado) {
    return port.findAllByUserIdOrderByOrderIndex(userIdLogado);
  }
}
