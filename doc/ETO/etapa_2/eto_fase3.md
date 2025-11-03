# Fase 3 — Pipelines de Ingestão Histórica & Temporada Atual · Etapa 2

📖 **Resumo Geral da Fase**

A Fase 3 constrói os **pipelines batch** que irão popular o schema do
LeagueInsight Lab com dados reais de campeonatos:

- ingestão de temporadas históricas (5 últimas),
- reconstrução de snapshots de tabela por rodada,
- ingestão incremental da temporada atual.

Ao final desta Fase, será possível:

- repovoar o banco (ligas, seasons, teams, matches, standings) a partir da fonte
  escolhida,
- saber, via `Dataset`, **de qual ingestão veio cada partida**,
- deixar a base pronta para a Etapa 3 (modelagem) e Etapa 4 (observatório).

---

## Sprint 1 — Ingestão de temporadas históricas

🎯 **Resumo da Sprint**

Criar pipelines para ingerir temporadas completas passadas de uma liga em
formato normalizado no schema atual.

### Tarefa E2-F3-S1-T1 — Job de ingestão de 1 temporada histórica (prova de conceito)

**Resumo:**  
Implementar um job (script Node) que:

- lê dados de **uma** temporada histórica (ex.: CSV ou API),
- popular `League`, `Season`, `Team`, `Match` com dados coerentes,
- registra um `Dataset` (`type = HISTORICAL`) com `status = OK` ao final.

---

### Tarefa E2-F3-S1-T2 — Generalizar ingestão para múltiplas temporadas históricas

**Resumo:**  
Evoluir o job para suportar ingestão de N temporadas de uma mesma liga (ex.:
últimas 5):

- rodar o pipeline por temporada,
- evitar duplicidade de ligas/times,
- criar um `Dataset` por temporada ingestada.

---

### Tarefa E2-F3-S1-T3 — Logging e idempotência básica dos jobs históricos

**Resumo:**  
Adicionar:

- logs claros (início/fim, totais de jogos/times, tempo de execução),
- proteção mínima contra reprocessar a mesma temporada sem querer (checando
  `Dataset` existente),
- convenção de CLI (ex.: `npm run ingest:season -- --year=2022`).

---

## Sprint 2 — Reconstrução de snapshots & consistência

🎯 **Resumo da Sprint**

A partir das partidas ingeridas, reconstruir a tabela rodada a rodada, populando
`StandingSnapshot` e validando consistência.

### Tarefa E2-F3-S2-T1 — Job de reconstrução de standings para 1 temporada

**Resumo:**  
Implementar job que:

- lê todas as partidas de uma `Season`,
- percorre rodada a rodada,
- calcula pontos, vitórias, empates, derrotas, gols pró/contra, saldo, posição,
- preenche `StandingSnapshot` com `@@unique([seasonId, round, teamId])`
  respeitado.

---

### Tarefa E2-F3-S2-T2 — Checks de consistência por temporada

**Resumo:**  
Adicionar checks que validem, por temporada:

- total de jogos condizente com o formato da liga,
- somas de pontos na tabela,
- nenhum time “sumindo” de rodadas intermediárias.

Registrar esses checks (ex.: log estruturado ou tabelinha auxiliar).

---

### Tarefa E2-F3-S2-T3 — Integração pipelines históricos + standings

**Resumo:**  
Costurar os jobs para que, ao finalizar uma ingestão histórica de temporada:

- o job de standings seja executado automaticamente,
- `Dataset` da temporada seja marcado como totalmente “pronto” (dados +
  standings),
- erros sejam refletidos em `Dataset.status = FAILED` quando apropriado.

---

## Sprint 3 — Temporada atual & ingestão incremental

🎯 **Resumo da Sprint**

Construir pipelines que acompanham a **temporada em andamento**, ingestando
novas rodadas à medida que terminam.

### Tarefa E2-F3-S3-T1 — Job de ingestão da temporada atual (estado inicial)

**Resumo:**  
Criar um job que:

- ingira a temporada atual até a rodada mais recente,
- crie `Season` se necessário,
- popular `Match` e `StandingSnapshot` até o ponto atual,
- registre `Dataset` com `type = CURRENT_SEASON`.

---

### Tarefa E2-F3-S3-T2 — Ingestão incremental de novas rodadas

**Resumo:**  
Adicionar lógica para:

- detectar quais rodadas novas já podem ser ingestadas (jogos concluídos),
- inserir apenas os novos jogos,
- atualizar standings a partir desses jogos,
- atualizar ou criar novo `Dataset` para cada “janela” ingestada.

---

### Tarefa E2-F3-S3-T3 — Rotina unificada de atualização da temporada atual

**Resumo:**  
Oferecer uma interface simples (ex.: script ou comando npm) para:

- rodar ingestão incremental da temporada atual,
- atualizar standings,
- registrar `Dataset` e logs,
- ser futuramente agendável (cron / scheduler) sem refactor grande.

---
