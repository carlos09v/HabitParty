# Diretrizes Arquiteturais e Regras de Negócio - HabitParty

## 🛠️ Stack Tecnológica
- **Backend:** Java, Spring Boot, Maven
- **Banco de Dados:** PostgreSQL (principal), Redis (cache)
- **Mensageria:** RabbitMQ
- **Qualidade:** SonarQube
- **Acesso local ao banco:** DBeaver

---

## 🏛️ Arquitetura Hexagonal (Ports and Adapters)
O projeto segue estritamente a Arquitetura Hexagonal. As dependências devem sempre apontar para o centro, e o centro é o núcleo de negócio.

### Estrutura de Pacotes Obrigatória

1. **`core/domain` (Núcleo de Negócio):** Entidades puras, Value Objects e Enums (Sem anotações de infraestrutura).
2.**`core/exception` (Tratamento de Erros):**
3. **`application/usecases` (Casos de Uso):** Orquestração das regras de negócio, injeção de dependência via construtor e tratamento de erros (Uma classe por Caso de Uso).
4. **`application/ports` (Contratos):** Interfaces unificadas usadas para desacoplar o núcleo das implementações concretas do banco de dados (ex: `RewardRepositoryPort`).
5. **`adapters/in/web` (Porta de Entrada):**
    * `/`: Controladores REST.
    * `/dtos/request`: DTOs de entrada (`records` com validação `jakarta`).
    * `/dtos/response`: DTOs de saída blindados (escondendo informações sensíveis).
6. **`adapters/out/persistence` (Porta de Saída):**
    * `/`: Classes Adaptadoras (Anotadas com `@Component`) que implementam as Ports do Core.
    * `/entities`: Entidades JPA (com anotações do Lombok e Hibernate).
    * `/repositories`: Interfaces do Spring Data (`JpaRepository`).
    * `/mappers`: Conversores bidirecionais entre Entidade de Domínio e JpaEntity.
7. **`infrastructure` (Configurações):** Beans do Spring, segurança, tratamento global de exceções e configurações técnicas.

### Leitura da Estrutura Atual (Persistência)
Na estrutura atual do `habitparty-api`, o pacote de persistência já está seguindo a borda externa da arquitetura:
- O **Adapter** (ex: `UserAdapter`) fica em `adapters/out/persistence` e implementa a port (`UserRepository`). Possui a anotação `@Component` do Spring para injeção de dependência.
- O **Mapper** (ex: `UserMapper`) fica em `adapters/out/persistence` e faz APENAS a tradução entre as classes de Domínio e as Entidades JPA.

---

## 🚫 Regra Máxima: Pureza do Domínio
O pacote `core/domain` **NÃO PODE** conter nenhuma tecnologia de infraestrutura.

- **Proibido:** Anotações do Spring (`@Service`, `@Component`, `@Autowired`).
- **Proibido:** Anotações de Persistência/JPA (`@Entity`, `@Table`, `@Id`, `@Column`).
- **Proibido:** Dependências de bibliotecas de infraestrutura, web ou banco de dados.
- Toda comunicação com o banco de dados deve ser feita mapeando uma entidade de domínio pura para uma entidade JPA através de um Mapper no Adapter.

### Tipagem Crítica (Regra de Ouro)
- **Moedas, Preços e Saldos:** Variáveis financeiras ou de economia (`current_coins`, `total_gold_earned`, `price`, `amount`) **DEVEM** usar obrigatoriamente `BigDecimal`. É estritamente proibido o uso de `Double` ou `Float`.
- **Pontos e Ordem:** Atributos matemáticos inteiros (`totalXp`, `currentStreak`, `orderIndex`) devem usar o tipo primitivo `int` no Java.

### Atributos Derivados vs. Persistidos
- O cálculo do Nível de Usuário (`UserLevel`) é responsabilidade exclusiva da entidade de Domínio `User`, calculado em tempo real ("on the fly") com base no `totalXp`. O Nível **NÃO** deve ser persistido como uma coluna no banco de dados.
- O saldo total histórico (`total_gold_earned`) é um caso de Desnormalização para Leitura e **DEVE** ser persistido para evitar queries pesadas no `transaction_history` em validações de conquistas (Achievements).

---

## 🛡️ Segurança e Identidade
- **Nunca confie no Frontend:** DTOs de criação/atualização NUNCA devem receber o `userId` em seu escopo/body. 
- A identidade do usuário executor deve sempre ser extraída via `@RequestHeader("X-User-Id")` (ou contexto de segurança equivalente) no Controller e repassada como argumento separado para o Caso de Uso.
- **Validação de Posse (Ownership):** Sempre busque a entidade no banco e valide se ela pertence ao usuário logado ANTES de realizar deleções ou atualizações (ex: `workspace.validateOwnership(userIdLogado)`).

---

## 🚦 Regras de Validação por Camada

### Validação de Formato (Controllers e DTOs)
Validações simples e estruturais ficam em DTOs de entrada, utilizando `jakarta.validation`.
- O Controller deve usar `@Valid` nos parâmetros recebidos em requisições únicas.
- Se o Controller receber uma lista no body (`List<DTO>`), a classe do Controller **DEVE** ser anotada com `@Validated` no topo.
- Campos de texto requerem limites claros (ex: `@Size`, `@NotBlank`). Valores numéricos base precisam de travas lógicas (ex: `@PositiveOrZero`).

### Validação de Negócio (Use Cases)
Regras de negócio, tratamento de erros e decisões de fluxo ficam nos Casos de Uso (`core/application`).
- Omissão de dados que dependem de estado condicional (Ex: Omissão de `packageLevel` se não for tipo `TIME_BASED`).
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
- Se uma classe apenas traduz dados entre camadas (Mappers) ou realiza chamadas externas, ela pertence a `adapters`.
- Se uma classe representa uma falha de regra ou um estado inválido do caso de uso, ela pertence a `core/exceptions`.