package com.habitparty.adapters.in.web.api;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.habitparty.adapters.in.web.dtos.request.UpdateProfileHighlightsRequestDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateShowcaseProfileRequestDTO;
import com.habitparty.adapters.in.web.dtos.response.UserResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.showcase.AchievementItemResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.showcase.ProfileHighlightResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.showcase.PublicUserShowcaseResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.showcase.UserRetrospectiveResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.showcase.UserShowcaseResponseDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RequestMapping("/showcase")
@Tag(name = "Showcase & Achievements", description = "Endpoints da Vitrine de Perfil, Destaques e Conquistas")
public interface ShowcaseApi {

  @Operation(
      summary = "Obter Vitrine e Conquistas do Usuário Logado",
      description = "Avalia conquistas pendentes e retorna os dados completos da vitrine, métricas, destaques e catálogo de 30 conquistas.")
  @GetMapping("/me")
  ResponseEntity<UserShowcaseResponseDTO> getMyShowcase(
      @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado);

  @Operation(
      summary = "Atualizar Destaques da Vitrine",
      description = "Substitui os até 4 slots da vitrine de destaques do usuário logado.")
  @PutMapping("/highlights")
  ResponseEntity<List<ProfileHighlightResponseDTO>> updateMyHighlights(
      @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado,
      @Valid @RequestBody UpdateProfileHighlightsRequestDTO requestDto);

  @Operation(
      summary = "Atualizar Bio e Moldura da Vitrine",
      description = "Atualiza a bio curta de aventureiro e a moldura de avatar equipada.")
  @PatchMapping("/profile")
  ResponseEntity<UserResponseDTO> updateMyShowcaseProfile(
      @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado,
      @Valid @RequestBody UpdateShowcaseProfileRequestDTO requestDto);

  @Operation(
      summary = "Listar Conquistas Recém-Desbloqueadas (Não Vistas)",
      description = "Retorna as conquistas que o usuário acabou de desbloquear e ainda não foram marcadas como vistas.")
  @GetMapping("/achievements/unseen")
  ResponseEntity<List<AchievementItemResponseDTO>> getUnseenAchievements(
      @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado);

  @Operation(
      summary = "Marcar Conquistas como Vistas",
      description = "Marca todas as conquistas recém-desbloqueadas do usuário como vistas.")
  @PostMapping("/achievements/seen")
  ResponseEntity<Void> markAchievementsSeen(
      @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado);

  @Operation(
      summary = "Consultar Vitrine Pública de Usuário",
      description = "Retorna o perfil e métricas de outro usuário respeitando amizade e regras granulares de privacidade.")
  @GetMapping("/users/{username}")
  ResponseEntity<PublicUserShowcaseResponseDTO> getUserShowcaseByUsername(
      @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado,
      @PathVariable String username);

  @Operation(
      summary = "Consultar Minha Retrospectiva Anual",
      description = "Calcula os dados da retrospectiva anual e verifica a elegibilidade (mínimo 2 de 3 critérios de atividade no ano).")
  @GetMapping("/me/retrospective")
  ResponseEntity<UserRetrospectiveResponseDTO> getMyRetrospective(
      @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado,
      @RequestParam(name = "year", required = false) Integer year);

  @Operation(
      summary = "Consultar Retrospectiva Anual de Usuário",
      description = "Retorna a retrospectiva anual de outro usuário caso as métricas estejam visíveis ao solicitante.")
  @GetMapping("/users/{username}/retrospective")
  ResponseEntity<UserRetrospectiveResponseDTO> getUserRetrospectiveByUsername(
      @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado,
      @PathVariable String username,
      @RequestParam(name = "year", required = false) Integer year);
}
