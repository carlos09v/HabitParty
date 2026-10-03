# 👥 HabitParty (Motor de Produtividade Gamificado)

Um sistema open-core de gamificação e produtividade com uma economia matemática rígida na aquisição de moedas, mas flexível e amigável nas recompensas. O HabitParty foi construído para aumentar sua produtividade, garantindo que o esforço real do usuário seja convertido em valor exato para resgatar suas próprias recompensas na vida real.

É um sistema baseado primariamente na sua honestidade e comprometimento!

## ✨ Features Principais

*   **Gestão de Tarefas:** Separação clara do fluxo de trabalho em Hábitos, Tarefas Diárias (Dailies) e Afazeres (To-Dos).
*   **Economia Rígida (Farming):** Os ganhos de moedas (ouro 🪙) são calculados estritamente com base no nível de dificuldade da tarefa (🟩 Muito Fácil (Trivial), 🟦 Fácil, 🟨 Médio, 🟧 Difícil, 🟪 Muito Difícil). Os valores de recompensa padrão podem ser customizados de acordo com a sua preferência.
*   **Recompensas Customizadas (Tags/Pacotes):** O usuário define o valor de suas próprias recompensas de lazer, categorizando-as em pacotes (ex: Basic, Premium, Premium Plus) que aumentam o tempo/qualidade da recompensa proporcionalmente ao custo.
    *   *Exemplo:* Assistir Vídeos (45min) - Basic custa 6 moedas.
    *   *Exemplo:* Assistir Vídeos (2h 30min) - Premium Plus custa 15 moedas.
    *   *Exemplo:* Jogar Video Game (30min) - Basic custa 6 moedas.
*   **🎁 Caixas Misteriosas (RNG Opcional):** É possível criar recompensas que dependam de **RNG** (*Random Number Generation*, a sorte). Você pode comprar uma **Caixa Misteriosa** no sistema que "rolará um dado" para escolher uma recompensa de uma lista pré-definida (baseada nas raridades: Comum, Raro, Épico e Lendário).
*   **Ferramentas de Foco:** Pomodoro e Cronômetro nativos integrados ao fluxo mental de blocos de estudo.

## 🎮 Motor de Gamificação (Economia e Progressão)

O sistema de progressão é baseado na conquista de Pontos de Experiência (XP), obtidos através da conclusão de tarefas. A curva de evolução foi desenhada para ser exponencial: níveis iniciais garantem vitórias rápidas para engajamento, enquanto níveis avançados exigem consistência de longo prazo.

### 📊 Dificuldade das Tarefas e Recompensas (XP e Moedas)

A quantidade de XP e Moedas recebidas reflete a carga de esforço e o tempo investido em cada atividade:

| Nível | Dificuldade | Ganho | Descrição e Exemplos de Uso |
| :--- | :--- | :--- | :--- |
| 🟩 | **Trivial** | 2 XP <br> 0,25 🪙 | Tarefas automáticas e de curtíssima duração. <br>*Ex: Beber água, tomar um remédio, arrumar a cama.* |
| 🟦 | **Fácil** | 5 XP <br> 0,75 🪙 | Tarefas rápidas que exigem intenção ou organização básica. <br>*Ex: Responder e-mails, leitura de 10 minutos, lavar a louça.* |
| 🟨 | **Médio** (Padrão) | 15 XP <br> 2,50 🪙 | A base da economia. Exige foco moderado (30 a 60 minutos). <br>*Ex: Treino na academia, focar em uma tarefa do trabalho, limpar a casa.* |
| 🟧 | **Difícil** | 30 XP <br> 5,00 🪙 | Esforço físico ou cognitivo intenso (1 a 2 horas de trabalho profundo). <br>*Ex: Sessão de estudo focada, trabalho complexo de programação, projeto criativo longo.* |

O usuário pode alterar esses valores conforme desejar. O sistema atuará de forma inteligente alertando sobre essa alteração:
*"Atenção: Esse valor está fora da curva recomendada e pode desbalancear a economia do seu aplicativo, reduzindo a sensação de conquista. Deseja manter mesmo assim?"*

### Hábitos: Importância e Decaimento de Recompensas
Diferente das Tarefas (Todo/Daily) que possuem "Dificuldade", os Hábitos são medidos pela sua **Importância**. O objetivo de um hábito é a automação cerebral. Quando você repete um comportamento muitas vezes, ele passa a exigir menos esforço cognitivo.

Para refletir isso na economia e evitar a inflação de moedas, os hábitos sofrem um **decaimento de recompensa** conforme a sua ofensiva (*streak*) aumenta. Se a ofensiva for quebrada (**reset**), a recompensa volta ao valor máximo.

| Nível | Recompensa Base (Streak Inicial) | Descrição e Exemplos de Uso |
| :--- | :--- | :--- |
| 🟩 **Low** (Baixa) | 5 XP <br> 0,75 🪙 | Hábitos de manutenção simples e rápida. <br>*Ex: Tomar a dose diária de creatina, arrumar a mesa.* |
| 🟨 **Normal** (Padrão) | 10 XP <br> 1,75 🪙 | A base da formação de rotina. Esforço moderado. <br>*Ex: Praticar escalas no violão por 15 min, ler 10 páginas.* |
| 🟧 **High** (Alta) | 25 XP <br> 3,75 🪙 | Hábitos transformadores que exigem alta energia de ativação. <br>*Ex: Resolver 30 questões de Direito/Geografia para provas, ir à academia.* |

