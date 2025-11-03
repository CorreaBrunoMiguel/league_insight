# Fase 2 — Modelagem Relacional & Versionamento de Datasets · Etapa 2

📖 **Resumo Geral da Fase**

A Fase 2 transforma o modelo conceitual do LeagueInsight Lab em um **schema
relacional concreto** no PostgreSQL, usando Prisma, e prepara a base para
**versionar datasets** por temporada/fonte.  
Ao final desta Fase, o banco deve representar claramente:

- ligas, temporadas, times e partidas,
- snapshots de tabela por rodada,
- datasets versionados (fonte, temporada, ingestão),
- um ponto inicial para features pré-jogo.

Essas estruturas serão usadas nas próximas fases para ingestão histórica,
construção de features e treino de modelos.

---

## Sprint 1 — Schema núcleo: ligas, temporadas, times e partidas

🎯 **Resumo da Sprint**

Modelar e criar o coração do banco: entidades centrais de campeonato de pontos
corridos.

### Tarefa E2-F2-S1-T1 — Modelar ligas, temporadas e times

**Resumo:**  
Criar modelos Prisma e migrações para:

- `League` (liga/campeonato),
- `Season` (temporada de uma liga),
- `Team` (time participante).

Garantir chaves estáveis (IDs) e relacionamentos corretos (Season → League, Team
→ League opcional/geral).

---

### Tarefa E2-F2-S1-T2 — Modelar partidas (matches) com resultado básico

**Resumo:**  
Criar o modelo `Match` com:

- relação com `Season`,
- relação com time mandante e visitante,
- campos de data, rodada, gols mandante/visitante,
- campo de resultado em 3 classes (ex.: `home_win`, `draw`, `away_win`).

---

### Tarefa E2-F2-S1-T3 — Índices e sanidade básica do schema núcleo

**Resumo:**  
Adicionar índices e constraints principais:

- índices por temporada/rodada,
- unicidade de partida por (season, rodada, mandante, visitante),
- índices úteis para consultas por time e temporada.

Garantir que o schema esteja otimizado para consultas frequentes do
LeagueInsight.

---

## Sprint 2 — Datasets & snapshots de tabela

🎯 **Resumo da Sprint**

Introduzir versionamento de datasets (para saber qual fonte/rodada/tempo gerou
quais dados) e a estrutura de snapshots de tabela rodada a rodada.

### Tarefa E2-F2-S2-T1 — Tabela de datasets versionados

**Resumo:**  
Criar o modelo `Dataset` para registrar ingestões:

- fonte (API/CSV),
- liga/temporada,
- tipo (histórico, temporada_atual),
- timestamps (ingested_at),
- status (ex.: `pending`, `ok`, `failed`).

Cada pipeline de ingestão futura vai registrar sua execução aqui.

---

### Tarefa E2-F2-S2-T2 — Tabela de snapshots de tabela (standing_snapshots)

**Resumo:**  
Criar o modelo `StandingSnapshot` para representar a classificação em uma
rodada:

- season,
- rodada,
- time,
- pontos, vitórias, empates, derrotas,
- gols pró, gols contra, saldo,
- posição.

---

### Tarefa E2-F2-S2-T3 — Amarrar matches e datasets

**Resumo:**  
Adicionar relacionamento entre `Match` e `Dataset` (ex.: `datasetId` opcional)
para sabermos **de qual ingestão** veio cada registro de partida, permitindo
reconstruir experimentos com base na versão do dataset.

---

## Sprint 3 — Features base & esquema de features

🎯 **Resumo da Sprint**

Construir a base para features pré-jogo, incluindo uma forma de versionar o
“esquema de features” e armazenar features derivadas.

### Tarefa E2-F2-S3-T1 — Modelo para versão de esquema de features

**Resumo:**  
Criar um modelo `FeatureSchema` ou similar para registrar:

- nome da versão,
- descrição,
- lista (ou referência) das features incluídas,
- data de criação.

Servirá para saber **qual conjunto de features** foi usado em cada modelo no
futuro.

---

### Tarefa E2-F2-S3-T2 — Tabela de features por partida

**Resumo:**  
Criar um modelo `MatchFeatures` (ou equivalente) que contenha:

- referência à `Match`,
- referência à `FeatureSchema`,
- campos numéricos/categóricos básicos (ex.: pontos acumulados, posição, saldo,
  forma recente simplificada).

Nesta Fase, o foco é estrutural; o cálculo real das features será trabalhado na
Etapa 3.

---

### Tarefa E2-F2-S3-T3 — Índices e suporte a consultas de treino

**Resumo:**  
Adicionar índices e ajustes necessários em `Match`, `StandingSnapshot`,
`MatchFeatures` para:

- selecionar rapidamente conjuntos de treino (ex.: todas as partidas de N
  temporadas com features válidas),
- preparar o terreno para jobs de treino de modelos na Etapa 3.

---
