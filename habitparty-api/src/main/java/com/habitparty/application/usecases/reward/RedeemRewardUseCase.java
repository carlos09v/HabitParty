package com.habitparty.application.usecases.reward;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.UserRepository;

@Service
public class RedeemRewardUseCase {
  private final RewardRepository port;
  private final UserRepository userPort;
  // private final InventoryItemRepository =>  para depois...
  
  public RedeemRewardUseCase(RewardRepository port, UserRepository userPort) {
    this.port = port;
    this.userPort = userPort;
  }

  
}
