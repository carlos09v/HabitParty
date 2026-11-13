# 👥 HabitParty (Motor de Produtividade Gamificado)

> 🌐 **Idioma / Language:** [English](README.md) | **Português (PT-BR)**

Um sistema open-core de gamificação e produtividade com uma economia matemática rígida na aquisição de moedas, mas flexível e amigável nas recompensas. O HabitParty foi construído para aumentar sua produtividade, garantindo que o esforço real do usuário seja convertido em valor exato para resgatar suas próprias recompensas na vida real.

> **Filosofia central:** É um sistema baseado primariamente na sua honestidade e comprometimento! Não há como burlar a si mesmo: cada conquista gera satisfação genuína e descanso sem culpa.

---

## ✨ Funcionalidades Principais

* **Gestão de Rotina Completa:** Separação clara do fluxo de trabalho em **Hábitos** (com ofensivas/streak e decaimento biológico), **Tarefas Diárias** (*Dailies* com agendamento por dias da semana) e **Afazeres** (*To-Dos* com suporte a tarefas pontuais com prazo e horário limite, checklists de subtarefas e agendamento VIP como eventos cronometrados com início/término ou dia inteiro).
* **Dois Modos de Experiência (Essencial vs. Aventura):** Alterne a qualquer momento entre dois perfis visuais e semânticos com paridade matemática `1:1`:
  * 🎯 **Modo Essencial (Produtividade):** Estética executiva e limpa. Converte entregas em **Créditos** e **Pontos (`pts`)**, utiliza títulos profissionais, indicadores discretos de **Esforço**, recompensas diretas na Loja (sem sorteios RNG), **Prazo Rígido** e **Inventário**.
  * ⚔️ **Modo Aventura (Imersão RPG):** Experiência gamificada completa com **Moedas de Ouro (🪙)** e **XP**, títulos de aventureiro (`Novato` a `Lenda`), ícones de espadas para **Dificuldade**, **Caixas Misteriosas (Gacha)**, **Modo Hardcore** e **Mochila**.
* **Economia Rígida (Farming):** Ganhos de Moedas/Créditos e XP/Pontos calculados estritamente com base na dificuldade/esforço da tarefa:
  * 🟦 **Trivial** (0,25 🪙 / Créditos • 2 XP / pts)
  * 🟩 **Fácil** (0,75 🪙 / Créditos • 5 XP / pts)
  * 🟨 **Médio** (2,50 🪙 / Créditos • 15 XP / pts)
  * 🟪 **Difícil** (5,00 🪙 / Créditos • 30 XP / pts)
* **Quadro Kanban & Múltiplos Ambientes (Workspaces):** Organize diferentes áreas da sua vida (Trabalho, Estudos, Vida Pessoal) em ambientes independentes, com quadros Kanban interativos, colunas personalizáveis e banner de busca inteligente entre múltiplos workspaces.
* **Loja de Recompensas da Vida Real:** Cadastre momentos de lazer e descanso categorizados em pacotes (Uso Único, Por Tempo ou Caixas da Sorte) com custos calibrados para o esforço do seu dia.
* **🎁 Caixas Misteriosas (RNG Opcional):** Sorteios probabilísticos com custos calculados matematicamente (Básica, Premium, Épica e Lendária) para trazer dopamina à sua rotina sem quebrar a economia.
* **🎒 Mochila de Inventário:** Todos os itens comprados ficam guardados na sua mochila para serem consumidos no momento ideal ou vinculados a uma sessão de descanso cronometrada.
* **⏱️ Palco de Foco (Pomodoro & Cronômetro):** Ferramenta nativa de imersão com rendimento decrescente diário (*daily soft cap* de até 6h), salvaguardas anti-AFK (teto de 90 min) e trava de lazer (itens de mochila não geram moeda).
* **👑 Personalização VIP, Eventos & Sons Ambientes:** Agendamento de Afazeres como Eventos (início/término ou dia inteiro), molduras animadas cósmicas para avatar, sons ambientes relaxantes sintetizados nativamente no navegador via Web Audio API (Chuva Suave, Cafeteria, Lofi Zen e Fogueira) e pacote exclusivo de ícones VIP.
* **🛡️ Painel Administrativo & Telemetria (`/admin`):** Módulo exclusivo para administradores (`ROLE_ADMIN`) com telemetria em tempo real da cota de e-mails no **Resend**, volume global de tarefas, estimativa da pegada de armazenamento do PostgreSQL por usuário, governança de papéis e histórico de logs de auditoria de disparos (`EmailDispatchLog`).
* **✉️ Notificações e Lembretes por E-mail (Resend):** Disparo automatizado de lembretes para tarefas com prazo próximo e recuperação de conta segura, com travas de cota por usuário para prevenir abusos.
* **🔑 Autenticação Híbrida & Segurança:** Suporte nativo a login social via **Google OAuth 2.0** e fluxo tradicional via e-mail e senha com JWT stateless, Refresh Tokens, BCrypt e controle de acesso baseado em papéis (RBAC).
* **📊 Auditoria & Exportação de Dados (CSV):** Histórico detalhado de produtividade diária com gestão em lote (seleção múltipla, exclusão em massa), retenção persistente da lista de origem das tarefas e exportação de todo o extrato financeiro para planilhas.

