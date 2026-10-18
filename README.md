# 👥 HabitParty (Motor de Produtividade Gamificado)

Um sistema open-core de gamificação e produtividade com uma economia matemática rígida na aquisição de moedas, mas flexível e amigável nas recompensas. O HabitParty foi construído para aumentar sua produtividade, garantindo que o esforço real do usuário seja convertido em valor exato para resgatar suas próprias recompensas na vida real.

> **Filosofia central:** É um sistema baseado primariamente na sua honestidade e comprometimento! Não há como burlar a si mesmo: cada conquista gera satisfação genuína e descanso sem culpa.

---

## ✨ Funcionalidades Principais

* **Gestão de Rotina Completa:** Separação clara do fluxo de trabalho em **Hábitos** (com ofensivas/streak e decaimento biológico), **Tarefas Diárias** (*Dailies* com agendamento por dias da semana) e **Afazeres** (*To-Dos* com checklists de subtarefas e prazos).
* **Economia Rígida (Farming):** Ganhos de moedas (ouro 🪙) e XP calculados estritamente com base na dificuldade da tarefa:
  * 🟩 **Trivial** (0,25 🪙 • 2 XP)
  * 🟦 **Fácil** (0,75 🪙 • 5 XP)
  * 🟨 **Médio** (2,50 🪙 • 15 XP)
  * 🟧 **Difícil** (5,00 🪙 • 30 XP)
* **Quadro Kanban & Múltiplos Ambientes (Workspaces):** Organize diferentes áreas da sua vida (Trabalho, Estudos, Vida Pessoal) em ambientes independentes, com quadros Kanban interativos e colunas personalizáveis.
* **Loja de Recompensas da Vida Real:** Cadastre momentos de lazer e descanso categorizados em pacotes (Uso Único, Por Tempo ou Caixas da Sorte) com custos calibrados para o esforço do seu dia.
* **🎁 Caixas Misteriosas (RNG Opcional):** Sorteios probabilísticos com custos calculados matematicamente (Básica, Premium, Épica e Lendária) para trazer dopamina à sua rotina sem quebrar a economia.
* **🎒 Mochila de Inventário:** Todos os itens comprados ficam guardados na sua mochila para serem consumidos no momento ideal ou vinculados a uma sessão de descanso cronometrada.
* **⏱️ Palco de Foco (Pomodoro & Cronômetro):** Ferramenta nativa de imersão com rendimento decrescente diário (*daily soft cap* de até 6h), salvaguardas anti-AFK (teto de 90 min) e trava de lazer (itens de mochila não geram moeda).
* **👑 Personalização VIP & Sons Ambientes:** Molduras animadas cósmicas para avatar, sons ambientes relaxantes sintetizados nativamente no navegador via Web Audio API (Chuva Suave, Cafeteria, Lofi Zen e Fogueira) e pacote exclusivo de ícones VIP.
* **🛡️ Painel Administrativo & Telemetria (`/admin`):** Módulo exclusivo para administradores (`ROLE_ADMIN`) com telemetria em tempo real da cota de e-mails no **Resend**, volume global de tarefas, estimativa da pegada de armazenamento do PostgreSQL por usuário, governança de papéis e histórico de logs de auditoria de disparos (`EmailDispatchLog`).
* **✉️ Notificações e Lembretes por E-mail (Resend):** Disparo automatizado de lembretes para tarefas com prazo próximo e recuperação de conta segura, com travas de cota por usuário para prevenir abusos.
* **🔑 Autenticação Híbrida & Segurança:** Suporte nativo a login social via **Google OAuth 2.0** e fluxo tradicional via e-mail e senha com JWT stateless, Refresh Tokens, BCrypt e controle de acesso baseado em papéis (RBAC).
* **📊 Auditoria & Exportação de Dados (CSV):** Histórico detalhado de produtividade diária e possibilidade de exportar todo o extrato financeiro de transações (moedas, XP e compras) para planilhas.

---

## 🎮 Motor de Gamificação (Economia e Progressão)

O sistema de progressão é baseado na conquista de Pontos de Experiência (XP), obtidos através da conclusão de tarefas. A curva de evolução foi desenhada para ser exponencial: níveis iniciais garantem vitórias rápidas para engajamento, enquanto níveis avançados exigem consistência de longo prazo.

