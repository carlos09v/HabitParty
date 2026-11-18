package com.habitparty.application.usecases.focus;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class DeleteFocusActivityUseCase {
  private final FocusActivityRepository port;
  private final FocusRecordRepository focusRecordPort;
  private final TransactionHistoryRepository transactionPort;
  private UserRepository userPort;
  private TaskRepository taskPort;
  private InventoryItemRepository inventoryItemPort;

  public DeleteFocusActivityUseCase(
      FocusActivityRepository port,
      FocusRecordRepository focusRecordPort,
      TransactionHistoryRepository transactionPort) {
    this.port = port;
    this.focusRecordPort = focusRecordPort;
    this.transactionPort = transactionPort;
  }

  @Autowired(required = false)
  public void setUserPort(UserRepository userPort) {
    this.userPort = userPort;
  }

  @Autowired(required = false)
  public void setTaskPort(TaskRepository taskPort) {
    this.taskPort = taskPort;
  }

  @Autowired(required = false)
  public void setInventoryItemPort(InventoryItemRepository inventoryItemPort) {
    this.inventoryItemPort = inventoryItemPort;
  }

  @Transactional
  public void execute(UUID userIdLogado, UUID activityId, boolean deleteHistory) {
    FocusActivity activity = port.findById(activityId)
        .orElseThrow(() -> new ResourceNotFoundException("Atividade de foco não encontrada."));
    activity.validateOwnership(userIdLogado);

    if (deleteHistory) {
      List<FocusRecord> activityRecords = focusRecordPort.findAllByFocusActivityId(activityId);
      if (activityRecords != null && !activityRecords.isEmpty()) {
        FocusRecordReversalSupport.revertDeletedRecords(
            userIdLogado,
            activityRecords,
            focusRecordPort,
            userPort,
            inventoryItemPort,
            taskPort);

        List<UUID> recordIds = activityRecords.stream()
            .map(FocusRecord::getId)
            .toList();
        transactionPort.deleteAllByReferenceIdsAndUserId(recordIds, userIdLogado);
      }

      focusRecordPort.deleteAllByFocusActivityId(activityId);
    } else {
      focusRecordPort.nullifyFocusActivityId(activityId);
    }

    int deletedOrderIndex = activity.getOrderIndex();

    port.deleteById(activityId);

    // Reorganiza a lista, puxando todos os itens abaixo um passo para cima
    port.shiftOrderIndexDown(userIdLogado, deletedOrderIndex);
  }
}
