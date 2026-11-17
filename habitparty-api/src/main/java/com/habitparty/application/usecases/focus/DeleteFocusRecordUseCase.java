package com.habitparty.application.usecases.focus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.UserStats;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.exceptions.ResourceNotFoundException;


@Service
public class DeleteFocusRecordUseCase {
    private final FocusRecordRepository port;
    private final InventoryItemRepository inventoryItemPort;
    private final TransactionHistoryRepository transactionPort;
    private TaskRepository taskPort;
    private UserRepository userPort;

    public DeleteFocusRecordUseCase(FocusRecordRepository port, InventoryItemRepository inventoryItemPort,
            TransactionHistoryRepository transactionPort) {
        this.port = port;
        this.inventoryItemPort = inventoryItemPort;
        this.transactionPort = transactionPort;
    }

    @Autowired(required = false)
    public void setTaskPort(TaskRepository taskPort) {
        this.taskPort = taskPort;
    }

    @Autowired(required = false)
    public void setUserPort(UserRepository userPort) {
        this.userPort = userPort;
    }

    @Transactional
    public void execute(UUID userIdLogado, UUID recordId) {
        execute(userIdLogado, recordId, false);
    }

    /**
     * @param deleteHistory quando verdadeiro, remove também o registro FOCUS_COMPLETED desta sessão no Histórico.
     */
    @Transactional
    public void execute(UUID userIdLogado, UUID recordId, boolean deleteHistory) {
        FocusRecord record = port.findById(recordId)
            .orElseThrow(() -> new ResourceNotFoundException("Registro não encontrado."));
        record.validateOwnership(userIdLogado);

        // Se esse tempo foi gasto de um cupom, devolvemos o saldo!
        if (record.getInventoryItemId().isPresent()) {
            UUID itemId = record.getInventoryItemId().get();
            inventoryItemPort.findById(itemId).ifPresent(item -> {
                // Reembolsa o tempo e reverte o status se necessário
                item.refundTime(record.getDurationMinutes());
                inventoryItemPort.save(item);
            });
        } else if (userPort != null) {
            // Estorna XP, moedas e contadores de foco de sessões produtivas, respeitando nível mínimo e saldo >= 0
            int xpToRevert = record.getXpEarned().orElse(0);
            BigDecimal coinsToRevert = record.getCoinsEarned().orElse(BigDecimal.ZERO);
            int minsToRevert = record.getDurationMinutes();
            int pomosToRevert = record.getCompletedPomos().orElse(0);

            if (xpToRevert > 0
                || coinsToRevert.compareTo(BigDecimal.ZERO) > 0
                || minsToRevert >= UserStats.MIN_FOCUS_MINUTES_FOR_STATS
                || pomosToRevert > 0) {
                userPort.findById(userIdLogado).ifPresent(user -> {
                    if (user.getStats() != null) {
                        UserStats stats = user.getStats();
                        stats.revertFocusSession(xpToRevert, coinsToRevert, minsToRevert, pomosToRevert);
                        if (minsToRevert >= UserStats.MIN_FOCUS_MINUTES_FOR_STATS) {
                            ZoneId userZone = user.resolveZoneId(ZoneId.systemDefault());
                            LocalDateTime userStartTime = record.getStartTime()
                                .atZone(ZoneId.systemDefault())
                                .withZoneSameInstant(userZone)
                                .toLocalDateTime();
                            LocalDateTime userEndTime = record.getEndTime()
                                .atZone(ZoneId.systemDefault())
                                .withZoneSameInstant(userZone)
                                .toLocalDateTime();
                            stats.revertFocusTimeOfDay(userStartTime, userEndTime, minsToRevert);
                            if (minsToRevert >= stats.getLongestFocusSessionMinutes()) {
                                int remainingMax = port.findMaxProductiveDurationMinutesExcludingRecord(
                                    userIdLogado, recordId);
                                stats.setLongestFocusSessionMinutes(remainingMax);
                            }
                        }
                        userPort.save(user);
                    }
                });
            }
        }

        // Se o registro estava vinculado a uma tarefa, subtrai os minutos e ciclos acumulados
        if (record.getTaskId().isPresent() && taskPort != null) {
            UUID taskId = record.getTaskId().get();
            taskPort.findById(taskId).ifPresent(task -> {
                int mins = Math.max(1, record.getDurationMinutes());
                int pomos = record.getCompletedPomos().orElse(0);
                task.removeFocusSession(mins, pomos);
                taskPort.save(task);
            });
        }

        if (deleteHistory) {
            transactionPort.deleteAllByReferenceIdAndUserId(recordId, userIdLogado);
        }

        port.deleteById(recordId);
    }
}
