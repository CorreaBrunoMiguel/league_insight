# Etapa 2 — Infraestrutura & Dados Base · LeagueInsight Lab

A Etapa 2 é onde o LeagueInsight Lab ganha **esqueleto técnico e sangue de
dados**. O objetivo é sair de um repositório apenas documental para uma base
PERN capaz de:

- armazenar ligas, temporadas, times, partidas e snapshots de tabela;
- versionar datasets por temporada/fonte;
- rodar pipelines de ingestão histórica e da temporada atual;
- expor uma camada de acesso a dados limpa para as próximas Etapas (modelagem e
  observatório).

Quando a Etapa 2 terminar, o sistema ainda não precisa ter modelo preditivo
rodando, mas precisa estar **tecnicamente pronto** para isso.

---

## 1. Resumo Geral da Etapa 2

**Objetivo macro:** Construir a infraestrutura mínima e estável de dados
(PostgreSQL + backend Node + pipelines de ingestão) para suportar o MVP
científico do LeagueInsight Lab.

**Resultados esperados ao final da Etapa 2:**

- Schema relacional no PostgreSQL cobrindo:

  - ligas, temporadas, times, partidas, snapshots de tabela, features,
    datasets/versionamento.

- Backend Node (base) preparado para:

  - se conectar ao banco,
  - expor rotas de saúde e rotas internas de diagnóstico de dados.

- Pipelines batch capazes de:

  - ingerir e normalizar pelo menos **1 liga** em **5 temporadas históricas** +
    início da temporada atual, a partir de uma fonte (API/CSV) escolhida;
  - registrar metadados de versão (qual fonte, qual intervalo, quando foi
    ingestada).

- Dados minimamente populados para permitir:

  - consultas por temporada/rodada/time,
  - testes simples de consistência (contagem de jogos, soma de gols, etc.).

---

## 2. Fases da Etapa 2

### Fase 1 — Base PERN & Convenções Técnicas

**Intenção:** Erguer o “chassi” PERN, com backend estruturado, conexão com
Postgres e convenções de qualidade básicas.

**Sprints da Fase 1:**

- **Sprint 1 — Setup de backend Node**

  - Criar estrutura base (ex.: `src/`, `tests/`, config de TypeScript se for
    TS).
  - Rotas mínimas: `GET /api/status`, `GET /api/healthz`.
  - Configuração de testes (ex.: Jest) e scripts de `lint`/`test`.

- **Sprint 2 — Postgres & camada de acesso inicial**

  - Subir Postgres via Docker (ex.: `docker-compose.yml` simples).
  - Introduzir ORM/query builder (ex.: Prisma ou TypeORM) e conexão básica.
  - Definir convenções de nomes de schemas e migrações.

**Critério de conclusão da Fase 1:** Repo sobe com um comando
(`docker-compose up` + `npm run dev`/similar), API responde status, banco
conecta e migrações rodam limpas.

---

### Fase 2 — Modelagem Relacional & Versionamento de Datasets

**Intenção:** Transformar o modelo conceitual em tabelas reais e preparar o
terreno para versionar dados históricos.

**Sprints da Fase 2:**

- **Sprint 1 — Schema relacional núcleo esportivo**

  - Tabelas: `leagues`, `seasons`, `teams`, `matches`.
  - Respeitar chaves estáveis por time, liga e temporada.
  - Modelar `matches` com resultado e chaves para mandante/visitante.

- **Sprint 2 — Snapshots & versionamento de datasets**

  - Tabela `standing_snapshots` para tabela por rodada/time.
  - Tabelas/metadados de versionamento:

    - ex.: `datasets` (fonte, temporada, data ingestão, status).

  - Garantir que seja possível saber **qual versão de dados** foi usada em cada
    experimento futuro.

- **Sprint 3 — Features base & hooks para modelagem**

  - Introduzir tabela `features` ou visão materializada para features pré-jogo.
  - Registrar **versão do schema de features** (ex.: `features_schema_version`).

**Critério de conclusão da Fase 2:** Schema estável, com migrações versionadas e
capacidade de reconstruir o banco do zero para qualquer ambiente.

---

### Fase 3 — Pipelines de Ingestão Histórica & Temporada Atual

**Intenção:** Criar o “rio” que traz os dados brutos (APIs/CSVs) para dentro do
schema normalizado.

**Sprints da Fase 3:**

- **Sprint 1 — Ingestão de temporadas históricas (batch)**

  - Implementar job que:

    - lê dados de fonte escolhida (API/CSV),
    - normaliza para `matches`, `teams`, `seasons`,
    - registra dataset em `datasets`.

  - Ingerir pelo menos **1 temporada completa** como prova de conceito.

- **Sprint 2 — Snapshots de tabela & consistência**

  - Jobs para reconstruir `standing_snapshots` rodada a rodada.
  - Checks de consistência:

    - contagem de jogos/rodadas,
    - soma de pontos na liga,
    - validação básica de gols e resultados.

- **Sprint 3 — Temporada atual & reingestão incremental**

  - Pipeline para ingestão de rodadas novas da temporada atual.
  - Regras de atualização:

    - como detectar novos jogos concluídos,
    - como atualizar `datasets` e `standing_snapshots` sem quebrar histórico.

**Critério de conclusão da Fase 3:** Comando(s) ou jobs que, a partir de uma
fonte real, populam automaticamente N temporadas + temporada atual, com logs
legíveis e metadados em `datasets`.

---

### Fase 4 — Camada de Acesso a Dados para Etapas 3 e 4

**Intenção:** Servir os dados de forma coerente para a futura modelagem
(Etapa 3) e para o observatório (Etapa 4), mesmo antes das rotas públicas
“bonitas”.

**Sprints da Fase 4:**

- **Sprint 1 — Serviços/queries internas para modelagem**

  - Funções que retornam:

    - jogos de treino (temporadas passadas) já com contexto mínimo necessário,
    - jogos da temporada atual ainda não disputados com contexto pré-jogo.

  - Padrão claro para “janela temporal” (de/até quais temporadas rodar modelos).

- **Sprint 2 — Endpoints internos/auxiliares de dados**

  - Rotas (podem ser internas, prefixo `/api/dev` ou similar) para:

    - listar temporadas e status de ingestão,
    - listar times por temporada,
    - inspecionar alguns jogos com contexto (debug).

  - Servem tanto para debug, quanto como base para as rotas “bonitinhas” da
    Etapa 4.

**Critério de conclusão da Fase 4:** Modelagem (Etapa 3) já consegue consumir
jogos + contexto a partir dessa camada, sem mexer em SQL cru em cada
experimento.

---

## 3. Critérios de Conclusão da Etapa 2

A Etapa 2 será considerada concluída quando:

- [ ] Postgres e backend estiverem configurados com pipeline claro de migrações.
- [ ] O schema cobrir ligas, temporadas, times, partidas, snapshots e datasets
      versionados.
- [ ] Pelo menos uma liga em múltiplas temporadas tiver sido ingerida por
      pipelines batch.
- [ ] A temporada atual tiver caminho de ingestão incremental.
- [ ] Existirem serviços/queries que entregam dados prontos para modelagem e
      observatório.
- [ ] For possível reconstruir todo o banco (infra + ingestão) em um ambiente
      novo a partir da combinação:

  - código + migrações + jobs + documentação desta Etapa.

---
