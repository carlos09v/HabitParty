# 🛠️ HabitParty - Guia do Desenvolvedor & Notas Internas

Este documento reúne comandos úteis de manutenção, dicas de ambiente local, ferramentas auxiliares e notas de concepção do projeto.

---

## 🐳 Comandos e Manutenção Docker

Comandos úteis para diagnóstico e gerenciamento dos containers locais do PostgreSQL:

### Espaço em disco e diagnóstico
```bash
# Verificar quanto espaço o Docker está consumindo em disco (imagens, containers e volumes)
docker system df

# Listar containers em execução
docker ps

# Listar todos os containers (incluindo parados)
docker ps -a
```

### Ciclo de vida dos containers
```bash
# Iniciar os containers existentes (sem reconstruir)
docker compose start

# Parar os containers
docker compose stop

# Parar e remover os containers
docker compose down

# Reset total (remove containers E apaga o volume de dados do PostgreSQL)
docker compose down -v
```

---

## 🔌 Testes de API & Clientes HTTP (Swagger / Bruno / Postman)

A documentação visual e interativa da API está disponível via Swagger:
* **Swagger UI:** `http://localhost:8080/swagger-ui.html`
* **OpenAPI 3.0 JSON:** `http://localhost:8080/v3/api-docs`

> **Dica:** O JSON do endpoint `/v3/api-docs` pode ser importado diretamente em clientes HTTP como **Bruno**, **Postman** ou **Insomnia** para gerar automaticamente a coleção de requisições de todos os endpoints da API.

---

## 🔐 Variáveis de Ambiente no Terminal (.env)

Caso precise exportar as variáveis de ambiente do arquivo `.env` para a sessão atual do seu terminal bash/zsh antes de iniciar o Spring Boot:

```bash
# Carrega automaticamente todas as variáveis declaradas no .env para o shell
set -a && source .env && set +a
```

---

## 📋 Checklist Original de Concepção e Modelagem

Histórico das etapas de modelagem e design utilizadas na concepção do motor:

1. Apoio de Inteligência Artificial com Opencode e GitHub Copilot
2. Modelagem conceitual no Lucidchart
3. Modelagem lógica no Lucidchart
4. Modelagem de classes e sequência no Lucidchart usando UML
5. Modelagem da estrutura de pastas da Arquitetura Hexagonal
6. Criação de telas e prototipação no Figma
7. Criação e orquestração do `docker-compose.yml`
8. Configuração do ambiente local com serviços essenciais
9. Inicialização da API com Maven e Spring Boot (Java 25)
