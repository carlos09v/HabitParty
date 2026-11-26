package com.habitparty.application.usecases.user;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionOperations;
import org.springframework.transaction.support.TransactionTemplate;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.FriendshipRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.PaymentGatewayPort;
import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.SocialNotificationRepository;
import com.habitparty.application.ports.StoragePort;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserArtifactRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.UserTokenRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class DeleteUserUseCase {
    private static final Logger log = LoggerFactory.getLogger(DeleteUserUseCase.class);

    private final UserRepository port;
    private final StoragePort storagePort;
    private final TaskRepository taskPort;
    private final BoardColumnRepository boardColumnPort;
    private final WorkspaceRepository workspacePort;
    private final RewardRepository rewardPort;
    private final InventoryItemRepository inventoryItemPort;
    private final FocusRecordRepository focusRecordPort;
    private final FocusActivityRepository focusActivityPort;
    private final TransactionHistoryRepository transactionHistoryPort;
    private final RefreshTokenRepository refreshTokenPort;
    private final UserTokenRepository userTokenPort;
    private final EmailDispatchLogRepository emailDispatchLogPort;
    private final UserAchievementRepository userAchievementPort;
    private final ProfileHighlightRepository profileHighlightPort;
    private final FriendshipRepository friendshipPort;
    private final SocialNotificationRepository socialNotificationPort;
    private final PaymentGatewayPort paymentGatewayPort;
    private UserArtifactRepository userArtifactPort;
    private TransactionOperations transactionOperations;

    @Autowired(required = false)
    public void setUserArtifactPort(UserArtifactRepository userArtifactPort) {
        this.userArtifactPort = userArtifactPort;
    }

    @Autowired(required = false)
    public void setTransactionManager(@Nullable PlatformTransactionManager transactionManager) {
        this.transactionOperations = transactionManager != null
            ? new TransactionTemplate(transactionManager)
            : null;
    }

    @Autowired
    public DeleteUserUseCase(UserRepository port,
            StoragePort storagePort,
            TaskRepository taskPort,
            BoardColumnRepository boardColumnPort,
            WorkspaceRepository workspacePort,
            RewardRepository rewardPort,
            InventoryItemRepository inventoryItemPort,
            FocusRecordRepository focusRecordPort,
            FocusActivityRepository focusActivityPort,
            TransactionHistoryRepository transactionHistoryPort,
            RefreshTokenRepository refreshTokenPort,
            UserTokenRepository userTokenPort,
            EmailDispatchLogRepository emailDispatchLogPort,
            @Nullable UserAchievementRepository userAchievementPort,
            @Nullable ProfileHighlightRepository profileHighlightPort,
            @Nullable FriendshipRepository friendshipPort,
            @Nullable SocialNotificationRepository socialNotificationPort,
            @Nullable PaymentGatewayPort paymentGatewayPort) {
        this.port = port;
        this.storagePort = storagePort;
        this.taskPort = taskPort;
        this.boardColumnPort = boardColumnPort;
        this.workspacePort = workspacePort;
        this.rewardPort = rewardPort;
        this.inventoryItemPort = inventoryItemPort;
        this.focusRecordPort = focusRecordPort;
        this.focusActivityPort = focusActivityPort;
        this.transactionHistoryPort = transactionHistoryPort;
        this.refreshTokenPort = refreshTokenPort;
        this.userTokenPort = userTokenPort;
        this.emailDispatchLogPort = emailDispatchLogPort;
        this.userAchievementPort = userAchievementPort;
        this.profileHighlightPort = profileHighlightPort;
        this.friendshipPort = friendshipPort;
        this.socialNotificationPort = socialNotificationPort;
        this.paymentGatewayPort = paymentGatewayPort;
    }

    public DeleteUserUseCase(UserRepository port,
            StoragePort storagePort,
            TaskRepository taskPort,
            BoardColumnRepository boardColumnPort,
            WorkspaceRepository workspacePort,
            RewardRepository rewardPort,
            InventoryItemRepository inventoryItemPort,
            FocusRecordRepository focusRecordPort,
            FocusActivityRepository focusActivityPort,
            TransactionHistoryRepository transactionHistoryPort,
            RefreshTokenRepository refreshTokenPort,
            UserTokenRepository userTokenPort,
            EmailDispatchLogRepository emailDispatchLogPort,
            @Nullable UserAchievementRepository userAchievementPort,
            @Nullable ProfileHighlightRepository profileHighlightPort,
            @Nullable FriendshipRepository friendshipPort,
            @Nullable SocialNotificationRepository socialNotificationPort) {
        this(
            port,
            storagePort,
            taskPort,
            boardColumnPort,
            workspacePort,
            rewardPort,
            inventoryItemPort,
            focusRecordPort,
            focusActivityPort,
            transactionHistoryPort,
            refreshTokenPort,
            userTokenPort,
            emailDispatchLogPort,
            userAchievementPort,
            profileHighlightPort,
            friendshipPort,
            socialNotificationPort,
            null);
    }

    public DeleteUserUseCase(UserRepository port,
            StoragePort storagePort,
            TaskRepository taskPort,
            BoardColumnRepository boardColumnPort,
            WorkspaceRepository workspacePort,
            RewardRepository rewardPort,
            InventoryItemRepository inventoryItemPort,
            FocusRecordRepository focusRecordPort,
            FocusActivityRepository focusActivityPort,
            TransactionHistoryRepository transactionHistoryPort,
            RefreshTokenRepository refreshTokenPort,
            UserTokenRepository userTokenPort,
            EmailDispatchLogRepository emailDispatchLogPort) {
        this(
            port,
            storagePort,
            taskPort,
            boardColumnPort,
            workspacePort,
            rewardPort,
            inventoryItemPort,
            focusRecordPort,
            focusActivityPort,
            transactionHistoryPort,
            refreshTokenPort,
            userTokenPort,
            emailDispatchLogPort,
            null,
            null,
            null,
            null);
    }

    public void execute(UUID id) {
        // 1. O Caso de Uso pergunta à Port se o usuário existe (leitura curta fora de transação longa)
        User user = port.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));

        // 1.5 Cancela imediatamente assinatura recorrente fora da transação de banco para não prender conexão HikariCP
        if (paymentGatewayPort != null
                && user.hasCancelableStripeSubscription()
                && user.getStripeSubscriptionId() != null
                && !user.getStripeSubscriptionId().isBlank()) {
            paymentGatewayPort.cancelSubscriptionImmediately(user.getStripeSubscriptionId());
        }

        // 2 & 3. Cascata manual bottom-up + remoção do usuário em transação atômica dedicada (sem I/O externo)
        executeInTransaction(() -> deleteUserRecords(id));

        // 4. Remove a foto de perfil do armazenamento local somente após commit no banco (fora da transação)
        user.getProfilePhotoUrl().ifPresent(this::safeDeleteProfilePhoto);
    }

    private void deleteUserRecords(UUID id) {
        taskPort.deleteAllByUserId(id);              // checklist_item + tasks (habit/daily/todo)
        boardColumnPort.deleteAllByUserId(id);
        workspacePort.deleteAllByUserId(id);
        focusRecordPort.deleteAllByUserId(id);
        focusActivityPort.deleteAllByUserId(id);
        inventoryItemPort.deleteAllByUserId(id);
        rewardPort.deleteAllByUserId(id);
        transactionHistoryPort.deleteAllByUserId(id);
        refreshTokenPort.deleteAllByUserId(id);
        userTokenPort.deleteAllByUserId(id);
        emailDispatchLogPort.deleteAllByUserId(id);
        if (profileHighlightPort != null) {
            profileHighlightPort.deleteAllByUserId(id);
        }
        if (userAchievementPort != null) {
            userAchievementPort.deleteAllByUserId(id);
        }
        if (userArtifactPort != null) {
            userArtifactPort.deleteAllByUserId(id);
        }
        if (friendshipPort != null) {
            friendshipPort.deleteAllByUserId(id);
        }
        if (socialNotificationPort != null) {
            socialNotificationPort.deleteAllByUserId(id);
        }

        // Remove o usuário (e por cascade 1:1 remove user_stats e user_subscriptions)
        port.deleteById(id);
    }

    private void executeInTransaction(Runnable action) {
        if (transactionOperations == null) {
            action.run();
            return;
        }
        transactionOperations.executeWithoutResult(status -> action.run());
    }

    private void safeDeleteProfilePhoto(String photoUrl) {
        try {
            storagePort.deleteFile(photoUrl);
        } catch (Exception e) {
            log.warn("[DeleteUserUseCase] Falha ao remover foto de perfil ({}) após exclusão da conta: {}",
                photoUrl, e.getMessage());
        }
    }
}
