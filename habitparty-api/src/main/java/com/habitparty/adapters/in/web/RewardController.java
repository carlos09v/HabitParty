package com.habitparty.adapters.in.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.RewardApi;
import com.habitparty.adapters.in.web.dtos.request.CreateRewardDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateRewardDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateRewardOrderDTO;
import com.habitparty.adapters.in.web.dtos.response.RewardResponseDTO;
import com.habitparty.application.usecases.reward.CreateRewardCommand;
import com.habitparty.application.usecases.reward.CreateRewardUseCase;
import com.habitparty.application.usecases.reward.DeleteRewardUseCase;
import com.habitparty.application.usecases.reward.ListUserRewardsUseCase;
import com.habitparty.application.usecases.reward.RedeemRewardUseCase;
import com.habitparty.application.usecases.reward.ReorderRewardUseCase;
import com.habitparty.application.usecases.reward.RewardOrderCommand;
import com.habitparty.application.usecases.reward.UpdateRewardCommand;
import com.habitparty.application.usecases.reward.UpdateRewardUseCase;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class RewardController implements RewardApi {
  private final CreateRewardUseCase createRewardUseCase;
  private final DeleteRewardUseCase deleteRewardUseCase;
  private final ListUserRewardsUseCase listUserRewardsUseCase;
  private final ReorderRewardUseCase reorderRewardUseCase;
  private final RedeemRewardUseCase redeemRewardUseCase;
  private final UpdateRewardUseCase updateRewardUseCase;

  @Override
  public ResponseEntity<Void> redeemReward(
      UUID rewardId,
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    redeemRewardUseCase.execute(rewardId, userId);

    return ResponseEntity.noContent().build();
  }

  @Override
  public ResponseEntity<RewardResponseDTO> createReward(
      CreateRewardDTO requestDTO,
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    var command = new CreateRewardCommand(
        requestDTO.name(),
        requestDTO.icon(),
        requestDTO.description(),
        requestDTO.price(),
        requestDTO.category(),
        requestDTO.tags(),
        requestDTO.type(),
        requestDTO.packageLevel(),
        requestDTO.baseDurationMinutes()
    );
    Reward createdReward = createRewardUseCase.execute(command, userId);

    return ResponseEntity.status(HttpStatus.CREATED).body(RewardResponseDTO.fromDomain(createdReward));
  }

  @Override
  public ResponseEntity<Void> deleteReward(
      UUID id,
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    deleteRewardUseCase.execute(id, userId);

    return ResponseEntity.noContent().build();
  }

  @Override
  public ResponseEntity<Void> updateOrderIndex(
      List<UpdateRewardOrderDTO> newOrderList,
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    List<RewardOrderCommand> commands = newOrderList.stream()
        .map(dto -> new RewardOrderCommand(dto.id(), dto.newIndex()))
        .toList();
    reorderRewardUseCase.execute(userId, commands);

    return ResponseEntity.noContent().build();
  }

  @Override
  public ResponseEntity<RewardResponseDTO> update(
      UUID rewardId,
      UpdateRewardDTO dto,
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    var command = new UpdateRewardCommand(
        dto.name(),
        dto.icon(),
        dto.description(),
        dto.price(),
        dto.category(),
        dto.tags(),
        dto.type(),
        dto.packageLevel(),
        dto.baseDurationMinutes()
    );
    Reward updatedReward = updateRewardUseCase.execute(rewardId, command, userId);
    return ResponseEntity.ok(RewardResponseDTO.fromDomain(updatedReward));
  }

  @Override
  public ResponseEntity<List<RewardResponseDTO>> getRewardListByUserId(
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    List<Reward> rewards = listUserRewardsUseCase.execute(userId);

    List<RewardResponseDTO> responseList = rewards.stream()
        .map(RewardResponseDTO::fromDomain)
        .toList();

    return ResponseEntity.ok(responseList);
  }
}
