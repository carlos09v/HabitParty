package com.habitparty.application.usecases.user;

import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.PasswordResetTokenRepository;
import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.StoragePort;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class DeleteUserUseCase {
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
    private final PasswordResetTokenRepository passwordResetTokenPort;
    private final EmailDispatchLogRepository emailDispatchLogPort;

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
            PasswordResetTokenRepository passwordResetTokenPort,
            EmailDispatchLogRepository emailDispatchLogPort) {
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
        this.passwordResetTokenPort = passwordResetTokenPort;
        this.emailDispatchLogPort = emailDispatchLogPort;
    }

    public void execute(UUID id) {
        // 1. O Caso de Uso pergunta à Port se o usuário existe
        User user = port.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));

        // 2. Cascata manual bottom-up (respeitando FKs físicas e soft-links por user_id)
        taskPort.deleteAllByUserId(id);              // checklist_item + tasks (habit/daily/todo)
        boardColumnPort.deleteAllByUserId(id);
        workspacePort.deleteAllByUserId(id);
        focusRecordPort.deleteAllByUserId(id);
        focusActivityPort.deleteAllByUserId(id);
        inventoryItemPort.deleteAllByUserId(id);
        rewardPort.deleteAllByUserId(id);
        transactionHistoryPort.deleteAllByUserId(id);
        refreshTokenPort.deleteAllByUserId(id);
        passwordResetTokenPort.deleteAllByUserId(id);
        emailDispatchLogPort.deleteAllByUserId(id);

        // 3. Remove o usuário
        port.deleteById(id);

        // 4. Remove a foto de perfil do armazenamento local, se existir
        user.getProfilePhotoUrl().ifPresent(storagePort::deleteFile);
    }
}
