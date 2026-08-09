package com.habitparty.core.domain.enums;

// A referência é uma tarefa Média (15 XP).
public enum UserLevel {
  // 0 tarefas
  NOVICE("Novato", 0),

  // ~7 tarefas médias (Alcançável no 1º ou 2º dia de uso)
  APPRENTICE("Aprendiz", 100),

  // ~20 tarefas médias (Alcançável na 1ª semana)
  ADVENTURER("Aventureiro", 300),

  // ~50 tarefas médias (Alcançável em 2 a 3 semanas)
  CHALLENGER("Desafiante", 750),

  // ~100 tarefas médias (Alcançável em 1 mês de uso consistente)
  AMATEUR("Amador", 1500),

  // Daqui pra frente o jogo fica sério (Múltiplos meses)
  PROFESSIONAL("Profissional", 3000),
  EXPERT("Especialista", 6000),
  VETERAN("Veterano", 12000),
  MASTER("Mestre", 25000),

  // O objetivo final (Mais de 1 ano de disciplina diária)
  LEGEND("Lenda", 60000);

  private final String title;
  private final int minXpRequired;

  UserLevel(String title, int minXpRequired) {
    this.title = title;
    this.minXpRequired = minXpRequired;
  }

  public String getTitle() {
    return title;
  }

  public int getMinXpRequired() {
    return minXpRequired;
  }

  // Método que descobre o nível baseado no XP
  public static UserLevel calculateLevel(int totalXp) {
    UserLevel currentLevel = NOVICE;
    for (UserLevel level : values()) {
      if (totalXp >= level.getMinXpRequired()) {
        currentLevel = level;
      }
    }
    return currentLevel;
  }

  // Método para descobrir o próximo nível (útil para a barra de progresso)
  public UserLevel getNextLevel() {
    int nextOrdinal = this.ordinal() + 1;
    if (nextOrdinal < values().length) {
      return values()[nextOrdinal];
    }
    return this; // Se já for Lenda, o próximo nível é ele mesmo
  }
}