#### Tabela de Decaimento (Exemplo Prático)
A recompensa base é paga integralmente nos primeiros dias. Conforme o hábito se solidifica, o sistema paga menos, incentivando o usuário a buscar novos desafios para manter a renda alta.

* Dias 1 a 6 (Fase de Resistência): 100% da Recompensa.
* Dias 7 a 20 (Fase de Adaptação): 75% da Recompensa.
* Dias 21+ (Hábito Formado): 50% da Recompensa.

### 🛒 Exemplo de Loja de Recompensas (Economia Balanceada)

Para manter a motivação alta, os preços da sua loja devem ser proporcionais ao seu esforço diário. Se você ganha em média 60 a 80 moedas em um dia produtivo, sua loja pode seguir este padrão:

| Recompensa | Custo | Tipo | Descrição |
| :--- | :--- | :--- | :--- |
| **Pausa para o Café** | 3,75 🪙 | Tempo (15 min) | Uma pausa rápida e sem culpa no meio do expediente. |
| **Episódio de Série** | 7,50 🪙 | Uso Único | Assistir a um episódio daquela série no streaming. |
| **Sessão de Jogos** | 40 🪙 | Tempo (1h) | Tempo liberado para jogar no PC ou console. |
| **Noite da Pizza** | 25,00 🪙 | Uso Único | Pedir um delivery no fim de semana. |
| **Comprar um Livro/Jogo** | 62,50 🪙 | Uso Único | Recompensa de longo prazo para adquirir um item real desejado. |
| **Caixa Misteriosa Épica** | 100 🪙 | Sorteio | Pode conter prêmios de alto valor ou tempos estendidos! |

### 🎁 Caixas Misteriosas (Recompensas Variáveis)

Ao invés de uma recompensa fixa, o sistema realiza um sorteio no momento da compra, oferecendo a chance de ganhar prêmios muito superiores ao valor investido.

| Pacote | Custo | Distribuição de Prêmios e Chances |
| :--- | :--- | :--- |
| 📦 **Basic** | 3,75 🪙 | **60%** Prêmio Comum (Ex: Pausa de 15min) <br> **30%** Prêmio Bom (Ex: 30min de Vídeos) <br> **10%** Prêmio Raro (Ex: Episódio de Série) |
| 🎁 **Premium** | 10,00 🪙 | **40%** Prêmio Comum <br> **40%** Prêmio Bom <br> **20%** Prêmio Épico (Ex: Sessão de Jogos de 1h) |
| 💎 **Epic** | 25,00 🪙 | **50%** Prêmio Bom <br> **40%** Prêmio Épico <br> **10%** Prêmio Lendário (Ex: Comprar um livro/jogo) |
| 👑 **Legendary** | 62,50 🪙 | **70%** Prêmio Épico <br> **30%** O Santo Graal (Ex: Day Off, Fim de Semana Livre) |

*Nota: Os prêmios dentro de cada categoria são personalizáveis pelo usuário, permitindo que a "Tabela de Saque" (Loot Table) se adapte à realidade e aos interesses de cada pessoa.*

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

---

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

# 🚀 Como rodar o projeto

### 1. Subindo o Banco de Dados (Docker)
O projeto utiliza o Docker Compose para gerenciar o banco de dados PostgreSQL.

*   **Para criar e rodar os containers em segundo plano (com build):**
    ```bash
    docker compose up -d --build
    ```
    *(O parâmetro `-d` roda em modo "detached" liberando o seu terminal, e o `--build` garante que qualquer alteração nas dependências/imagens seja aplicada).*

*   **Para parar e remover os containers:**
    ```bash
    docker compose down
    ```

*   **Para iniciar o container:**
    docker compose start

*   **Para parar, remover os containers E apagar os dados do banco (Reset total):**
    ```bash
    docker compose down -v
    ```

*   **Para ver quanto o espaço que o docker esta usando no disco:**
    docker system df

*   **Para ver os containers rodando:**
    ```bash
    docker ps
    docker ps -a
    ```

### 2. Rodando o Servidor Spring Boot
Com o banco de dados rodando, você pode iniciar a API.

*   **Via terminal (usando Maven):**
    ```bash
    ./mvnw spring-boot:run
    ```
    *(No Windows, use apenas `mvnw spring-boot:run` ou `mvn spring-boot:run` se tiver o Maven instalado globalmente).*

*   **Via IDE (VS Code / IntelliJ):**
    Basta localizar a classe principal do projeto (geralmente `HabitpartyApiApplication.java` ou similar) e clicar no botão **Run** ou **Debug**.

---
**Acessando a Documentação (Swagger):**
Com o servidor no ar, acesse: `http://localhost:8080/swagger-ui.html`

**Pegando o Json dos endpoints (Swagger) para importar em algum Http Request Software compativel (usei o Bruno):**
Com o servidor no ar, acesse: `http://localhost:8080/v3/api-docs`

---
#### 2.1 Variáveis de Ambiente (.env)
Se o seu projeto depende de variáveis de ambiente configuradas localmente, você precisa carregá-las no terminal antes de iniciar a aplicação. 

Certifique-se de ter um arquivo `.env` na raiz do projeto e execute o comando abaixo no terminal:

```bash
set -a && source .env && set +a
```

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