### 📊 Dificuldade das Tarefas e Recompensas (XP e Moedas)

A quantidade de XP e Moedas recebidas reflete a carga de esforço e o tempo investido em cada atividade:

| Nível | Dificuldade | Ganho | Descrição e Exemplos de Uso |
| :---: | :--- | :--- | :--- |
| 🟩 | **Trivial** | 2 XP <br> 0,25 🪙 | Tarefas automáticas e de curtíssima duração. <br>*Ex: Beber água, tomar um remédio, arrumar a cama.* |
| 🟦 | **Fácil** | 5 XP <br> 0,75 🪙 | Tarefas rápidas que exigem intenção ou organização básica. <br>*Ex: Responder e-mails, leitura de 10 minutos, lavar a louça.* |
| 🟨 | **Médio** (Padrão) | 15 XP <br> 2,50 🪙 | A base da economia. Exige foco moderado (30 a 60 minutos). <br>*Ex: Treino na academia, focar em uma tarefa do trabalho, limpar a casa.* |
| 🟧 | **Difícil** | 30 XP <br> 5,00 🪙 | Esforço físico ou cognitivo intenso (1 a 2 horas de trabalho profundo). <br>*Ex: Sessão de estudo focada, desenvolvimento de módulo complexo.* |

---

### 🔄 Hábitos: Importância e Decaimento de Recompensas

Diferente das Tarefas (Todo/Daily) que possuem "Dificuldade", os Hábitos são medidos pela sua **Importância** (Baixa, Normal, Alta). O objetivo de um hábito é a automação cerebral: quando você repete um comportamento muitas vezes, ele exige menos energia cognitiva.

Para refletir isso na economia e evitar a inflação de moedas, os hábitos sofrem um **decaimento de recompensa** conforme a sua ofensiva (*streak*) avança. Caso a sequência seja quebrada, a ofensiva reseta e a recompensa volta a 100%.

| Nível | Recompensa Base (Streak Inicial) | Descrição e Exemplos de Uso |
| :--- | :---: | :--- |
| 🟩 **Baixa (Low)** | 5 XP • 0,75 🪙 | Hábitos de manutenção simples e rápida. <br>*Ex: Tomar creatina, arrumar a mesa de trabalho.* |
| 🟨 **Normal** (Padrão) | 10 XP • 1,75 🪙 | A base da rotina com esforço moderado. <br>*Ex: Praticar instrumento musical por 15 min, ler 10 páginas.* |
| 🟧 **Alta (High)** | 25 XP • 3,75 🪙 | Hábitos de alta energia de ativação. <br>*Ex: Resolver 30 questões de concurso, treino físico pesado.* |

#### Tabela de Decaimento por Ofensiva (Streak)
* **Dias 1 a 6 (Fase de Resistência):** 100% da Recompensa (estímulo máximo para vencer a inércia).
* **Dias 7 a 20 (Fase de Adaptação):** 75% da Recompensa (consolidação de rotina).
* **Dias 21+ (Hábito Formado):** 50% da Recompensa (hábito automatizado; incentivo para buscar novos desafios).

---

### 🛒 Exemplo de Loja de Recompensas (Economia Balanceada)

Para manter a motivação sustentável, os custos devem ser equilibrados com o rendimento diário. Em um dia produtivo típico gerando de 60 a 80 moedas, a loja pode ser estruturada assim:

| Recompensa | Custo | Tipo | Proposta |
| :--- | :---: | :--- | :--- |
| **Pausa para o Café** | 3,75 🪙 | Tempo (15 min) | Pausa rápida e sem culpa no meio do expediente. |
| **Episódio de Série** | 7,50 🪙 | Uso Único | Assistir a um episódio de série no streaming. |
| **Sessão de Jogos** | 15,00 🪙 | Tempo (1h) | Tempo livre liberado para jogar no PC ou console. |
| **Noite da Pizza** | 25,00 🪙 | Uso Único | Pedir um delivery especial no fim de semana. |
| **Caixa Misteriosa Épica** | 35,00 🪙 | Sorteio RNG | Sorteio de prêmios de alto valor ou tempos estendidos! |
| **Comprar um Livro/Jogo** | 62,50 🪙 | Uso Único | Recompensa de longo prazo para um item material desejado. |

