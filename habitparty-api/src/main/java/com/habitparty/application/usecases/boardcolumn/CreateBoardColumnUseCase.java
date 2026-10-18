package com.habitparty.application.usecases.boardcolumn;

import java.util.List;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
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

  public CreateBoardColumnUseCase(WorkspaceRepository workspacePort, BoardColumnRepository port, UserRepository userPort) {
    this.workspacePort = workspacePort;
    this.port = port;
    this.userPort = userPort;
  }

  public BoardColumn execute(CreateBoardColumnCommand command, UUID userIdLogado) {
   // Verificar se o workspace existe e validar posse
    Workspace workspace = workspacePort.findById(command.workspaceId())
        .orElseThrow(() -> new ResourceNotFoundException("Workspace não encontrado!"));
    workspace.validateOwnership(userIdLogado);

    // Buscar o usuário para verificar o plano (Free ou Premium)
    User user = userPort.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));

    // Validação de Modo Somente-Leitura em Ambientes excedentes no plano Free (máx. 2 ambientes ativos)
    if (!user.isPremium()) {
      List<Workspace> userWorkspaces = workspacePort.findAllByUserId(userIdLogado);
      int wsIndex = -1;
      for (int i = 0; i < userWorkspaces.size(); i++) {
        if (userWorkspaces.get(i).getId().equals(command.workspaceId())) {
          wsIndex = i;
          break;
        }
      }
      if (wsIndex >= 2) {
        throw new LimitExceededException(
            "Este ambiente está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para criar listas nele!"
        );
      }
    }

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
