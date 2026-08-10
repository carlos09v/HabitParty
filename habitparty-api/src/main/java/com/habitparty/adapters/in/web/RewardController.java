package com.habitparty.adapters.in.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.dtos.request.CreateRewardDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateRewardDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateRewardOrderDTO;
import com.habitparty.adapters.in.web.dtos.response.RewardResponseDTO;
import com.habitparty.application.usecases.reward.CreateRewardUseCase;
import com.habitparty.application.usecases.reward.DeleteRewardUseCase;
import com.habitparty.application.usecases.reward.FindRewardByIdUseCase;
import com.habitparty.application.usecases.reward.ListUserRewardsUseCase;
import com.habitparty.application.usecases.reward.ReorderRewardUseCase;
import com.habitparty.application.usecases.reward.UpdateRewardUseCase;
import com.habitparty.core.domain.entities.Reward;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;


@RestController
@RequestMapping("/rewards")
@Validated // para quando receber uma lista do body, fazendo com que o @Valid funcione
public class RewardController {
  private final CreateRewardUseCase createRewardUseCase;
  private final DeleteRewardUseCase deleteRewardUseCase;
  // private final FindRewardByIdUseCase findRewardByIdUseCase;
  private final ListUserRewardsUseCase listUserRewardsUseCase;
  private final ReorderRewardUseCase reorderRewardUseCase;

  private final UpdateRewardUseCase updateRewardUseCase;
  public RewardController(CreateRewardUseCase createRewardUseCase, DeleteRewardUseCase deleteRewardUseCase,
      FindRewardByIdUseCase findRewardByIdUseCase, ListUserRewardsUseCase listUserRewardsUseCase,
      ReorderRewardUseCase reorderRewardUseCase, UpdateRewardUseCase updateRewardUseCase) {
    this.createRewardUseCase = createRewardUseCase;
    this.deleteRewardUseCase = deleteRewardUseCase;
    // this.findRewardByIdUseCase = findRewardByIdUseCase;
    this.listUserRewardsUseCase = listUserRewardsUseCase;
    this.reorderRewardUseCase = reorderRewardUseCase;
    this.updateRewardUseCase = updateRewardUseCase;
  }

  
  @PostMapping
  public ResponseEntity<RewardResponseDTO> createReward(
    @RequestBody @Valid CreateRewardDTO requestDTO,
    @RequestHeader("X-User-Id") UUID userIdLogado
  ) {
    Reward createdReward = createRewardUseCase.execute(requestDTO, userIdLogado);

    return ResponseEntity.status(HttpStatus.CREATED).body(RewardResponseDTO.fromDomain(createdReward));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteReward(
    @PathVariable UUID id,
    @RequestHeader("X-User-Id") UUID userIdLogado
  ) {
    deleteRewardUseCase.execute(id, userIdLogado);

    return ResponseEntity.noContent().build();
  }
  
  @PutMapping("/reorder")
  public ResponseEntity<Void> updateOrderIndex(
    @RequestBody @Valid List<UpdateRewardOrderDTO> newOrderList, // O Frontend manda a nova ordem no Body
    @RequestHeader("X-User-Id") UUID userIdLogado
  ) {
    reorderRewardUseCase.execute(newOrderList, userIdLogado);

    return ResponseEntity.noContent().build();
  }

  @PutMapping("/{rewardId}")
  public ResponseEntity<RewardResponseDTO> update(
    @PathVariable UUID rewardId,
    @RequestBody @Valid UpdateRewardDTO dto,
    @RequestHeader("X-User-Id") UUID userIdLogado
  ) {
    Reward updatedReward = updateRewardUseCase.execute(rewardId, dto, userIdLogado);

    return ResponseEntity.ok(RewardResponseDTO.fromDomain(updatedReward));
  }

  @GetMapping
  public ResponseEntity<List<RewardResponseDTO>> getRewardListByUserId(
      @RequestHeader("X-User-Id") UUID userIdLogado
  ) {
    List<Reward> rewards = listUserRewardsUseCase.execute(userIdLogado);

    List<RewardResponseDTO> responseList = rewards.stream()
        .map(RewardResponseDTO::fromDomain)
        .toList();

    return ResponseEntity.ok(responseList);
  }

  // findRewardByIdUseCase ?
}