---

### 🎁 Caixas Misteriosas (Loot Tables RNG)

Ao comprar uma Caixa Misteriosa, o sistema realiza um sorteio ponderado com base em 4 níveis calibrados:

| Pacote | Custo | Distribuição de Prêmios e Chances |
| :--- | :---: | :--- |
| 📦 **Básica (Basic)** | 5,00 🪙 | **60%** Pausa Curta (10-15min) <br> **30%** Lazer Médio (30min) <br> **10%** Sessão Focada (45min + 1 🪙 bônus) |
| 🎁 **Premium** | 15,00 🪙 | **50%** Lazer Padrão (45-60min) <br> **35%** Lazer Estendido (75-90min) <br> **15%** Noite Gamer / Cinema (120min) |
| 💎 **Épica (Epic)** | 35,00 🪙 | **50%** Bloco Estendido (120min) <br> **35%** Noite Livre (180min) <br> **15%** Tarde de Desconexão (240min) |
| 👑 **Lendária (Legendary)** | 80,00 🪙 | **60%** Day-Off Parcial (240min) <br> **30%** Day-Off Integral <br> **10%** O Santo Graal (Final de Semana Livre) |

---

### 🏆 Níveis de Usuário (`UserLevel`)

A progressão do usuário acompanha o acúmulo total de XP vitalício (`totalXp`), que **nunca é consumido** ao adquirir recompensas:

| Nível (EN / PT-BR) | XP Necessário | Esforço Estimado |
| :--- | :---: | :--- |
| `NOVICE` (Novato) | 0 XP | Ponto de partida. |
| `APPRENTICE` (Aprendiz) | 100 XP | ~7 tarefas médias (1º ou 2º dia). |
| `ADVENTURER` (Aventureiro) | 300 XP | ~20 tarefas médias (1ª semana). |
| `CHALLENGER` (Desafiante) | 750 XP | ~50 tarefas médias (2 a 3 semanas). |
| `AMATEUR` (Amador) | 1.500 XP | ~100 tarefas médias (~1 mês de consistência). |
| `PROFESSIONAL` (Profissional) | 3.000 XP | Exige consistência trimestral. |
| `EXPERT` (Especialista) | 6.000 XP | Usuário focado de médio/longo prazo. |
| `VETERAN` (Veterano) | 12.000 XP | Alta maturidade no sistema. |
| `MASTER` (Mestre) | 25.000 XP | Mais de 1.600 tarefas médias concluídas. |
| `LEGEND` (Lenda) | 60.000 XP | O marco final. Exige mais de 1 ano de disciplina diária. |

---

### ⏱️ Ferramentas de Foco: Pomodoro, Cronômetro & Salvaguardas

Enquanto as tarefas recompensam a entrega de resultados (*output*), a tela de foco premia a imersão de tempo (*input*) com regras que blindam a economia contra abusos:

| Modalidade | Duração / Ciclo | Recompensa Base | Equivalência e Regras |
| :--- | :---: | :---: | :--- |
| **Pomodoro Curto** | 15 a 24 min | **4 XP • 0,10 🪙** | Quebra rápida de inércia. Requer ciclo completado. |
| **Pomodoro Padrão** | 25 a 40 min | **8 XP • 0,25 🪙** | O padrão clássico. Equivale a pouco mais de 1 Tarefa Fácil. |
| **Pomodoro Deep Work** | Mais de 40 min | **15 XP • 0,50 🪙** | Sessão de imersão profunda. Equivale ao XP de 1 Tarefa Média. |
| **Cronômetro Livre** | Por bloco de 30 min | **~7 XP • 0,20 🪙** | Bonificação contínua proporcional (teto de 90 min/sessão). |

#### 🛡️ Travas de Segurança & Regras Anti-Abuso
1. **Tempo Mínimo para Pontuar:** Sessões com menos de **10 minutos** geram 0 XP e 0 moedas, prevenindo cliques acidentais ou farm artificial.
2. **Teto Máximo por Sessão (Anti-AFK):** Qualquer sessão contínua tem sua recompensa limitada a **no máximo 90 minutos** de cálculo (mesmo se o cronômetro for esquecido ligado).
3. **Teto Diário & Rendimentos Decrescentes (*Daily Soft Cap*):**
   * **0h a 4h diárias (até 240 min):** 100% da recompensa.
   * **4h a 6h diárias (240 a 360 min):** 50% da recompensa (zona de fadiga natural).
   * **Acima de 6h diárias (> 360 min):** 0% de XP e moedas adicionais (os minutos continuam computados nos relatórios, protegendo o usuário de burnout e a economia de hiperinflação).
