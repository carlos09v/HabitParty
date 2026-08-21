# Diretrizes Arquiteturais e Regras de Negócio - HabitParty

## 🛠️ Stack Tecnológica
- **Backend:** Java, Spring Boot, Maven
- **Banco de Dados:** PostgreSQL (principal), Redis (cache)
- **Mensageria:** RabbitMQ
- **Segurança:** Spring Security, JWT (JSON Web Tokens), BCrypt
- **Qualidade:** SonarQube
- **Acesso local ao banco:** DBeaver

---

## 🏛️ Arquitetura Hexagonal (Ports and Adapters)
O projeto segue estritamente a Arquitetura Hexagonal. As dependências devem sempre apontar para o centro, e o centro é o núcleo de negócio.

### Estrutura de Pacotes Obrigatória

1. **`core/domain` (Núcleo de Negócio):** Entidades puras, Value Objects e Enums (Sem anotações de infraestrutura).
2. **`core/exception` (Tratamento de Erros):**
3. **`application/usecases` (Casos de Uso):** Orquestração das regras de negócio, injeção de dependência via construtor e tratamento de erros (Uma classe por Caso de Uso).
4. **`application/ports` (Contratos):** Interfaces unificadas usadas para desacoplar o núcleo das implementações concretas (ex: `UserRepositoryPort`, `PasswordHasherPort`, `StoragePort`).
5. **`adapters/in/web` (Porta de Entrada):**
    * `/`: Controladores REST.
    * `/dtos/request`: DTOs de entrada (`records` com validação `jakarta`).
    * `/dtos/response`: DTOs de saída blindados (escondendo informações sensíveis).
6. **`adapters/out` (Porta de Saída):**
    * `/persistence`: Implementações de banco de dados (`UserAdapter`), Entidades JPA, Repositórios e Mappers.
    * `/security`: Implementações de segurança (ex: `PasswordHasherAdapter` usando BCrypt).
    * `/storage`: Implementações de armazenamento de arquivos (ex: `LocalStorageAdapter` ou futuros adapters de Nuvem).
7. **`infrastructure` (Configurações):** Beans do Spring, segurança (filtros JWT), tratamento global de exceções e configurações técnicas.

---

## 🚫 Regra Máxima: Pureza do Domínio
O pacote `core/domain` **NÃO PODE** conter nenhuma tecnologia de infraestrutura.

- **Proibido:** Anotações do Spring (`@Service`, `@Component`, `@Autowired`).
- **Proibido:** Anotações de Persistência/JPA (`@Entity`, `@Table`, `@Id`, `@Column`).
- **Proibido:** Dependências de bibliotecas de infraestrutura, web ou banco de dados.
- Toda comunicação com o banco de dados deve ser feita mapeando uma entidade de domínio pura para uma entidade JPA através de um Mapper no Adapter.

## Ciclo de Vida dos Tokens (Access & Refresh):
  - **Access Token:** JWT de vida curta (ex: 15min) assinado via HMAC-SHA256. Deve ser enviado no header `Authorization: Bearer <token>` em todas as requisições protegidas. A API valida a assinatura de forma Stateless (não bate no banco).
  - **Refresh Token:** UUID de vida longa (ex: 7 dias) gerado no momento do login e persistido na tabela `refresh_tokens` associado ao usuário. 
  - **Mecânica de Renovação:** Quando o Access Token expira (Erro 401), o cliente deve chamar a rota `POST /auth/refresh` enviando o Refresh Token. O sistema deve validar no banco se o token existe, não expirou e não foi revogado (`revoked = false`), para então emitir um novo par de tokens.
  - **Logout:** A rota de logout deve invalidar o Refresh Token ativo no banco de dados, forçando um novo login com credenciais quando o Access Token atual expirar.

### Tipagem Crítica (Regra de Ouro)
- **Moedas, Preços e Saldos:** Variáveis financeiras ou de economia (`current_coins`, `total_gold_earned`, `price`) **DEVEM** usar obrigatoriamente `BigDecimal`. É estritamente proibido o uso de `Double` ou `Float`.
- **Pontos e Ordem:** Atributos matemáticos inteiros (`totalXp`, `currentStreak`, `orderIndex`) devem usar o tipo primitivo `int` no Java.

