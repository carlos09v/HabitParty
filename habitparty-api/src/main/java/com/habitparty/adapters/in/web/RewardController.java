package com.habitparty.adapters.in.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.dtos.request.CreateRewardDTO;
import com.habitparty.adapters.in.web.dtos.request.RedeemRewardRequestDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateRewardDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateRewardOrderDTO;
import com.habitparty.adapters.in.web.dtos.response.RewardResponseDTO;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.application.usecases.reward.CreateRewardUseCase;
import com.habitparty.application.usecases.reward.DeleteRewardUseCase;
import com.habitparty.application.usecases.reward.FindRewardByIdUseCase;
import com.habitparty.application.usecases.reward.ListUserRewardsUseCase;
import com.habitparty.application.usecases.reward.RedeemRewardUseCase;
import com.habitparty.application.usecases.reward.ReorderRewardUseCase;
import com.habitparty.application.usecases.reward.UpdateRewardUseCase;
import com.habitparty.core.domain.entities.reward.Reward;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/rewards")
@Validated // para quando receber uma lista do body, fazendo com que o @Valid funcione
public class RewardController {
  private final CreateRewardUseCase createRewardUseCase;
  private final DeleteRewardUseCase deleteRewardUseCase;
  // private final FindRewardByIdUseCase findRewardByIdUseCase;
  private final ListUserRewardsUseCase listUserRewardsUseCase;
  private final ReorderRewardUseCase reorderRewardUseCase;
  private final RedeemRewardUseCase redeemRewardUseCase;
  private final UpdateRewardUseCase updateRewardUseCase;

  public RewardController(CreateRewardUseCase createRewardUseCase, DeleteRewardUseCase deleteRewardUseCase,
      ListUserRewardsUseCase listUserRewardsUseCase, ReorderRewardUseCase reorderRewardUseCase,
      RedeemRewardUseCase redeemRewardUseCase, UpdateRewardUseCase updateRewardUseCase) {
    this.createRewardUseCase = createRewardUseCase;
    this.deleteRewardUseCase = deleteRewardUseCase;
    this.listUserRewardsUseCase = listUserRewardsUseCase;
    this.reorderRewardUseCase = reorderRewardUseCase;
    this.redeemRewardUseCase = redeemRewardUseCase;
    this.updateRewardUseCase = updateRewardUseCase;
    // this.findRewardByIdUseCase = findRewardByIdUseCase;
  }

  @PostMapping("/{rewardId}/redeem")
  public ResponseEntity<Void> redeemReward(
      @PathVariable UUID rewardId,
      @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
    UUID userId = usuarioLogado.getId();
    RedeemRewardRequestDTO requestDTO = new RedeemRewardRequestDTO(rewardId);

    // Chama o Caso de Uso que construímos (que debita moedas, roda roleta, etc.)
    redeemRewardUseCase.execute(requestDTO, userId);

    // Retorna 204 No Content (Sucesso, mas sem corpo de resposta, já que o front-end vai atualizar a mochila chamando o GET /inventory depois)
    return ResponseEntity.noContent().build();
  }

  @PostMapping
  public ResponseEntity<RewardResponseDTO> createReward(
      @RequestBody @Valid CreateRewardDTO requestDTO,
      @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
    UUID userId = usuarioLogado.getId();
    Reward createdReward = createRewardUseCase.execute(requestDTO, userId);

    return ResponseEntity.status(HttpStatus.CREATED).body(RewardResponseDTO.fromDomain(createdReward));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteReward(
      @PathVariable UUID id,
      @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
    UUID userId = usuarioLogado.getId();
    deleteRewardUseCase.execute(id, userId);

    return ResponseEntity.noContent().build();
  }

  @PutMapping("/reorder")
  public ResponseEntity<Void> updateOrderIndex(
      @RequestBody List<@Valid UpdateRewardOrderDTO> newOrderList, // O Frontend manda a nova ordem no Body
      @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
    UUID userId = usuarioLogado.getId();
    reorderRewardUseCase.execute(newOrderList, userId);

    return ResponseEntity.noContent().build();
  }

  @PutMapping("/{rewardId}")
  public ResponseEntity<RewardResponseDTO> update(
      @PathVariable UUID rewardId,
      @RequestBody @Valid UpdateRewardDTO dto,
      @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
    UUID userId = usuarioLogado.getId();
    
    RewardResponseDTO responseDTO = updateRewardUseCase.execute(rewardId, dto, userId);

    return ResponseEntity.ok(responseDTO);
  }

  @GetMapping
  public ResponseEntity<List<RewardResponseDTO>> getRewardListByUserId(
      @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
    UUID userId = usuarioLogado.getId();
    List<Reward> rewards = listUserRewardsUseCase.execute(userId);

    List<RewardResponseDTO> responseList = rewards.stream()
        .map(RewardResponseDTO::fromDomain)
        .toList();

    return ResponseEntity.ok(responseList);
  }

  // findRewardByIdUseCase ?
}