4. **Trava de Lazer (Itens de Mochila):** Quando uma recompensa da mochila é executada no cronômetro (ex: "Jogar 30min"), o rendimento é **obrigatoriamente ZERO** (lazer consome tempo, não gera dinheiro).

---

## 🛠️ Stack Tecnológica & Arquitetura

O sistema foi desenhado visando escalabilidade, manutenibilidade e rigor arquitetural:

* **Backend (`habitparty-api`):**
  * **Java 25 & Spring Boot 3.3+**
  * **Arquitetura Hexagonal (Ports & Adapters)** isolando regras de negócio e cálculo matemático de dependências externas.
  * *Design Patterns:* Strategy (cálculo de recompensas e decaimentos), Factory Method (instanciação polimórfica de tarefas) e Port-Adapter Pattern.
  * **Segurança & RBAC:** Spring Security com controle de papéis (`ROLE_USER`, `ROLE_ADMIN`), autenticação stateless via JWT e Refresh Tokens criptografados com BCrypt.
  * **Autenticação Social:** Google OAuth 2.0 integrado.
  * **Comunicação Transacional:** Resend API para envio de lembretes e recuperação de senhas.
  * **Bancos de Dados:** PostgreSQL (persistência relacional principal) e Redis (cache).
  * **Pagamentos & Assinaturas:** Integração com Stripe (Checkout, Customer Portal e Webhooks para Cartão e Pix avulso).
  * **Documentação:** Swagger / OpenAPI 3.0 para exploração visual interativa de endpoints.
