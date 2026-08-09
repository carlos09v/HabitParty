## ✅ Checklist do Projeto HabitParty

### 1. Modelagem e Design
- [x] Uso da IA com Opencode e GitHub Copilot
- [x] Modelagem Conceitual (Lucidchart / draw.io)
- [x] Modelagem Lógica e DER no Lucidchart
  - *Update (16/07/2026): Adicionei as tabelas `user_achievements` e `achievements`*
  - *Update (18/07/2026): Adicionei a tabela `workspace`*
  - *Update (...01/08/2026): Várias alterações como adição de campo Xp e Streak na tabela `users` e nova tabela: `profile_highlights`*
  - *Update (01/08/2026): Desnormalização (uso do user_id em todas as tabelas faltantes: board_column, checklist_item e focus_record) para evitar múltiplos Gets para verificar se o user existe.*
- [ ] Modelagem de Classes e Sequência com UML
- [x] Modelagem das pastas da Arquitetura Hexagonal
- [x] Criação do Moodboard no Figma (Prints de referências, Mobbin, Post-its)
  - *Update (16/07/2026): Comecei a pegar prints de sites como Dribble, Mobbin, etc*
  - *Update (01/08/2026): Falta Landpage*
- [X] Criação dos Componentes no Figma
- [ ] Wireframes de Baixa Fidelidade no Figma
  - *Update (01/08/2026): Falta a tela Ajuda e Landpage*
- [ ] Wireframes de Alta Fidelidade no Figma (Design Final)

### 2. Infraestrutura e Setup Inicial (Back-end)
- [X] Criação do arquivo `docker-compose.yml` (PostgreSQL)
- [ ] Configuração da infraestrutura local com os serviços essenciais
- [X] Início do projeto com Maven e Spring Boot (e instalação de dependências)
  - *Update (15/07/2026): Adição da dependência `spring-boot-starter-validation` (Jakarta)*
- [X] Configuração do `application.yml` (Conexão com Banco e Hibernate)

### 3. Desenvolvimento Back-end (Arquitetura Hexagonal)
- Ordem de criação: Domain (Entidades, Enums) > Port (Interfaces) > DTO & UseCase > Infraestrutura (Entity JPA > JpaRepository > Mapper > Adapter) > Controller

#### 3.1. Camada de Domínio (Core)
- [X] Criar classe de Domínio User
- [X] Criar classe de Domínio Workspace
- [X] Criar classe de Domínio BoardColumn
- [X] Criar classe de Domínio Reward
[ ] Criar classe de Domínio base Task
[ ] Criar classes filhas Habit, Daily, e ToDo (Herança de Task)
[ ] Criar classe de Domínio ChecklistItem
[ ] Criar classe de Domínio FocusActivity
[ ] Criar classe de Domínio FocusRecord
[ ] Criar classe de Domínio TransactionHistory
[ ] Criar classe de Domínio InventoryItem
[ ] Criar classe de Domínio Achievement
[ ] Criar classe de Domínio ProfileHighlights

#### 3.2. Camada de Aplicação (Use Cases e Ports)
##### Portas de Saída
- [X] Criar UserRepository
- [X] Criar WorkspaceRepository
- [X] Criar BoardColumnRepository
- [X] Criar RewardRepository
[ ] Criar TaskRepository
[ ] Criar ChecklistItemRepository
[ ] Criar FocusActivityRepository
[ ] Criar FocusRecordRepository
[ ] Criar TransactionHistoryRepository
[ ] Criar InventoryItemRepository
[ ] Criar AchievementRepository
[ ] Criar ProfileHighlightsRepository

##### Casos de Uso - User
- [X] CreateUserUseCase
- [X] FindAllUsersUseCase
  - *Atualmente desativado para somente apos implementar o RBCA*
- [X] FindUserByIdUseCase
- [X] DeleteUserUseCase
- [ ] UpdateUserProfileUseCase (Atualiza nome, data de nascimento, bio)
- [ ] UpdateUserPasswordUseCase (Trata a lógica de hash e validação da senha atual)
- [ ] UpdateProfilePhotoUseCase (Trata o upload e URL da imagem)
- [ ] [Futuro] Implementar RBAC (Controle de Acesso Baseado em Cargos - Admin/User)

##### Casos de Uso - Workspace
- [X] CreateWorkspaceUseCase
- [X] ListUserWorkspacesUseCase
  - [ ] Pendente: *Implementar Eager Loading para o Frontend*
- [X] DeleteWorkspaceUseCase
  - *Obs: voltar depois de criar Board Column e Tasks*
- [ ] UpdateWorkspaceUseCase (Atualiza nome)

##### Casos de Uso - Board Column
- [X] CreateBoardColumnUseCase
- [X] DeleteBoardColumnUseCase
  - *Obs: voltar depois de criar Tasks*
- [X] ReorderBoardColumnUseCase
- [X] ListUserBoardColumnUseCase
  - *Obs: utilizar apenas como um backup pois quem vai dar esse Get é a criação do workspace (Eager Loading)*
- [ ] UpdateBoardColumnUseCase (Atualiza nome e icone)

##### Casos de Uso - Reward (Recompensas)
- [X] CreateRewardUseCase
- [X] DeleteRewardUseCase
- [ ] ReorderRewardUseCase
- [X] ListUserRewardsUseCase
- [ ] FindRewardByIdUseCase
- [ ] RedeemRewardUseCase (O usuário "compra" a recompensa, descontando o saldo)
- [ ] UpdateRewardUseCase

##### Casos de Uso - Task (Habit, Daily, ToDo)
- [ ] CreateTaskUseCase
- [ ] MoveTaskUseCase (Move entre as colunas do board)
- [ ] UpdateTaskUseCase (Altera título, descrição, datas)
- [ ] CompleteTaskUseCase (Marca como concluída e dispara a lógica de ganhar moedas)
- [ ] DeleteTaskUseCase