---

## 🎮 Motor de Gamificação (Economia e Progressão)

O sistema de progressão é baseado na conquista de Pontos de Experiência (XP), obtidos através da conclusão de tarefas. A curva de evolução foi desenhada para ser exponencial: níveis iniciais garantem vitórias rápidas para engajamento, enquanto níveis avançados exigem consistência de longo prazo.

### 📊 Dificuldade das Tarefas e Recompensas (XP e Moedas)

A quantidade de XP e Moedas recebidas reflete a carga de esforço e o tempo investido em cada atividade:

| Nível | Dificuldade | Ganho | Descrição e Exemplos de Uso |
| :---: | :--- | :--- | :--- |
| 🟦 | **Trivial** | 2 XP <br> 0,25 🪙 | Tarefas automáticas e de curtíssima duração. <br>*Ex: Beber água, tomar um remédio, arrumar a cama.* |
| 🟩 | **Fácil** | 5 XP <br> 0,75 🪙 | Tarefas rápidas que exigem intenção ou organização básica. <br>*Ex: Responder e-mails, leitura de 10 minutos, lavar a louça.* |
| 🟨 | **Médio** (Padrão) | 15 XP <br> 2,50 🪙 | A base da economia. Exige foco moderado (30 a 60 minutos). <br>*Ex: Treino na academia, focar em uma tarefa do trabalho, limpar a casa.* |
| 🟪 | **Difícil** | 30 XP <br> 5,00 🪙 | Esforço físico ou cognitivo intenso (1 a 2 horas de trabalho profundo). <br>*Ex: Sessão de estudo focada, desenvolvimento de módulo complexo.* |

---

### 🔄 Hábitos: Importância e Decaimento de Recompensas

Diferente das Tarefas (Todo/Daily) que possuem "Dificuldade", os Hábitos são medidos pela sua **Importância** (Baixa, Normal, Alta). O objetivo de um hábito é a automação cerebral: quando você repete um comportamento muitas vezes, ele exige menos energia cognitiva.

Para refletir isso na economia e evitar a inflação de moedas, os hábitos sofrem um **decaimento de recompensa** conforme a sua ofensiva (*streak*) avança. Caso a sequência seja quebrada, a ofensiva reseta e a recompensa volta a 100%.

| Nível | Recompensa Base (Streak Inicial) | Descrição e Exemplos de Uso |
| :--- | :---: | :--- |
| 🟦 **Baixa (Low)** | 5 XP • 0,75 🪙 | Hábitos de manutenção simples e rápida. <br>*Ex: Tomar creatina, arrumar a mesa de trabalho.* |
| 🟩 **Normal** (Padrão) | 10 XP • 1,75 🪙 | A base da rotina com esforço moderado. <br>*Ex: Praticar instrumento musical por 15 min, ler 10 páginas.* |
| 🟪 **Alta (High)** | 25 XP • 3,75 🪙 | Hábitos de alta energia de ativação. <br>*Ex: Resolver 30 questões de concurso, treino físico pesado.* |

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
| 👑 **Lendária (Legendary)** | 80,00 🪙 | **60%** Day-Off Parcial (240min) <br> **30%** Day-Off Integral <br> **10%** Celebração Absoluta (Final de Semana Livre) |

