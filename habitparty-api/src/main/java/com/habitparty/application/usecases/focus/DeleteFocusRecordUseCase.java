package com.habitparty.application.usecases.focus;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.exceptions.ResourceNotFoundException;


@Service
public class DeleteFocusRecordUseCase {
    private final FocusRecordRepository port;
    private final InventoryItemRepository inventoryItemPort;
    private final TransactionHistoryRepository transactionPort;
    private TaskRepository taskPort;
    private UserRepository userPort;
    private Clock clock = Clock.systemUTC();

    public DeleteFocusRecordUseCase(FocusRecordRepository port, InventoryItemRepository inventoryItemPort,
            TransactionHistoryRepository transactionPort) {
        this.port = port;
        this.inventoryItemPort = inventoryItemPort;
        this.transactionPort = transactionPort;
    }

    @Autowired(required = false)
    public void setClock(Clock clock) {
        this.clock = clock != null ? clock : Clock.systemUTC();
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

        FocusRecordReversalSupport.revertDeletedRecords(
            userIdLogado,
            List.of(record),
            port,
            userPort,
            inventoryItemPort,
            taskPort,
            transactionPort,
            clock);

        if (deleteHistory) {
            transactionPort.deleteAllByReferenceIdAndUserId(recordId, userIdLogado);
        }

        port.deleteById(recordId);
    }
}
