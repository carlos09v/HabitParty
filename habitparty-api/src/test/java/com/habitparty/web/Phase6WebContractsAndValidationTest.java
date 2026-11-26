package com.habitparty.web;

import static org.junit.jupiter.api.Assertions.*;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.MethodParameter;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;

import com.habitparty.adapters.in.web.api.BoardColumnApi;
import com.habitparty.adapters.in.web.api.FocusActivityApi;
import com.habitparty.adapters.in.web.api.FriendshipApi;
import com.habitparty.adapters.in.web.api.InventoryItemApi;
import com.habitparty.adapters.in.web.api.RewardApi;
import com.habitparty.adapters.in.web.api.TaskApi;
import com.habitparty.adapters.in.web.dtos.request.CreateRewardDTO;
import com.habitparty.adapters.in.web.dtos.request.CreateUserDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateFocusActivityOrderDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateTaskOrderDTO;
import com.habitparty.adapters.in.web.dtos.response.ErrorResponseDTO;
import com.habitparty.adapters.out.export.CsvTransactionExporterAdapter;
import com.habitparty.adapters.out.persistence.BoardColumnAdapter;
import com.habitparty.adapters.out.security.BcryptPasswordHasherAdapter;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.reward.MysteryBoxLootItem;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.PaymentProcessingException;
import com.habitparty.core.exceptions.UnauthenticatedException;
import com.habitparty.core.exceptions.UnauthorizedException;
import com.habitparty.infrastructure.GlobalExceptionHandler;
import com.habitparty.infrastructure.security.AuthenticatedUser;
import com.habitparty.infrastructure.security.CurrentUserId;
import com.habitparty.infrastructure.security.CurrentUserIdArgumentResolver;

import jakarta.persistence.OptimisticLockException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.constraints.Size;

@SpringBootTest
@ActiveProfiles("test")
class Phase6WebContractsAndValidationTest {

  private final GlobalExceptionHandler handler = new GlobalExceptionHandler();
  private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

  @Autowired
  private BoardColumnAdapter boardColumnAdapter;

  @AfterEach
  void clearSecurityContext() {
    SecurityContextHolder.clearContext();
  }

  @Test
  @DisplayName("GlobalExceptionHandler: diferencia 401 vs 403, mascara e-mail duplicado/erros internos e trata OptimisticLock/Multipart/Async")
  void globalExceptionHandlerContractsAndMasking() {
    // 401 vs 403
    ResponseEntity<ErrorResponseDTO> unauth = handler.handleUnauthenticated(
        new UnauthenticatedException("Usuário não autenticado."));
    assertEquals(HttpStatus.UNAUTHORIZED, unauth.getStatusCode());
    assertEquals("Não Autenticado", unauth.getBody().error());

    ResponseEntity<ErrorResponseDTO> unauthLegacy = handler.handleUnauthorized(
        new UnauthorizedException("Usuário não autenticado."));
    assertEquals(HttpStatus.UNAUTHORIZED, unauthLegacy.getStatusCode());

    ResponseEntity<ErrorResponseDTO> forbidden = handler.handleUnauthorized(
        new UnauthorizedException("Você não tem permissão!"));
    assertEquals(HttpStatus.FORBIDDEN, forbidden.getStatusCode());

    // DataIntegrityViolation: email único -> 409 SEM ecoar email; FK/NOT NULL -> 400
    SQLException pgEmailUnique = new SQLException(
        "ERROR: duplicate key value violates unique constraint \"users_email_key\"\nDetail: Key (email)=(secret@victim.com) already exists.",
        "23505");
    ResponseEntity<ErrorResponseDTO> emailDup = handler.handleDataIntegrityViolation(
        new DataIntegrityViolationException("constraint", pgEmailUnique));
    assertEquals(HttpStatus.CONFLICT, emailDup.getStatusCode());
    assertFalse(emailDup.getBody().message().contains("secret@victim.com"));

    SQLException pgNotNull = new SQLException("null value in column \"name\" violates not-null constraint", "23502");
    ResponseEntity<ErrorResponseDTO> notNullResp = handler.handleDataIntegrityViolation(
        new DataIntegrityViolationException("not null", pgNotNull));
    assertEquals(HttpStatus.BAD_REQUEST, notNullResp.getStatusCode());

    // OptimisticLocking -> 409 Conflict
    ResponseEntity<ErrorResponseDTO> optSpring = handler.handleOptimisticLockingFailure(
        new ObjectOptimisticLockingFailureException("TaskJpaEntity", UUID.randomUUID()));
    ResponseEntity<ErrorResponseDTO> optJpa = handler.handleOptimisticLockingFailure(
        new OptimisticLockException("stale row"));
    assertEquals(HttpStatus.CONFLICT, optSpring.getStatusCode());
    assertEquals(HttpStatus.CONFLICT, optJpa.getStatusCode());

    // PaymentProcessingException, IllegalArgumentException, IllegalStateException mascaram detalhes internos
    ResponseEntity<ErrorResponseDTO> payErr = handler.handlePaymentProcessing(
        new PaymentProcessingException("STRIPE_WEBHOOK_SECRET não configurado no servidor."));
    assertEquals(HttpStatus.BAD_GATEWAY, payErr.getStatusCode());
    assertFalse(payErr.getBody().message().contains("STRIPE_WEBHOOK_SECRET"));

    ResponseEntity<ErrorResponseDTO> illegalArg = handler.handleIllegalArgumentException(
        new IllegalArgumentException("Internal enum com.habitparty.SecretEnum"));
    assertEquals(HttpStatus.BAD_REQUEST, illegalArg.getStatusCode());
    assertFalse(illegalArg.getBody().message().contains("SecretEnum"));

    ResponseEntity<ErrorResponseDTO> illegalState = handler.handleIllegalStateException(
        new IllegalStateException("JWT secret missing in env"));
    assertEquals(HttpStatus.BAD_REQUEST, illegalState.getStatusCode());
    assertFalse(illegalState.getBody().message().contains("JWT secret"));

    // 413 CONTENT_TOO_LARGE, 400 MultipartException, AsyncRequestNotUsableException -> null
    assertEquals(HttpStatus.CONTENT_TOO_LARGE,
        handler.handleMaxUploadSizeExceeded(new MaxUploadSizeExceededException(5_000_000)).getStatusCode());
    assertEquals(HttpStatus.BAD_REQUEST,
        handler.handleMultipartException(new MultipartException("corrupted boundary")).getStatusCode());
    assertNull(handler.handleAsyncRequestNotUsable(new AsyncRequestNotUsableException("broken pipe")));
  }

