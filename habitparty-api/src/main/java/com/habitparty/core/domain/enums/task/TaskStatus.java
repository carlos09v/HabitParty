package com.habitparty.core.domain.enums.task;

public enum TaskStatus {
    PENDING("Pendente", false),
    IN_PROGRESS("Em Andamento", false), // Ótimo para Kanban
    COMPLETED("Concluída", true),       // Tarefa feita (Gera XP/Moedas)
    FAILED("Falhou", true),             // Daily/Habit que o usuário perdeu (Pode tirar HP no futuro)
    CANCELED("Cancelada", true);        // Usuário desistiu sem penalidades

    private final String description;
    private final boolean isTerminal;

    TaskStatus(String description, boolean isTerminal) {
        this.description = description;
        this.isTerminal = isTerminal;
    }

    public String getDescription() {
        return description;
    }

    public boolean isTerminal() {
        return isTerminal;
    }
}