### Atributos Derivados vs. Persistidos
- O cálculo do Nível de Usuário (`UserLevel`) é responsabilidade exclusiva da entidade de Domínio `User`, calculado em tempo real ("on the fly") com base no `totalXp`. O Nível **NÃO** deve ser persistido como uma coluna no banco de dados.
- O saldo total histórico (`total_gold_earned`) é um caso de Desnormalização para Leitura e **DEVE** ser persistido para evitar queries pesadas.

---

## 🛡️ Segurança, Autenticação e Identidade (RBAC & JWT)
A aplicação utiliza um modelo robusto de autenticação Stateless (JWT) combinado com Controle de Acesso Baseado em Cargos (RBAC).

- **Autenticação (Sign-In):** O login é gerido pelo `SignInUseCase`. Ele valida as credenciais através da `PasswordHasherPort` e, em caso de sucesso, delega a geração de um **Access Token** (curta duração) e um **Refresh Token** (longa duração) para retorno.
- **Identidade Contextual:** O frontend NUNCA envia o `userId` no corpo da requisição para alterações de dados. A identidade do usuário executor é interceptada pelo filtro de segurança e injetada no `SecurityContextHolder`. O Controller extrai a identidade desse contexto e repassa ao Caso de Uso.
- **RBAC (Role-Based Access Control):** Os usuários possuem a propriedade `role` (ex: `ADMIN`, `USER`). O filtro do Spring converte isso para autoridades padrão (ex: `ROLE_ADMIN`). A proteção de rotas deve ser feita na infraestrutura (`SecurityConfig`) baseada nestes papéis.
- **Validação de Posse (Ownership):** Sempre busque a entidade no banco e valide se ela pertence ao usuário autenticado ANTES de realizar deleções ou atualizações (ex: validar se a recompensa que o usuário quer deletar pertence ao `userId` do token atual).
- **Armazenamento de Senhas:** Nenhuma senha trafega pura além do limite do Controller. Elas são criptografadas imediatamente via `PasswordHasherPort` antes da persistência.

---

## 🚦 Regras de Validação por Camada

### Validação de Formato (Controllers e DTOs)
Validações simples e estruturais ficam em DTOs de entrada, utilizando `jakarta.validation`.
- O Controller deve usar `@Valid` nos parâmetros recebidos.
- Se o Controller receber uma lista no body (`List<DTO>`), a classe do Controller **DEVE** ser anotada com `@Validated` no topo.
- Campos de texto requerem limites claros (ex: `@Size`, `@NotBlank`).

### Validação de Negócio (Use Cases)
Regras de negócio, tratamento de erros e decisões de fluxo ficam nos Casos de Uso (`core/application`).
- Omissão de dados que dependem de estado condicional.
- Tratamento de plano gratuito (Ex: Limite máximo de instâncias criadas).

### Exceções
As exceções de negócio e aplicação devem ficar em `core/exceptions`. Não devem ter acoplamento com exceções genéricas de infraestrutura.

---

## 🎮 Motor de Economia e Gamificação
A IA deve assumir as seguintes regras matemáticas rígidas para geração de lógicas, testes e cálculos:

**Tabela de Ganho de XP por Dificuldade:**
- Trivial: +2 XP
- Fácil: +5 XP
- Médio: +15 XP
- Difícil: +30 XP
- Muito Difícil: +75 XP

**Curva de Evolução de Níveis (`UserLevel`):**
- `NOVICE`: 0 XP
- `APPRENTICE`: 100 XP
- `ADVENTURER`: 300 XP
- `CHALLENGER`: 750 XP
- `AMATEUR`: 1.500 XP
- `PROFESSIONAL`: 3.000 XP
- `EXPERT`: 6.000 XP
- `VETERAN`: 12.000 XP
- `MASTER`: 25.000 XP
- `LEGEND`: 60.000 XP

---

## 🐳 Infraestrutura Local (docker-compose)
A IA deve assumir e gerar configurações baseadas nestas portas padrão:
- PostgreSQL: `5432`
- Redis: `6379`
- RabbitMQ (Management): `15672`
- SonarQube: `9000`

---

## ⚖️ Regra Operacional Resumida
- Se uma classe precisa decidir, transformar erro de negócio ou controlar fluxo da aplicação, ela pertence a `core/application`.
- Se uma classe apenas traduz dados entre camadas (Mappers) ou realiza chamadas externas/salva arquivos, ela pertence a `adapters`.
- Se uma classe representa uma falha de regra ou um estado inválido do caso de uso, ela pertence a `core/exceptions`.