  @Test
  @DisplayName("DTO Validation & BCrypt 72-byte limit: rejeita orderIndex nulo, excesso de tags/lootItems e senhas > 72 bytes UTF-8")
  void dtoValidationsAndBcryptByteLimit() {
    // Integer orderIndex agora rejeita null corretamente
    assertFalse(validator.validate(new UpdateFocusActivityOrderDTO(UUID.randomUUID(), null)).isEmpty());
    assertFalse(validator.validate(new UpdateTaskOrderDTO(UUID.randomUUID(), UUID.randomUUID(), null)).isEmpty());

    // CreateRewardDTO limita tags (max 5) e lootItems (max 10)
    CreateRewardDTO tooManyTags = new CreateRewardDTO(
        "Café", "coffee", null, new BigDecimal("5.00"), RewardCategory.NONE,
        List.of("1", "2", "3", "4", "5", "6"), RewardType.SINGLE_USE, RewardPackageLevel.NONE, null, null);
    assertFalse(validator.validate(tooManyTags).isEmpty());

    List<MysteryBoxLootItem> elevenLoot = java.util.stream.IntStream.range(0, 11)
        .mapToObj(i -> new MysteryBoxLootItem("Item " + i, "gift", 10))
        .toList();
    CreateRewardDTO tooManyLoot = new CreateRewardDTO(
        "Caixa", "gift", null, new BigDecimal("50.00"), RewardCategory.NONE,
        List.of(), RewardType.MISTERY_BOX, RewardPackageLevel.BASIC, null, elevenLoot);
    assertFalse(validator.validate(tooManyLoot).isEmpty());

    // CreateUserDTO mensagem de senha corrigida (64 em vez de 20)
    CreateUserDTO shortPwd = new CreateUserDTO(
        "Ana", "anadev", "ana@example.com", "A@1", UserGender.FEMALE, java.time.LocalDate.of(1998, 1, 1));
    Set<ConstraintViolation<CreateUserDTO>> pwdViolations = validator.validate(shortPwd);
    assertTrue(pwdViolations.stream().anyMatch(v -> v.getMessage().contains("8 e 64 caracteres")));

    // BCrypt 72-byte UTF-8 guard (20 emojis = 80 bytes > 72 bytes)
    BcryptPasswordHasherAdapter hasher = new BcryptPasswordHasherAdapter(new BCryptPasswordEncoder());
    String emojiPassword = "A@" + "\uD83D\uDE80".repeat(20);
    assertThrows(DomainValidationException.class, () -> hasher.encode(emojiPassword));
    assertFalse(hasher.matches(emojiPassword, "$2a$10$dummyhashdummyhashdummyhashdummyhashdummyhashdummyha"));
  }