---

### 🏆 Níveis de Usuário (`UserLevel`)

A progressão do usuário acompanha o acúmulo total de XP vitalício (`totalXp`), que **nunca é consumido** ao adquirir recompensas. O título exibido adapta-se automaticamente ao Modo de Experiência ativo (Modo Aventura vs. Modo Essencial):

| Tier | Modo Aventura (PT-BR / EN) | Modo Essencial (PT-BR / EN) | XP / Pontos Necessários | Esforço Estimado |
| :--- | :--- | :--- | :---: | :--- |
| `NOVICE` | Novato / Novice | Iniciante / Beginner | 0 XP / pts | Ponto de partida. |
| `APPRENTICE` | Aprendiz / Apprentice | Praticante / Practitioner | 100 XP / pts | ~7 tarefas médias (1º ou 2º dia). |
| `ADVENTURER` | Aventureiro / Adventurer | Consistente / Consistent | 300 XP / pts | ~20 tarefas médias (1ª semana). |
| `CHALLENGER` | Desafiante / Challenger | Focado / Focused | 750 XP / pts | ~50 tarefas médias (2 a 3 semanas). |
| `AMATEUR` | Amador / Amateur | Organizado / Organized | 1.500 XP / pts | ~100 tarefas médias (~1 mês de consistência). |
| `PROFESSIONAL` | Profissional / Professional | Produtivo / Productive | 3.000 XP / pts | Exige consistência trimestral. |
| `EXPERT` | Especialista / Expert | Especialista / Specialist | 6.000 XP / pts | Usuário focado de médio/longo prazo. |
| `VETERAN` | Veterano / Veteran | Sênior / Senior | 12.000 XP / pts | Alta maturidade no sistema. |
| `MASTER` | Mestre / Master | Executivo / Executive | 25.000 XP / pts | Mais de 1.600 tarefas médias concluídas. |
| `LEGEND` | Lenda / Legend | Alta Performance / High Performance | 60.000 XP / pts | O marco final. Exige mais de 1 ano de disciplina diária. |

---

### ⏱️ Ferramentas de Foco: Pomodoro, Cronômetro & Salvaguardas

Enquanto as tarefas recompensam a entrega de resultados (*output*), a tela de foco premia a imersão de tempo (*input*) com regras que blindam a economia contra abusos:

| Modalidade | Duração / Ciclo | Recompensa Base | Equivalência e Regras |
| :--- | :---: | :---: | :--- |
| **Pomodoro Curto** | 15 a 24 min | **4 XP • 0,25 🪙** | Quebra rápida de inércia (1/3 de 1 Tarefa Fácil). Requer ciclo completado. |
| **Pomodoro Padrão** | 25 a 40 min | **8 XP • 0,50 🪙** | O padrão clássico. Equivale a ~30%–40% de uma entrega de tarefa. |
| **Pomodoro Deep Work** | Mais de 40 min | **15 XP • 1,00 🪙** | Sessão de imersão profunda. Equivale a 40% das moedas e 100% do XP de 1 Tarefa Média. |
| **Cronômetro Livre** | Por bloco de 30 min | **~7 XP • 0,40 🪙** | Bonificação contínua proporcional (teto de 90 min/sessão). |

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
  * **Java 25 & Spring Boot 4.x (v4.1+)**
  * **Arquitetura Hexagonal (Ports & Adapters)** isolando regras de negócio e cálculo matemático de dependências externas.
  * *Design Patterns:* Strategy (cálculo de recompensas e decaimentos), Factory Method (instanciação polimórfica de tarefas) e Port-Adapter Pattern.
  * **Segurança & RBAC:** Spring Security com controle de papéis (`ROLE_USER`, `ROLE_ADMIN`), autenticação stateless via JWT e Refresh Tokens criptografados com BCrypt.
  * **Autenticação Social:** Google OAuth 2.0 integrado.
  * **Comunicação Transacional:** Resend API para envio de lembretes e recuperação de senhas.
  * **Bancos de Dados:** PostgreSQL (persistência relacional principal com migrações Flyway).
  * **Pagamentos & Assinaturas:** Integração com Stripe (Checkout, Customer Portal e Webhooks para Cartão e Pix avulso).
  * **Documentação:** Swagger / OpenAPI 3.0 para exploração visual interativa de endpoints.
