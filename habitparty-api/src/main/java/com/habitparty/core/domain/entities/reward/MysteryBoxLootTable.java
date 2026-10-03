package com.habitparty.core.domain.entities.reward;

import java.util.concurrent.ThreadLocalRandom;

import com.habitparty.core.domain.enums.RewardPackageLevel;

public class MysteryBoxLootTable {
    // Método estático para ser chamado direto, sem precisar instanciar a classe
    public static MysteryBoxResult roll(RewardPackageLevel level) {
        
        int roll = ThreadLocalRandom.current().nextInt(1, 101);

        return switch (level) {
            case BASIC -> {
                if (roll <= 60) yield new MysteryBoxResult("Pausa Curta", "coffee", null);
                if (roll <= 90) yield new MysteryBoxResult("Prática de Violão", "music", 30);
                yield new MysteryBoxResult("Leitura Produtiva", "book", 45);
            }
            case PREMIUM -> {
                if (roll <= 40) yield new MysteryBoxResult("Tempo Livre", "smile", null);
                if (roll <= 80) yield new MysteryBoxResult("Sessão de Videogame", "gamepad", 60);
                yield new MysteryBoxResult("Capítulo de FNAF", "book_open", null);
            }
            case EPIC -> {
                if (roll <= 50) yield new MysteryBoxResult("Tempo de Foco Flexível", "timer", 60);
                if (roll <= 90) yield new MysteryBoxResult("Passe Livre (Noite)", "ticket", null);
                yield new MysteryBoxResult("Tarde de Jogos", "trophy", 120);
            }
            case LEGENDARY -> {
                if (roll <= 70) yield new MysteryBoxResult("Fim de Tarde Livre", "star", 120);
                yield new MysteryBoxResult("Day Off Absoluto", "gem", 240);
            }
            default -> new MysteryBoxResult("Prêmio Misterioso", "question_mark", null);
        };
    }
}