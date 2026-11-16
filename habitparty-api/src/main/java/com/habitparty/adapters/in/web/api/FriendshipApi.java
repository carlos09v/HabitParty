package com.habitparty.adapters.in.web.api;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.habitparty.adapters.in.web.dtos.request.social.MarkNotificationsSeenDTO;
import com.habitparty.adapters.in.web.dtos.request.social.RespondFriendRequestDTO;
import com.habitparty.adapters.in.web.dtos.request.social.SendFriendRequestDTO;
import com.habitparty.adapters.in.web.dtos.response.social.FriendsOverviewResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.social.RespondFriendRequestResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.social.SearchSocialUserResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.social.SendFriendRequestResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.social.SocialNotificationsFeedResponseDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RequestMapping("/friends")
@Tag(name = "Social & Amizades", description = "Rede de amigos, códigos de convite, solicitações e notificações sociais")
@SecurityRequirement(name = "bearerAuth")
public interface FriendshipApi {

  @GetMapping
  @Operation(summary = "Listar rede de amigos", description = "Retorna amigos aceitos, solicitações recebidas, enviadas, usuários bloqueados e o Código de Amigo do usuário.")
  ResponseEntity<FriendsOverviewResponseDTO> getFriendsOverview(
      @AuthenticationPrincipal AuthenticatedUser usuarioLogado);

  @GetMapping("/search")
  @Operation(summary = "Buscar usuários", description = "Busca outros usuários por @username, nome ou código de amigo exato (HP-XXXXXX).")
  ResponseEntity<List<SearchSocialUserResponseDTO>> searchUsers(
      @AuthenticationPrincipal AuthenticatedUser usuarioLogado,
      @RequestParam("q") String query);

  @PostMapping("/requests")
  @Operation(summary = "Enviar solicitação de amizade", description = "Envia um pedido de amizade por username ou código de amigo, respeitando a política de privacidade do destinatário.")
  ResponseEntity<SendFriendRequestResponseDTO> sendFriendRequest(
      @AuthenticationPrincipal AuthenticatedUser usuarioLogado,
      @Valid @RequestBody SendFriendRequestDTO requestDto);

  @PatchMapping("/requests/{friendshipId}")
  @Operation(summary = "Responder solicitação de amizade", description = "Aceita ou recusa uma solicitação de amizade recebida.")
  ResponseEntity<RespondFriendRequestResponseDTO> respondFriendRequest(
      @AuthenticationPrincipal AuthenticatedUser usuarioLogado,
      @PathVariable UUID friendshipId,
      @Valid @RequestBody RespondFriendRequestDTO requestDto);

  @DeleteMapping("/{friendshipId}")
  @Operation(summary = "Remover amizade ou cancelar convite", description = "Desfaz amizade, recusa/cancela solicitação pendente ou remove um bloqueio aplicado pelo usuário.")
  ResponseEntity<Void> removeFriendship(
      @AuthenticationPrincipal AuthenticatedUser usuarioLogado,
      @PathVariable UUID friendshipId);

  @PostMapping("/block/{userId}")
  @Operation(summary = "Bloquear usuário", description = "Bloqueia um usuário impedindo novas solicitações e ocultando visualizações mútuas.")
  ResponseEntity<Void> blockUser(
      @AuthenticationPrincipal AuthenticatedUser usuarioLogado,
      @PathVariable UUID userId);

  @GetMapping("/notifications")
  @Operation(summary = "Listar notificações sociais", description = "Retorna notificações recentes de pedidos de amizade, aceites e marcos de amigos.")
  ResponseEntity<SocialNotificationsFeedResponseDTO> listNotifications(
      @AuthenticationPrincipal AuthenticatedUser usuarioLogado,
      @RequestParam(name = "limit", defaultValue = "20") int limit,
      @RequestParam(name = "unseenOnly", defaultValue = "false") boolean unseenOnly);

  @PostMapping("/notifications/seen")
  @Operation(summary = "Marcar notificações sociais como vistas", description = "Marca todas as notificações sociais do usuário como lidas (ou apenas uma se notificationId for informado).")
  ResponseEntity<Void> markNotificationsSeen(
      @AuthenticationPrincipal AuthenticatedUser usuarioLogado,
      @RequestBody(required = false) MarkNotificationsSeenDTO requestDto);
}