* **Frontend (`habitparty-web`):**
  * **Next.js 16 (App Router) & React 19**
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
docker compose up -d postgres
```
*(Dica: O comando `docker compose up -d postgres` inicia apenas o banco de dados, liberando a porta `8080` para desenvolvimento local do backend via Maven. Para rodar o stack completo conteinerizado incluindo a API, execute `docker compose up -d`).*

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

> 💡 **Guia do Desenvolvedor:** Para comandos auxiliares de manutenção do Docker, dicas de importação de rotas em clientes HTTP (Bruno, Postman) e checklist de concepção, consulte o documento [docs/DEV_NOTES.md](docs/DEV_NOTES.md).

---

## 🗺️ Roadmap de Lançamentos

### 🎯 Release 1.1 — Internacionalização (i18n) & Modos de Experiência ✅ (Concluído)
* **Internacionalização (i18n):** Suporte nativo completo à **Língua Inglesa (EN)** e **Português (PT-BR)** em todas as telas, alertas e componentes da plataforma.
* **Modos de Experiência (Modo Essencial vs. Modo Aventura):** Escolha entre o **Modo Essencial (Produtividade)** — com Créditos, Pontos (`pts`), Prazo Rígido, Inventário e recompensas diretas — ou o **Modo Aventura (Imersão RPG)** — com Moedas de Ouro (🪙), XP, Modo Hardcore, Mochila e Caixas Misteriosas.
* **Segurança e Proteção Anti-Bot:** Verificação progressiva de e-mail, limitação de taxa por IP e blindagem contra cadastros automatizados e abusos.
* **Performance e Otimizações de Infraestrutura:** Reestruturação de tabelas, índices otimizados e respostas mais rápidas em queries frequentes.

---

### 🏆 Release 1.2 — Modo Claro, Conquistas, Perfis Públicos & Vitrine de Destaques ✅ (Concluído)
* **Modo Claro (Light Theme):** Nova interface visual arejada, luminosa e com alto contraste, projetada para uso diurno confortável e excelente legibilidade.
* **Sistema de Conquistas Pessoais:** Dezenas de medalhas e troféus desbloqueados automaticamente ao manter ofensivas de hábitos, bater metas de consistência e acumular moedas.
* **Painel de Conquistas:** Nova tela *"Minhas Conquistas"* para acompanhar a evolução e os marcos da sua jornada.
* **Perfis Públicos de Aventureiro:** Página pública personalizável para compartilhar sua jornada, nível e consistência na plataforma.
* **Vitrine de Destaques:** Painel interativo para organizar e destacar suas insígnias (inclusive a de Membro Fundador!), títulos e troféus favoritos no topo do seu perfil.

---

### 🛡️ Release 1.3 — Eventos no Kanban, Gestão em Lote & Foco em Tarefas ✅ (Concluído)
* **Foco Vinculado a Tarefas & Métricas de Esforço:** Associação direta de sessões de Pomodoro/Foco a tarefas específicas do Kanban em 1 clique, registro do tempo acumulado dedicado por card (ex: `⏱️ 2h 15m`), histórico de ciclos e opção de concluir a tarefa ao término do timer.
* **Afazeres como Eventos & Programação Temporal (VIP):** Transforme tarefas To-Do em eventos com horários de início e término (`startTime` / `dueEndTime`) ou dia inteiro (`isAllDay`), seletor universal integrado de data e hora (`DatePicker`), e badge pulsante em tempo real no Kanban para eventos em andamento.
* **Seleção Múltipla & Exclusão em Lote no Histórico:** Gestão ágil de extrato com seleção individual ou global de transações, barra flutuante de ações em lote e exclusão em massa (`DELETE /transactions/batch`).
* **Snapshot de Listas no Histórico:** Rastreamento persistente da coluna Kanban de origem da tarefa no momento da transação (`column_name_snapshot`), preservando o histórico mesmo após alterações no quadro.
* **Busca Global Entre Ambientes (Cross-Workspace Search):** Banner inteligente que detecta tarefas correspondentes em outros ambientes do usuário e permite alternar de workspace com 1 clique.
* **Formato de Horário Global (12h AM/PM vs 24h):** Preferência personalizável de exibição de tempo sincronizada em cards, detalhes, histórico e sessões de foco.
* **Descrições Expandidas (5.000 caracteres):** Suporte a anotações detalhadas com contador dinâmico de caracteres e alertas de limite.
* **Notificador de Quebra de Ofensiva:** Detecção proativa e alerta motivacional no primeiro login após quebra de sequência diária.
* **Sincronização na Exclusão de Foco & Tarefas:** Opção de expurgar transações financeiras vinculadas no Histórico ao excluir sessões de foco ou tarefas.

---

### 🎨 Release 1.4 — Temas VIP, Amizades & Controles de Privacidade
* **Temas Exclusivos VIP:** Seletor dinâmico de atmosferas visuais e paletas cósmicas para membros Premium (ex: *Dark Knight, Cyberpunk Neon, Forest Ranger, Royal Gold*).
* **Rede de Amizades & Códigos de Amigo:** Busca ágil de outros aventureiros por nome de usuário (@username) ou código de amigo (Friend Code) com envio de solicitações.
* **Círculo de Conexões Sociais:** Acompanhamento da consistência, nível e insígnias dos seus amigos conectados.
* **Controles Granulares de Privacidade:** Configurações personalizadas para definir a visibilidade das suas rotinas, histórico e estatísticas (Público, Apenas Amigos ou Privado).
* **Notificações de Atividade Social:** Alertas sonoros e visuais elegantes para solicitações recebidas e marcos de consistência da sua rede.

---

### ⚔️ Release 1.5 — Parties, Esquadrões de Foco & Quests Cooperativas
* **Formação de Parties:** Crie pequenos grupos de foco e consistência (4 a 6 membros) com parceiros de estudo ou trabalho via código de convite rápido.
* **Missões Diárias Cooperativas:** Metas coletivas onde todo o grupo recebe multiplicadores de XP e bônus de ouro se todos cumprirem seus compromissos no dia.
* **Painel de Consistência da Party:** Visão unificada em tempo real do progresso das tarefas diárias e sessões ativas de foco dos integrantes do esquadrão.
* **Marcos Compartilhados & Insígnias Cooperativas:** Desbloqueio conjunto de conquistas e títulos cooperativos para os membros da equipe.

---

### 💬 Release 1.6 — Chat em Tempo Real, Presença ao Vivo & Alertas Instantâneos
* **Chat Integrado em Tempo Real:** Conversas instantâneas via WebSockets com salas exclusivas para cada Party e mensagens diretas (DM) entre amigos.
* **Status de Presença e Foco ao Vivo:** Indicadores em tempo real para saber quem está em sessão de foco (*"Focando agora ⏱️"*), descansando (*"Pausa ☕"*) ou disponível.
* **Reações Rápidas e Emojis de Incentivo:** Envie incentivos e aplausos em 1 clique durante as sessões de foco dos parceiros de esquadrão.
* **Alertas Sonoros Imediatos:** Efeitos sonoros sutis e notificações em tela para mensagens da party e conquistas em tempo real sem sair do fluxo.

---

### 🏰 Release 2.0 — Guildas & O MMO Social Completo
* **Guildas Temáticas:** Crie ou participe de clãs com dezenas de membros organizados por interesses (Estudos, Saúde, Programação, Concursos).
* **Quests & Raids de Guilda:** Batalhas cooperativas épicas contra chefões mundiais que perdem pontos de vida à medida que a guilda cumpre tarefas e horas de foco.
* **Leaderboards Globais:** Tabelas de classificação e rankings de consistência (Global, entre Amigos e entre Guildas rivais).

---

## 📄 Licença

**Copyright (c) 2026 Carlos Vinicius / HabitParty. All rights reserved.**

O código-fonte deste projeto é disponibilizado publicamente (*"Source-Available"*) com o propósito de transparência, estudo e uso pessoal. É **estritamente proibido** o uso, cópia, redistribuição ou modificação deste software para qualquer finalidade comercial, monetização ou oferta como serviço (SaaS) por terceiros.

Para visualizar as regras completas de uso pessoal, consulte o arquivo [LICENSE](LICENSE) na raiz deste repositório.
