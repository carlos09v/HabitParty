package com.habitparty.application.usecases.payment;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.projections.FoundersQuotaProjection;

@Service
@Transactional(readOnly = true)
public class GetFoundersQuotaUseCase {

  public static final int MAX_FOUNDER_SLOTS = 30;

  private final UserRepository userRepository;

  public GetFoundersQuotaUseCase(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public FoundersQuotaProjection execute() {
    long claimed = userRepository.countFounders();
    long remaining = Math.max(0, MAX_FOUNDER_SLOTS - claimed);
    boolean isAvailable = remaining > 0;

    return new FoundersQuotaProjection(
        MAX_FOUNDER_SLOTS,
        claimed,
        remaining,
        isAvailable
    );
  }
}