##### Casos de Uso - Focus
- [ ] StartFocusSessionUseCase
- [ ] RecordFocusSessionUseCase (Salva a sessão concluída e calcula moedas/XP)
- [ ] CancelFocusSessionUseCase
...

##### Casos de Uso - Sistema (Economia e Gamificação)
- [ ] ProcessTransactionUseCase (Gerencia ganhos e gastos de moedas no cofre do usuário)
- [ ] UnlockAchievementUseCase (Gerencia a relação N:N de conquistas)
- [ ] UseInventoryItemUseCase (Para equipar ou consumir itens comprados)

#### 3.3. Adaptadores de Saída (Persistence / Banco de Dados)
##### Entidades JPA
- [X] Criar `UserJpaEntity`
- [X] Criar `WorkspaceJpaEntity`
- [X] Criar `BoardColumnJpaEntity`
- [ ] Criar `Tasks` (Definir estratégia de herança: Single Table ou Joined)
- [ ] Criar `ChecklistItemJpaEntity`
- [ ] Criar `RewardJpaEntity`
- [ ] Criar `FocusActivityJpaEntity`
- [ ] Criar `FocusRecordJpaEntity`
- [ ] Criar `TransactionHistoryJpaEntity`
- [ ] Criar `InventoryItemJpaEntity`
- [ ] Criar `AchievementJpaEntity`
- [ ] Criar `UserAchievementJpaEntity` (Tabela Intermediária N:N)
- [ ] Criar `ProfileHighlightsJpaEntity`

##### Interfaces do Spring Data JPA
[ ] Criar UserJpaRepository
[ ] Criar WorkspaceJpaRepository
[ ] Criar BoardColumnJpaRepository
[ ] Criar TaskJpaRepository
[ ] Criar ChecklistItemJpaRepository
[ ] Criar RewardJpaRepository
[ ] Criar FocusActivityJpaRepository
[ ] Criar FocusRecordJpaRepository
[ ] Criar TransactionHistoryJpaRepository
[ ] Criar InventoryItemJpaRepository
[ ] Criar AchievementJpaRepository
[ ] Criar ProfileHighlightsJpaRepository

##### Mappers (Tradução Domain <-> Entity)
[ ] Criar UserMapper
[ ] Criar WorkspaceMapper
[ ] Criar BoardColumnMapper
[ ] Criar TaskMapper
[ ] Criar ChecklistItemMapper
[ ] Criar RewardMapper
[ ] Criar FocusActivityMapper
[ ] Criar FocusRecordMapper
[ ] Criar TransactionHistoryMapper
[ ] Criar InventoryItemMapper
[ ] Criar AchievementMapper
[ ] Criar ProfileHighlightsMapper

##### Persistence Adapters (Implementações das Ports)
[ ] Implementar UserAdapter
[ ] Implementar WorkspaceAdapter
[ ] Implementar BoardColumnAdapter
[ ] Implementar TaskAdapter
[ ] Implementar ChecklistItemAdapter
[ ] Implementar RewardAdapter
[ ] Implementar FocusActivityAdapter
[ ] Implementar FocusRecordAdapter
[ ] Implementar TransactionHistoryAdapter
[ ] Implementar InventoryItemAdapter
[ ] Implementar AchievementAdapter
[ ] Implementar ProfileHighlightsAdapter

#### 3.4. Adaptadores de Entrada (Web / Controllers)
##### DTOs de Request (Entrada)
[X] Criar CreateUserDTO
[X] Criar CreateWorkspaceDTO
[X] Criar CreateBoardColumnDTO
[X] Criar UpdateColumnOrderDTO
[ ] Criar CreateTaskDTO
[ ] Criar CreateRewardDTO
[ ] Criar Demais Request DTOs...

##### DTOs de Response (Saída - Eager Loading e Blindagem)
- [ ] Criar UserResponseDTO (Incluindo Idade e Título de Nível derivados)
- [ ] Criar WorkspaceResponseDTO (Estruturado com lista de colunas para Eager Loading)
- [ ] Criar BoardColumnResponseDTO (Estruturado com lista de tarefas)
- [ ] Criar TaskResponseDTO
- [ ] Criar RewardResponseDTO
- [ ] Criar Demais Response DTOs...

##### Controllers
- [X] Criar `UserController`
- [X] Criar `WorkspaceController`
- [X] Criar `BoardColumnController`
- [ ] Criar `TaskController`
- [ ] Criar `FocusController`
- [ ] Criar `RewardController`
- [ ] Criar `AchievementController`

#### Em breve...
- [ ] Feature de exportar (pdf ou excel) do `transaction_history`
- [ ] Feature `Social` com Amigos, etc.
- [ ] Calender View

### 4. Web (Next.js Front-end)
- [ ] Instalação do Next.js com App Router e Tailwind CSS
- [ ] Instalação e configuração do `next-intl` (Tradução e Middleware pt/en)
- [ ] Inicialização do Shadcn UI (`npx shadcn-ui@latest init`)
- [ ] Adição de componentes base do Shadcn (Button, Card, Input, Form, Table)
- [ ] Instalação do Zod para validação de schemas no front-end
- [ ] Criação da Estrutura de Pastas de Roteamento (`app/[locale]/...`)
- [ ] Desenvolvimento do Layout Global (Menu Lateral de Navegação)
- [ ] Desenvolvimento da Página: Dashboard
- [ ] Desenvolvimento da Página: Focus (Com colunas personalizadas)
- [ ] Desenvolvimento da Página: Histórico de Transações
- [ ] Integração com a API (Configurar chamadas Fetch/Axios para o Spring Boot)