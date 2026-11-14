package com.habitparty.application.usecases.boardcolumn;

import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class CreateBoardColumnUseCase {
  private final WorkspaceRepository workspacePort;
  private final UserRepository userPort;
  private final BoardColumnRepository port;
  private WorkspaceWriteGuard workspaceWriteGuard;

  public CreateBoardColumnUseCase(WorkspaceRepository workspacePort, BoardColumnRepository port, UserRepository userPort) {
    this.workspacePort = workspacePort;
    this.port = port;
    this.userPort = userPort;
  }

  @Autowired(required = false)
  public void setWorkspaceWriteGuard(WorkspaceWriteGuard workspaceWriteGuard) {
    this.workspaceWriteGuard = workspaceWriteGuard;
  }

  public BoardColumn execute(CreateBoardColumnCommand command, UUID userIdLogado) {
   // Verificar se o workspace existe e validar posse
    Workspace workspace = workspacePort.findById(command.workspaceId())
        .orElseThrow(() -> new ResourceNotFoundException("Workspace não encontrado!"));
    workspace.validateOwnership(userIdLogado);

    // Buscar o usuário para verificar o plano (Free ou Premium)
    User user = userPort.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));

    WorkspaceWriteGuard guard = workspaceWriteGuard != null
        ? workspaceWriteGuard
        : new WorkspaceWriteGuard(workspacePort, userPort, port);
    guard.assertWorkspaceWritable(
        user,
        command.workspaceId(),
        "Este ambiente está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para criar listas nele!");

    // Define o limite absoluto: 6 para Premium, 4 para Free
    int limit = user.isPremium() ? 6 : 4;
    
    // Conta TODAS as listas criadas, visíveis ou não
    int currentCount = port.countByWorkspaceId(command.workspaceId());
    
    if (currentCount >= limit) {
        throw new LimitExceededException(
            "Limite de " + limit + " listas por ambiente atingido. " +
            (user.isPremium() ? "Você já atingiu o teto máximo." : "Assine o plano Premium para criar até 6 listas!")
        );
    }

    // Descobre qual é o maior índice atual desse quadro
    int maxIndex = port.getMaxOrderIndex(command.workspaceId());
    int newIndex = maxIndex + 1;

    if (command.orderIndex() != null && command.orderIndex() >= 0 && command.orderIndex() <= maxIndex) {
      newIndex = command.orderIndex();
      List<BoardColumn> existingColumns = port.findAllByWorkspaceId(command.workspaceId());
      for (BoardColumn col : existingColumns) {
        if (col.getOrderIndex() >= newIndex) {
          col.setOrderIndex(col.getOrderIndex() + 1);
        }
      }
      port.reorderAll(existingColumns);
    }

    // LÓGICA DE UX: Se já existem 4 ou mais listas, a nova vai direto pra mochila (false)
    boolean isDefaultVisible = currentCount < 4;

    BoardColumn newBoardColumn = new BoardColumn(
        UUID.randomUUID(),
        userIdLogado,
        command.workspaceId(),
        command.name(),
        newIndex,
        command.icon(),
        isDefaultVisible
    );

    return port.save(newBoardColumn);
  }
}
