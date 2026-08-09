# Setup e Ferramentas - HabitParty
Este documento detalha o processo de inicialização do projeto backend e as configurações das ferramentas de Inteligência Artificial para agilizar o desenvolvimento utilizando a Arquitetura Hexagonal.

## 1. Tutorial de Setup: Spring Initializr com Maven no VS Code
0. Instale a extensão `Spring Initializr Java Support`
1. Pressione Ctrl + Shift + P e digite/selecione `Spring Initializr: Create a Maven Project.`
2. Spring Boot Version: Escolha a versão mais recente que contenha apenas números (ex: 3.3.0 ou superior). Nunca escolha as que terminam em (SNAPSHOT) ou (M1/RC1), pois são versões de teste.
3. Project Language: Selecione Java.
4. Group Id: Digite `com.habitparty` (Este é o "domínio base" da sua aplicação).
5. Artifact Id: Digite `habitparty-api` (Este é o nome do projeto/módulo em si).
6. Package Name: O VS Code vai sugerir com.habitparty.habitparty_api. Altere para `com.habitparty`. Isso garante que a raiz do seu código será limpa.
7. Packaging type: Selecione `Jar` (É o padrão para APIs modernas e microsserviços).
8. Java Version: Selecione 25 (É a versão LTS atual - suporte de longo prazo).
9. Dependencies: Uma lista de pesquisa vai se abrir. Busque e marque as seguintes caixas:
- Spring Web (Para criar os Controllers REST).
- Spring Data JPA (Para a comunicação abstrata com o banco de dados).

## 2. Automação de Código: Skills de Inteligência Artificial
Para garantir a consistência da Arquitetura Hexagonal, utilizamos três skills atômicas no assistente de IA. Configure-as no seu editor utilizando as instruções abaixo.

### 2.1. Skill: /create-core
Responsável por gerar o núcleo puro da aplicação (Regras de Negócio).

Instrução:
Atue como um Arquiteto Java Sênior. Ao executar esta skill, receberei o nome de uma entidade, seus atributos, os Casos de Uso desejados e os métodos da Porta de Saída. Crie a estrutura central (Core) seguindo estritamente a Arquitetura Hexagonal:

1. Entidade de Domínio: Crie a classe pura em core/domain. Gere manualmente o construtor completo, os métodos getters para todos os campos e os setters estritamente necessários para a regra de negócio. NUNCA utilize Lombok ou anotações do Spring nesta classe. Lógicas derivadas devem ficar nos getters correspondentes.
2. Use Case: Crie UMA CLASSE SEPARADA em core/application/usecases para cada Caso de Uso solicitado no prompt (ex: CreateRewardUseCase, DeleteRewardUseCase). Elas orquestrarão as regras de negócio sem anotações do Spring. Defina a variável da Porta correspondente (Ex: private final RewardRepository port;), crie o construtor para injeção de dependência e o método execute.
3. Request DTO: Crie a classe em adapters/in/web/dtos/request usando record do Java. Aplique as anotações do jakarta.validation (@NotBlank, @NotNull, @PositiveOrZero, etc.) de acordo com os tipos de campo fornecidos.
4. Ports: Crie a interface em `application/ports`. Regra vital: Métodos de persistência na interface DEVEM trafegar apenas a Entidade de Domínio, nunca o DTO (ex: save(Reward reward)).

Regras Absolutas: Use BigDecimal para economia/dinheiro e int para XP/níveis. Não importe bibliotecas web ou de banco de dados no núcleo.

Exemplo de Prompt de Atalho (Como usar no chat):
`/create-core Reward. Campos: id (UUID), name (String), description (String), price (BigDecimal), category (Enum). Use Cases: CreateReward, ListAllRewards, DeleteReward. Port: save(Reward), findAll(), delete(UUID).`

### 2.2. Skill: /create-jpa
Responsável por gerar a camada de banco de dados e infraestrutura baseada no Domínio.

Instrução base: Atue como um Engenheiro de Banco de Dados Java. Ao executar esta skill, receberei o nome de uma entidade cujo Domínio já existe. Gere a camada de persistência (Out Adapter):

1. JpaEntity: Crie em adapters/out/persistence/entities. Use as anotações do Lombok (@Entity, @Table, @Getter, @Setter, @NoArgsConstructor, @AllArgsConstructor). Mapeie o ID para geração automática de UUID (@GeneratedValue). Mapeie os campos lendo a entidade de Domínio existente.
2. Spring Repository: Crie a interface que estende JpaRepository<EntidadeJpa, UUID>.
3. Mapper: Crie a classe em adapters/out/persistence/mappers para traduzir estritamente de Domínio para JpaEntity e vice-versa.
4. Adapter: Crie a classe em adapters/out/persistence (anotada com @Component) que implementa a Porta de saída (Port) criada no Core. Injete o Spring Repository e use o Mapper para trafegar os dados.

Exemplo de Prompt de Atalho (Como usar no chat):
`/create-jpa Reward`

### 2.3. Skill: /create-web
Responsável por gerar os endpoints, regras HTTP e os DTOs blindados de saída.

Instrução base: Atue como um Desenvolvedor Backend API. Ao executar esta skill, receberei o nome da entidade e as rotas REST. Crie a camada de entrada (In Adapter):

1. Response DTO: Crie em adapters/in/web/dtos/response. Deve ser um record contendo o método estático public static EntidadeResponseDTO fromDomain(Entidade dominio). Nunca inclua dados sensíveis ou senhas.
2. Controller: Crie a classe REST em adapters/in/web/controllers anotada com @RestController, @RequestMapping e @Validated (se lidar com listas).
3. Regras de Endpoints: NUNCA devolva entidades de Domínio ou JPA diretamente, apenas Response DTOs. Respeite os HTTP Status (201 para POST, 204 para DELETE, 200 para GET). Para ações que dependem do usuário logado, extraia a identidade OBRIGATORIAMENTE via @RequestHeader("X-User-Id") UUID userIdLogado e não pela URL, para prevenir IDOR.

Exemplo de Prompt de Atalho (Como usar no chat):
`/create-web Reward. Endpoints: POST /rewards, GET /rewards, DELETE /rewards/{id}`