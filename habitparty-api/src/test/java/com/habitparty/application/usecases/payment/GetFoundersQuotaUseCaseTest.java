package com.habitparty.application.usecases.payment;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.adapters.in.web.dtos.response.FoundersQuotaDTO;
import com.habitparty.application.ports.UserRepository;

@ExtendWith(MockitoExtension.class)
class GetFoundersQuotaUseCaseTest {

  @Mock
  private UserRepository userRepository;

  @InjectMocks
  private GetFoundersQuotaUseCase getFoundersQuotaUseCase;

  @Test
  @DisplayName("Deve calcular corretamente as vagas restantes quando houver vagas disponíveis")
  void testCalculateQuotaAvailable() {
    when(userRepository.countFounders()).thenReturn(12L);

    FoundersQuotaDTO dto = getFoundersQuotaUseCase.execute();

    assertEquals(30, dto.maxSlots());
    assertEquals(12L, dto.claimedSlots());
    assertEquals(18L, dto.remainingSlots());
    assertTrue(dto.isAvailable());
  }

  @Test
  @DisplayName("Deve retornar isAvailable=false e remainingSlots=0 quando atingir 30 fundadores")
  void testCalculateQuotaSoldOut() {
    when(userRepository.countFounders()).thenReturn(30L);

    FoundersQuotaDTO dto = getFoundersQuotaUseCase.execute();

    assertEquals(30, dto.maxSlots());
    assertEquals(30L, dto.claimedSlots());
    assertEquals(0L, dto.remainingSlots());
    assertFalse(dto.isAvailable());
  }
}
