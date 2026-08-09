# 👥 HabitParty (Motor de Produtividade Gamificado)

Um sistema open-core de gamificação e produtividade com uma economia matemática rígida na aquisição de moedas, mas flexível e amigável nas recompensas. O HabitParty foi construído para aumentar sua produtividade, garantindo que o esforço real do usuário seja convertido em valor exato para resgatar suas próprias recompensas na vida real.

É um sistema baseado primariamente na sua honestidade e comprometimento!

## ✨ Features Principais

*   **Gestão de Tarefas:** Separação clara do fluxo de trabalho em Hábitos, Tarefas Diárias (Dailies) e Afazeres (To-Dos).
*   **Economia Rígida (Farming):** Os ganhos de moedas (ouro 🪙) são calculados estritamente com base no nível de dificuldade da tarefa (🟩Muito Fácil, 🟦Fácil, 🟨Médio, 🟥Difícil). Os valores de recompensa padrão podem ser customizados de acordo com a sua preferência.
*   **Recompensas Customizadas (Tags/Pacotes):** O usuário define o valor de suas próprias recompensas de lazer, categorizando-as em pacotes (ex: Basic, Premium, Premium Plus) que aumentam o tempo/qualidade da recompensa proporcionalmente ao custo.
    *   *Exemplo:* Assistir Vídeos (45min) - Basic custa 6 moedas.
    *   *Exemplo:* Assistir Vídeos (2h 30min) - Premium Plus custa 15 moedas.
    *   *Exemplo:* Jogar Video Game (30min) - Basic custa 6 moedas.
*   **🎁 Caixas Misteriosas (RNG Opcional):** É possível criar recompensas que dependam de **RNG** (*Random Number Generation*, a sorte). Você pode comprar uma **Caixa Misteriosa** no sistema que "rolará um dado" para escolher uma recompensa de uma lista pré-definida (baseada nas raridades: Comum, Raro, Épico e Lendário).
*   **Ferramentas de Foco:** Pomodoro e Cronômetro nativos integrados ao fluxo mental de blocos de estudo.

## 🎮 Motor de Gamificação (Economia e Progressão)

O sistema de progressão é baseado na conquista de Pontos de Experiência (XP), obtidos através da conclusão de tarefas. A curva de evolução foi desenhada para ser exponencial: níveis iniciais garantem vitórias rápidas para engajamento, enquanto níveis avançados exigem consistência de longo prazo.

### 📊 Dificuldade das Tarefas e Recompensas (XP)

A quantidade de XP recebida reflete a carga cognitiva e o tempo investido em cada atividade:

| Dificuldade | Ganho | Descrição e Exemplos de Uso |
| :--- | :--- | :--- |
| **Trivial** | 2 XP | Tarefas automáticas e de curtíssima duração. <br>*Ex: Beber água, alongamento rápido.* |
| **Fácil** | 5 XP | Tarefas rápidas que exigem intenção e organização. <br>*Ex: Revisar anotações no Obsidian ou Anki, planejar o dia, praticar violão.* |
| **Médio** | 15 XP | A base da economia. Exige foco moderado (30 a 60 minutos). <br>*Ex: Resolver uma bateria de 30 questões.* |
| **Difícil** | 30 XP | Esforço cognitivo intenso (1 a 2 horas de trabalho profundo). <br>*Ex: Bloco de estudo aprofundado em Direito ou TI, manutenção complexa de hardware.* |
| **Muito Difícil** | 75 XP | Marcos importantes, simulados exaustivos ou entregas de grande impacto. <br>*Ex: Simulado completo focado no edital do Bacen.* |

---

### 🏆 Níveis de Usuário (`UserLevel`)

A progressão do usuário acompanha o acúmulo total de XP (`totalXp`). O cálculo não consome o XP atual (o XP é vitalício).

| Nível (EN / PT-BR) | XP Necessário | Esforço Estimado |
| :--- | :--- | :--- |
| `NOVICE` (Novato) | 0 XP | Ponto de partida. |
| `APPRENTICE` (Aprendiz) | 100 XP | ~7 tarefas médias (Alcançável no 1º ou 2º dia). |
| `ADVENTURER` (Aventureiro) | 300 XP | ~20 tarefas médias (Alcançável na 1ª semana). |
| `CHALLENGER` (Desafiante) | 750 XP | ~50 tarefas médias (Alcançável em 2 a 3 semanas). |
| `AMATEUR` (Amador) | 1.500 XP | ~100 tarefas médias (Alcançável em 1 mês de uso). |
| `PROFESSIONAL` (Profissional) | 3.000 XP | Exige consistência trimestral. |
| `EXPERT` (Especialista) | 6.000 XP | Usuário focado de médio/longo prazo. |
| `VETERAN` (Veterano) | 12.000 XP | Alta maturidade no sistema. |
| `MASTER` (Mestre) | 25.000 XP | Mais de 1.600 tarefas médias concluídas. |
| `LEGEND` (Lenda) | 60.000 XP | O objetivo final. Exige mais de 1 ano de disciplina rígida e diária. |

## 🛠️ Stack Tecnológico e Arquitetura

O sistema foi desenhado visando escalabilidade, resiliência e boas práticas de Clean Code.

*   **Backend:** Java com Spring Boot (Microsserviços).
*   **Arquitetura:** Arquitetura Hexagonal (Ports and Adapters) isolando as regras matemáticas da economia.
*   **Design Patterns Aplicados:** 
    *   *Strategy:* Para o cálculo de recompensas baseado em dificuldade e tipo de tarefa.
    *   *Factory Method:* Para a instanciação polimórfica das tarefas.
    *   *Observer:* Desacoplamento de eventos via mensageria.
*   **Bancos de Dados:** PostgreSQL (Relacional principal) e Redis (Cache de consultas pesadas e Dashboards analíticos).
*   **Mensageria:** RabbitMQ para comunicação assíncrona orientada a eventos.
*   **Segurança:** Spring Security com autenticação stateless via JWT.
*   **Documentação da API:** Swagger (OpenAPI 3.0) para testes interativos e contratos visuais da API REST.
*   **Infraestrutura e DevOps:** Docker Compose (orquestração local), SonarQube (SAST/Análise de qualidade) e GitHub Actions (CI/CD).
*   **Frontend:** React configurado como PWA (Progressive Web App) para funcionamento offline e mobile-first.

## 🎯 Propósito do Projeto

O HabitParty tem dois objetivos principais:

1. Ser uma ferramenta pessoal de alta performance para estudo e produtividade.
2. Servir como laboratório prático de arquitetura e engenharia de software.

## 🗺️ Roadmap
*   **👥 Social & Parties (Em Breve):** Formação de grupos ("Parties") com chat integrado.
*   **Challenges (Em Breve):** Desafios temáticos de alta recompensa (focados em Estudo, Saúde, etc.) que podem ser executados solo ou exigem o aceite e a cooperação de toda a Party.

## 📄 Licença

**Copyright (c) 2026 Carlos Vinicius / HabitParty**

O código-fonte deste projeto é disponibilizado publicamente ("Source-Available") com o propósito de transparência, estudo e uso pessoal. É **estritamente proibido** o uso, distribuição, cópia ou modificação deste software para qualquer fim comercial, monetização ou oferta como serviço (SaaS) por terceiros.

Para visualizar as regras completas de uso pessoal, consulte o arquivo `LICENSE` na raiz deste repositório.