  @Test
  @DisplayName("OpenAPI & Reorder APIs: FriendshipApi esconde userId em todos os 8 endpoints e listas de reorder possuem @Size(max = 500)")
  void friendshipApiHiddenAndReorderSizeBounds() throws Exception {
    assertEquals(8, FriendshipApi.class.getDeclaredMethods().length);
    for (Method method : FriendshipApi.class.getDeclaredMethods()) {
      boolean hasHiddenCurrentUserId = false;
      for (Parameter p : method.getParameters()) {
        io.swagger.v3.oas.annotations.Parameter openApiParam =
            p.getAnnotation(io.swagger.v3.oas.annotations.Parameter.class);
        if (p.isAnnotationPresent(CurrentUserId.class) && openApiParam != null && openApiParam.hidden()) {
          hasHiddenCurrentUserId = true;
        }
      }
      assertTrue(hasHiddenCurrentUserId,
          () -> "Endpoint FriendshipApi." + method.getName() + " deve anotar @Parameter(hidden = true) @CurrentUserId");
    }

    // Verifica @Size(max = 500) nas 5 APIs de reordenação
    assertReorderListHasMax500(FocusActivityApi.class, "reorder");
    assertReorderListHasMax500(BoardColumnApi.class, "updateOrderIndex");
    assertReorderListHasMax500(TaskApi.class, "moveTasks");
    assertReorderListHasMax500(InventoryItemApi.class, "reorderInventory");
    assertReorderListHasMax500(RewardApi.class, "updateOrderIndex");
  }

  private static void assertReorderListHasMax500(Class<?> apiClass, String methodName) {
    Method target = java.util.Arrays.stream(apiClass.getDeclaredMethods())
        .filter(m -> m.getName().equals(methodName))
        .findFirst()
        .orElseThrow();
    boolean foundBoundedList = false;
    for (Parameter param : target.getParameters()) {
      Size size = param.getAnnotation(Size.class);
      if (List.class.isAssignableFrom(param.getType()) && size != null && size.max() == 500) {
        foundBoundedList = true;
      }
    }
    assertTrue(foundBoundedList, () -> apiClass.getSimpleName() + "." + methodName + " deve limitar lista com @Size(max = 500)");
  }

  @Test
  @DisplayName("@CurrentUserId resolver: extrai UUID autenticado e lança UnauthenticatedException (401) quando anônimo")
  void currentUserIdArgumentResolverWorks() throws Exception {
    CurrentUserIdArgumentResolver resolver = new CurrentUserIdArgumentResolver();
    Method sampleMethod = FriendshipApi.class.getMethod("getFriendsOverview", UUID.class);
    MethodParameter param = new MethodParameter(sampleMethod, 0);

    assertTrue(resolver.supportsParameter(param));

    // Sem autenticação -> UnauthenticatedException (401)
    SecurityContextHolder.clearContext();
    assertThrows(UnauthenticatedException.class,
        () -> resolver.resolveArgument(param, null, null, null));

    // Com AuthenticatedUser -> retorna UUID
    UUID expectedId = UUID.randomUUID();
    AuthenticatedUser principal = new AuthenticatedUser(expectedId, "USER");
    SecurityContextHolder.getContext().setAuthentication(
        new UsernamePasswordAuthenticationToken(principal, null, List.of()));
    assertEquals(expectedId, resolver.resolveArgument(param, null, null, null));
  }

  @Test
  @DisplayName("CSV Injection: neutraliza CR isolado (\\r=CMD()), TAB inicial (\\tfoo) e espaços antes de fórmulas")
  void csvSanitizerHandlesCrTabAndLeadingWhitespace() throws Exception {
    Method sanitize = CsvTransactionExporterAdapter.class.getDeclaredMethod("sanitizeCsvCell", String.class);
    sanitize.setAccessible(true);

    assertEquals("safe\n'=CMD()", sanitize.invoke(null, "safe\r=CMD()"));
    assertEquals("'\tfoo", sanitize.invoke(null, "\tfoo"));
    assertEquals("'\t=SUM(A1:A10)", sanitize.invoke(null, "\t=SUM(A1:A10)"));
    assertEquals("'  +1+1", sanitize.invoke(null, "  +1+1"));
    assertEquals("Normal text", sanitize.invoke(null, "Normal text"));
  }

  @Test
  @Transactional
  @DisplayName("BoardColumnAdapter: maxOrderIndex de workspace vazio é -1 (1ª coluna = 0) e findAllByWorkspaceId retorna ordenado")
  void boardColumnMaxOrderIndexAndOrdering() {
    UUID emptyWsId = UUID.randomUUID();
    assertEquals(-1, boardColumnAdapter.getMaxOrderIndex(emptyWsId));

    UUID wsId = UUID.randomUUID();
    UUID ownerId = UUID.randomUUID();
    boardColumnAdapter.save(new BoardColumn(UUID.randomUUID(), ownerId, wsId, "Terceira", 2, "c", false));
    boardColumnAdapter.save(new BoardColumn(UUID.randomUUID(), ownerId, wsId, "Primeira", 0, "a", true));
    boardColumnAdapter.save(new BoardColumn(UUID.randomUUID(), ownerId, wsId, "Segunda", 1, "b", true));

    List<BoardColumn> ordered = boardColumnAdapter.findAllByWorkspaceId(wsId);
    assertEquals(List.of("Primeira", "Segunda", "Terceira"),
        ordered.stream().map(BoardColumn::getName).toList());
    assertEquals(2, boardColumnAdapter.getMaxOrderIndex(wsId));
  }
}
