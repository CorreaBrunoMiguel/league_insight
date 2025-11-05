# Fase 4 — Serviços de Dados para Modelagem & Observatório · Etapa 2

📖 **Resumo Geral da Fase**

A Fase 4 pega o banco já populado (histórico + temporada atual) e constrói
**serviços de leitura** que vão alimentar:

- a Etapa 3 (modelos preditivos),
- o Observatório (dashboards da Etapa 4+).

Foco em:

- consultas bem definidas para **datasets de treino** (matches + features +
  standings),
- endpoints de leitura para **ligas, seasons, standings e partidas**,
- documentação mínima da API.

Ao final desta fase, será possível:

- consultar, via API/serviços, dados prontos para modelagem,
- consultar standings e partidas de forma estruturada para o frontend,
- entender claramente quais endpoints existem e o que retornam.

---

## Sprint 1 — Serviços de dados para treino de modelos

🎯 **Resumo da Sprint**

Entregar serviços que exponham “fatias” de dados prontos para treino:

- jogos de uma season ou janela de rodadas,
- com standings associados (posição pré-jogo),
- com features (quando existirem),
- em formato adequado para export (JSON/CSV).

### Tarefa E2-F4-S1-T1 — Serviço interno de consulta de dataset de treino por temporada

**Resumo:**  
Criar um serviço (módulo/Classe/função) no backend que:

- recebe parâmetros como:
  - `seasonId` (ou `leagueCode + year`),
  - intervalo de rodadas (`roundStart`, `roundEnd`),
- retorna uma lista de jogos com:
  - metadados do jogo (`Match`),
  - posição/tabela antes do jogo (`StandingSnapshot` da rodada anterior),
  - features (`MatchFeatures`, se existirem para aquele `FeatureSchema`).

---

### Tarefa E2-F4-S1-T2 — Endpoint ou CLI para export de dataset de treino

**Resumo:**  
Expor o serviço da T1 via:

- endpoint REST (`GET /train-datasets/basic`) **ou** script CLI
  (`npm run export:train-dataset`),
- permitindo exportar o dataset de treino em JSON e/ou CSV.

---

### Tarefa E2-F4-S1-T3 — Validação básica e logs do dataset de treino

**Resumo:**  
Adicionar:

- validações simples (ex.: nenhum jogo sem snapshot prévio, nenhuma feature
  faltando quando `featureSchemaId` é informado),
- logs/resumo: número de jogos retornados, intervalo de rodadas, season,
- estrutura de erros clara se o dataset pedido for impossível (ex.: rodadas fora
  do range).

---

## Sprint 2 — Serviços de Observatório (standings & partidas)

🎯 **Resumo da Sprint**

Construir endpoints REST para alimentar o Observatório:

- listar ligas e temporadas,
- consultar standings por rodada,
- listar partidas com filtros.

### Tarefa E2-F4-S2-T1 — Endpoints de ligas e seasons

**Resumo:**  
Criar endpoints como:

- `GET /leagues` — lista ligas,
- `GET /leagues/:leagueCode/seasons` — seasons dessa liga,
- `GET /seasons/:seasonId` — detalhes de uma season.

---

### Tarefa E2-F4-S2-T2 — Endpoint de standings por rodada

**Resumo:**  
Criar um endpoint:

- `GET /seasons/:seasonId/standings?round=X`
- que retorna a tabela da rodada X (ou última rodada se `round` não for
  passado),
- com posição, pontos, vitórias, empates, derrotas, saldo, etc.

---

### Tarefa E2-F4-S2-T3 — Endpoint de partidas com filtros

**Resumo:**  
Criar um endpoint:

- `GET /seasons/:seasonId/matches` com filtros:
  - `round` ou intervalo (`roundStart`, `roundEnd`),
  - `teamId` (jogos de um time),
  - opcionalmente `result` (HOME_WIN/DRAW/AWAY_WIN),
- retornando a lista de jogos, ordenados por rodada/data.

---

## Sprint 3 — Envelope de API & Documentação

🎯 **Resumo da Sprint**

Deixar a API “apresentável”:

- healthcheck,
- versão,
- docs mínimas dos endpoints.

### Tarefa E2-F4-S3-T1 — Endpoint de healthcheck e versão da API

**Resumo:**  
Adicionar:

- `GET /health` — retorna algo simples (`status: ok`, conexão db ok),
- `GET /version` — retorna versão da API/app (pode vir de env ou
  `package.json`).

---

### Tarefa E2-F4-S3-T2 — Documentação mínima dos endpoints (Markdown)

**Resumo:**  
Criar um doc:

- `doc/api_reference.md` (ou similar),
- listando endpoints, parâmetros, respostas,
- exemplos de chamadas (curl/HTTPie).

---

### Tarefa E2-F4-S3-T3 — “Data service layer” organizado

**Resumo:**  
Refinar a organização do código:

- agrupar as funções de consulta de dados (treino + observatório) em
  módulos/serviços (`services/` ou `modules/`),
- evitar lógica de query diretamente nos controllers/rotas,
- deixar a camada de dados pronta pra ser reutilizada pela Etapa 3 (modelos) e
  pelo frontend.
