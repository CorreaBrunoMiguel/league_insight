# Fase 1 — Base PERN & Convenções Técnicas · Etapa 2

📖 **Resumo Geral da Fase**

A Fase 1 da Etapa 2 tem como objetivo levantar o **esqueleto de backend +
Postgres** e definir as convenções mínimas de qualidade do projeto (estrutura,
testes, status endpoints). Ao final desta fase, o LeagueInsight Lab deve ter:

- um projeto Node.js estruturado (com TypeScript + Express),
- endpoints básicos de saúde e status da API,
- um ambiente Postgres acessível via Docker,
- uma camada inicial de acesso ao banco,
- testes e scripts fundamentais para garantir que qualquer desenvolvimento
  futuro já nasça dentro de um “invólucro” saudável.

---

## Sprint 1 — Setup de Backend Node & Convenções de Qualidade

🎯 **Resumo da Sprint**

Esta sprint foca em **inaugurar o backend**: criar a estrutura base do projeto
Node.js, configurar TypeScript, scripts de build/test e expor endpoints mínimos
de status, já com testes automatizados cobrindo o comportamento mais simples da
API.

### Tarefa E2-F1-S1-T1 — Inicializar projeto Node.js/TypeScript com estrutura base

**Resumo:** Criar o projeto Node.js com TypeScript e Express, definindo a
estrutura inicial de pastas (`src/`, `tests/`), scripts básicos em
`package.json` e integração com o ambiente já existente do repositório (sem
interferir na `.prettierrc` atual).

### Tarefa E2-F1-S1-T2 — Implementar endpoints de status e saúde da API

**Resumo:** Adicionar endpoints mínimos para inspeção rápida do backend:

- `GET /api/status` — informações básicas sobre a aplicação (versão, modo,
  uptime).
- `GET /api/healthz` — checagem simples de saúde da API (útil para monitoramento
  e debug).

### Tarefa E2-F1-S1-T3 — Configurar testes automatizados e checagens básicas

**Resumo:** Configurar uma stack de testes (por exemplo, Jest) e criar testes
iniciais para os endpoints de status/health. Definir scripts como:

- `test`,
- `test:watch`,
- eventualmente `lint` (mesmo que simples no começo),

garantindo que futuras Tarefas só sejam consideradas concluídas com testes
passando.

---

## Sprint 2 — Postgres & Camada de Acesso Inicial

🎯 **Resumo da Sprint**

Esta sprint liga o backend ao mundo dos dados, provendo:

- um Postgres reprodutível via Docker,
- um mecanismo formal de acesso ao banco (ORM/query builder),
- uma verificação mínima de conectividade e migrações iniciais.

### Tarefa E2-F1-S2-T1 — Subir ambiente Postgres com Docker Compose

**Resumo:** Criar um `docker-compose.yml` (ou equivalente) para subir um serviço
Postgres com parâmetros reprodutíveis (nome do banco, usuário, senha) e preparar
o projeto para trabalhar em ambientes isolados (dev/local) sem depender de
instalações manuais de Postgres na máquina.

### Tarefa E2-F1-S2-T2 — Integrar ORM/query builder e conexão com o banco

**Resumo:** Escolher e integrar um ORM ou query builder (por exemplo, Prisma ou
TypeORM) para padronizar o acesso ao Postgres. Configurar:

- conexão baseada em variáveis de ambiente,
- script inicial de migração,
- ponto único de inicialização da camada de dados na aplicação.

### Tarefa E2-F1-S2-T3 — Implementar checagem de saúde da conexão com o banco

**Resumo:** Adicionar uma rota ou mecanismo interno (ex.: `GET /api/healthz`
enriquecido ou endpoint dedicado) que valide:

- se a aplicação consegue se conectar ao Postgres,
- se as migrações mínimas foram aplicadas,

permitindo diagnosticar problemas de infra/dados de forma rápida e padronizada.

---

🧭 **Encerramento da Fase 1**

Com a Fase 1 concluída, o LeagueInsight Lab terá:

- backend Node.js + TypeScript + Express rodando,
- testes básicos configurados,
- Postgres orquestrado por Docker,
- camada inicial de acesso a dados e checagem de saúde DB/API.

A partir daqui, as próximas Fases da Etapa 2 (schema relacional, versionamento
de datasets, ingestão histórica, etc.) passam a construir em cima de um terreno
técnico sólido.