* **Frontend (`habitparty-web`):**
  * **Next.js 15+ (App Router) & React 19**
  * **Tailwind CSS v4** com design tokens semânticos e modo claro/escuro nativo.
  * **Biome** para linting e formatação com máxima performance.
  * **Web Audio API** nativo para sintetizadores sonoros procedurais (áudio de cliques, alarmes de fim de ciclo e 4 geradores de som ambiente).
  * **Lucide Icons & Zustand** para gerenciamento de estado cliente ágil e reativo.

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
* [Docker & Docker Compose](https://docs.docker.com/get-docker/)
* [Java 25](https://adoptium.net/) (ou uso exclusivo dos containers)
* [Node.js 20+](https://nodejs.org/) e npm

---

### 1. Configuração de Variáveis de Ambiente (.env)
Copie os modelos de exemplo nas respectivas pastas e preencha as variáveis necessárias:

```bash
# Backend
cp habitparty-api/.env.example habitparty-api/.env

# Frontend
cp habitparty-web/.env.example habitparty-web/.env.local
```

---

### 2. Banco de Dados (PostgreSQL via Docker)
Navegue até o diretório da API e inicie o banco de dados:

```bash
cd habitparty-api
docker compose up -d
```

---

### 3. Servidor Backend (Spring Boot API)
Com o banco de dados ativo:

```bash
cd habitparty-api
./mvnw spring-boot:run
```
*(No Windows, utilize `mvnw.cmd spring-boot:run` ou `mvn spring-boot:run`).*

* **Swagger UI (Documentação Interativa):** `http://localhost:8080/swagger-ui.html`
* **OpenAPI 3.0 Docs:** `http://localhost:8080/v3/api-docs`

---

### 4. Interface Web (Frontend Next.js)
Em outro terminal, instale as dependências e inicie o servidor de desenvolvimento:

```bash
cd habitparty-web
npm install
npm run dev
```

* **Aplicação Web:** `http://localhost:3000`
* **Painel Administrativo:** `http://localhost:3000/admin` *(requer conta com cargo `ROLE_ADMIN`)*

> 💡 **Guia do Desenvolvedor:** Para comandos auxiliares de manutenção do Docker, dicas de importação de rotas em clientes HTTP (Bruno, Postman) e checklist de concepção, consulte o documento [docs/DEV_NOTES.md](file:///home/carlosvinicius/github-projects/HabitParty/docs/DEV_NOTES.md).

---

## 🗺️ Roadmap de Lançamentos

### 🎯 Release 1.1 — Modo Claro & Internacionalização (i18n)
* **Modo Claro (Light Theme):** Nova interface visual arejada, luminosa e com alto contraste, projetada para uso diurno confortável e excelente legibilidade.
* **Internacionalização (i18n):** Suporte nativo completo à **Língua Inglesa (EN)** e **Português (PT-BR)** em todas as telas, alertas e componentes da plataforma.

---

### 🏆 Release 1.2 — Conquistas Pessoais, Temas VIP & Foco Vinculado a Tarefas
* **Vinculação de Foco a Tarefas:** Possibilidade de associar sessões de Pomodoro/Foco diretamente a tarefas específicas do seu quadro Kanban/rotina.
* **Métricas de Esforço por Tarefa:** Registro do tempo acumulado dedicado por card (ex: `⏱️ 2h 15m`), histórico de ciclos de foco e opção de concluir a tarefa ao término do timer.
* **Ação Rápida "Focar nesta Tarefa":** Inicie o timer de foco diretamente pelo menu de contexto de qualquer tarefa em 1 clique.
* **Sistema de Conquistas Pessoais:** Dezenas de medalhas e troféus desbloqueados automaticamente ao manter ofensivas de hábitos, bater metas de foco em tarefas e acumular moedas.
* **Painel de Conquistas:** Nova tela *"Minhas Conquistas"* para acompanhar a evolução e os marcos da sua jornada.
* **Temas Exclusivos VIP:** Seletor dinâmico de atmosferas visuais para membros Premium (ex: *Dark Knight, Cyberpunk Neon, Forest Ranger, Royal Gold*).

---

### 🛡️ Release 1.3 — Perfil Público, Vitrine de Conquistas e Amizades
* **Perfis Públicos de Aventureiro:** Página pública personalizável para compartilhar sua jornada, nível e consistência na plataforma.
* **Vitrine de Destaques:** Painel interativo para organizar e destacar suas insígnias (inclusive a de Membro Fundador!), títulos e troféus favoritos no topo do seu perfil.
* **Rede de Amizades:** Busca de jogadores por nome de usuário ou código de amigo, envio de solicitações e lista de amigos conectados.
* **Controles de Privacidade:** Configurações granulares para escolher quais dados (tarefas, ofensivas ou estatísticas) deseja manter públicos ou privados.

---

### ⚔️ Release 1.4 — Party (Grupos Pequenos) & Comunicação Instantânea
* **Formação de Parties:** Crie pequenos grupos com amigos ou parceiros de estudo via código de convite rápido.
* **Missões Diárias Cooperativas:** Metas coletivas onde todo o grupo recebe bônus de moedas e recompensas se todos cumprirem seus compromissos.
* **Chat Integrado em Tempo Real:** Conversas diretas entre amigos e canal exclusivo de bate-papo da Party para manter a motivação em alta.
* **Notificações de Atividade:** Alertas sonoros e visuais elegantes para mensagens e conquistas de amigos em tempo real.

---

### 🏰 Release 2.0 — Guildas & O MMO Social Completo
* **Guildas Temáticas:** Crie ou participe de clãs com dezenas de membros organizados por interesses (Estudos, Saúde, Programação, Concursos).
* **Quests & Raids de Guilda:** Batalhas cooperativas épicas contra chefões mundiais que perdem pontos de vida à medida que a guilda cumpre tarefas e horas de foco.
* **Leaderboards Globais:** Tabelas de classificação e rankings de consistência (Global, entre Amigos e entre Guildas rivais).

---

## 📄 Licença

**Copyright (c) 2026 Carlos Vinicius / HabitParty. All rights reserved.**

O código-fonte deste projeto é disponibilizado publicamente (*"Source-Available"*) com o propósito de transparência, estudo e uso pessoal. É **estritamente proibido** o uso, cópia, redistribuição ou modificação deste software para qualquer finalidade comercial, monetização ou oferta como serviço (SaaS) por terceiros.

Para visualizar as regras completas de uso pessoal, consulte o arquivo [LICENSE](file:///home/carlosvinicius/github-projects/HabitParty/LICENSE) na raiz deste repositório.
