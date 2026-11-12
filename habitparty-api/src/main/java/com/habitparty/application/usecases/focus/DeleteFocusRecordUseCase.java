package com.habitparty.application.usecases.focus;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.exceptions.ResourceNotFoundException;


@Service
public class DeleteFocusRecordUseCase {
    private final FocusRecordRepository port;
    private final InventoryItemRepository inventoryItemPort;
    private final TransactionHistoryRepository transactionPort;
    private TaskRepository taskPort;

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