package com.habitparty.application.usecases.payment;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.PaymentGatewayPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class CreateCustomerPortalSessionUseCase {
  private final UserRepository userRepository;
  private final PaymentGatewayPort paymentGatewayPort;

  public CreateCustomerPortalSessionUseCase(
      UserRepository userRepository,
      PaymentGatewayPort paymentGatewayPort) {
    this.userRepository = userRepository;
    this.paymentGatewayPort = paymentGatewayPort;
  }

  public String execute(UUID userId, String returnUrl) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    return paymentGatewayPort.createCustomerPortalSession(user, returnUrl);
  }
}
