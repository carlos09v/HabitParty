package com.habitparty.application.usecases.payment;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.response.FoundersQuotaDTO;
import com.habitparty.application.ports.UserRepository;

@Service
public class GetFoundersQuotaUseCase {

  public static final int MAX_FOUNDER_SLOTS = 30;

  private final UserRepository userRepository;

  public GetFoundersQuotaUseCase(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public FoundersQuotaDTO execute() {
    long claimed = userRepository.countFounders();
    long remaining = Math.max(0, MAX_FOUNDER_SLOTS - claimed);
    boolean isAvailable = remaining > 0;

    return new FoundersQuotaDTO(
        MAX_FOUNDER_SLOTS,
        claimed,
        remaining,
        isAvailable
    );
  }
}
