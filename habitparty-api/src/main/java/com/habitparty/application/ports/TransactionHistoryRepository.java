package com.habitparty.application.ports;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;

import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.enums.TransactionType;

public interface TransactionHistoryRepository {
  // 1. Para salvar um novo registro (Usado silenciosamente por outros UseCases)
  void save(TransactionHistory transaction);

  // Busca paginada de todo o histórico do usuário
  Page<TransactionHistory> findAllByUserId(UUID userId, int page, int size);

  // Busca paginada filtrada pelos tipos de transação (Usado para as abas)
  Page<TransactionHistory> findAllByUserIdAndTypes(UUID userId, List<TransactionType> types, int page, int size);

  // Busca paginada filtrada flexível (tipos, período/data inicial, busca textual)
  Page<TransactionHistory> findFiltered(UUID userId, List<TransactionType> types, LocalDateTime startDate, String search, int page, int size);

  // 3. Para deletar um registro específico (Seu botão futuro)
  void deleteById(UUID id);

  // 4. Buscar um específico (necessário para validar o Ownership antes de deletar)
  Optional<TransactionHistory> findById(UUID id);

  // Pra validar o incrementStreak do user
  int countCompletedTasksToday(UUID userId);

  // Verifica se o usuário completou pelo menos 1 tarefa ontem (evita manter streak vencido)
  default boolean hasCompletedTasksYesterday(UUID userId) {
    return true;
  }

  void deleteAllByUserId(UUID userId);

  // Exclusão em lote (apenas registros pertencentes ao usuário). Retorna a quantidade removida.
  int deleteAllByIdsAndUserId(List<UUID> ids, UUID userId);

  // Remove todos os registros vinculados a uma origem (Task, Reward, FocusRecord) do usuário
  void deleteAllByReferenceIdAndUserId(UUID referenceId, UUID userId);

  // Remove todos os registros vinculados a várias origens do usuário
  void deleteAllByReferenceIdsAndUserId(List<UUID> referenceIds, UUID userId);
}
