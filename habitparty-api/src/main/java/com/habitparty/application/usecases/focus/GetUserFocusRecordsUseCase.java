package com.habitparty.application.usecases.focus;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.core.domain.entities.focus.FocusRecord;

@Service
public class GetUserFocusRecordsUseCase {
  private final FocusRecordRepository port;

  public GetUserFocusRecordsUseCase(FocusRecordRepository port) {
    this.port = port;
  }

  public Page<FocusRecord> execute(UUID userIdLogado, int page, int size) {
    int safePage = Math.max(page, 0);
    int safeSize = Math.min(Math.max(size, 1), 100);
    return port.findAllByUserId(userIdLogado, safePage, safeSize);
  }
}
