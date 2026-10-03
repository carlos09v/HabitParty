package com.habitparty.application.usecases.board_column;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.CreateBoardColumnDTO;
import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class CreateBoardColumnUseCase {
  private final WorkspaceRepository workspacePort;
  private final UserRepository userPort;
  private final BoardColumnRepository port;

  public CreateBoardColumnUseCase(WorkspaceRepository workspacePort, BoardColumnRepository port, UserRepository userPort) {
    this.workspacePort = workspacePort;
    this.port = port;
    this.userPort = userPort;
  }

  public BoardColumn execute(CreateBoardColumnDTO dto, UUID userIdLogado) {
   // Verificar se o workspace existe e validar posse
    Workspace workspace = workspacePort.findById(dto.workspaceId())
        .orElseThrow(() -> new ResourceNotFoundException("Workspace não encontrado!"));
    workspace.validateOwnership(userIdLogado);

    // Buscar o usuário para verificar o plano (Free ou Premium)
    User user = userPort.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));

    // Define o limite absoluto: 6 para Premium, 4 para Free
    int limit = user.isPremium() ? 6 : 4;
    
    // Conta TODAS as listas criadas, visíveis ou não
    int currentCount = port.countByWorkspaceId(dto.workspaceId());
    
    if (currentCount >= limit) {
        throw new LimitExceededException(
            "Limite de " + limit + " listas por ambiente atingido. " +
            (user.isPremium() ? "Você já atingiu o teto máximo." : "Assine o plano Premium para criar até 6 listas!")
        );
    }

    // Descobre qual é o maior índice atual desse quadro
    int maxIndex = port.getMaxOrderIndex(dto.workspaceId());
    int newIndex = maxIndex + 1;

    // LÓGICA DE UX: Se já existem 4 ou mais listas, a nova vai direto pra mochila (false)
    boolean isDefaultVisible = currentCount < 4;

    BoardColumn newBoardColumn = new BoardColumn(
        UUID.randomUUID(),
        userIdLogado,
        dto.workspaceId(),
        dto.name(),
        newIndex,
        dto.icon(),
        isDefaultVisible
    );

    return port.save(newBoardColumn);
  }
}
