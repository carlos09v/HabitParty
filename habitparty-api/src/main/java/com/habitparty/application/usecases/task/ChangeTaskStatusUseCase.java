package com.habitparty.application.usecases.task;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.in.web.dtos.response.TaskResponseDTO;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Task.TaskReward;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class ChangeTaskStatusUseCase {
    private final TaskRepository taskPort;
    private final TransactionHistoryRepository transactionPort;
    private final UserRepository userPort;

    public ChangeTaskStatusUseCase(TaskRepository taskPort, TransactionHistoryRepository transactionPort,
            UserRepository userPort) {
        this.taskPort = taskPort;
        this.transactionPort = transactionPort;
        this.userPort = userPort;
    }

    @Transactional // Garante que se a transação falhar, a tarefa não fica completa no banco
    public TaskResponseDTO execute(UUID taskId, UUID userIdLogado, TaskStatus newStatus) {
        Task task = taskPort.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada."));
        task.validateOwnership(userIdLogado);

        // 2. Só gera extrato se o status realmente mudou para COMPLETED (evita cliques duplos)
        if (newStatus == TaskStatus.COMPLETED && task.getStatus() != TaskStatus.COMPLETED) {
            // O Domínio da Tarefa calcula quanto ela vale (ex: baseado na Dificuldade)
            TaskReward reward = task.calculateReward();

            // Atualiza o usuário e checa a ofensiva
            User user = userPort.findById(userIdLogado)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
            user.addXp(reward.xp());
            user.addCoins(reward.coins());

            int tasksCompletedToday = transactionPort.countCompletedTasksToday(userIdLogado);
            if (tasksCompletedToday == 1) {
                user.incrementStreak();
            }

            userPort.save(user); // Salva o usuário com o XP, Dinheiro e Streak atualizados

            // Cria o registro do extrato
            TransactionHistory transaction = new TransactionHistory(
                    null,
                    userIdLogado, 
                    task.getId(), // referenceId
                    reward.coins(),
                    reward.xp(),
                    null,
                    TransactionType.TASK_COMPLETED, // transactionType
                    task.getName(), 
                    null, 
                    null,
                    task.getDifficulty(),
                    task.getTags(),
                    null
            );

            // Salva no extrato
            transactionPort.save(transaction);

            // Se for Hábito ou Daily, o domínio também aumenta a ofensiva (streak) aqui!
            task.registerCompletion();
        }

        // 3. Atualiza o status no Domínio
        task.changeStatus(newStatus);

        // 4. Salva a tarefa atualizada
        Task savedTask = taskPort.save(task);

        return TaskResponseDTO.fromDomain(savedTask);
    }

}
