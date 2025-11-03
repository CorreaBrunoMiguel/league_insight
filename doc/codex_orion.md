# Codex Orion · LeagueInsight Lab

O Echo Codex é o momento em que o LeagueInsight Lab deixa de ser apenas conceito
e passa a existir como **repositório vivo**, com regras claras de estrutura,
branches e commits. É o contrato entre: documentação Orion, código, dados e
experimentos.

---

## 1. Declaração de Repositório Vivo

- Este documento assume que os arquivos abaixo já existem e estão consolidados:

  - `doc/00_semente_orion.md`
  - `doc/01_genese_orion.md`
  - `doc/02_fundacao_orion.md`

- A partir do primeiro commit contendo esses três + este
  `03_echocodex_orion.md`, o repositório do **LeagueInsight Lab** é considerado:

  - **repositório vivo Orion**, regido pelo Protocolo Orion v3.7;
  - base oficial de implementação para todas as Etapas ≥ 2.

Estado inicial de branches:

- `main`

  - linha de releases estáveis (sempre em estado “apresentável”).

- `develop`

  - branch padrão de desenvolvimento contínuo;
  - todas as features partem de `develop` e voltam para ela via merge.

---

## 2. Layout Inicial de Diretórios (pré-implementação)

Antes de qualquer código de Etapa 2, o layout mínimo previsto é:

- `/doc/`

  - `00_semente_orion.md`
  - `01_genese_orion.md`
  - `02_fundacao_orion.md`
  - `03_echocodex_orion.md`
  - (futuro) `/ETO/` — documentação das Etapas de implementação.

- `/` (raiz)

  - `README.md` — resumo do projeto, linkando para os quatro docs Orion.
  - `LICENSE` (a definir na Etapa 2, mas já previsto aqui como arquivo raiz).
  - `.gitignore` — com foco inicial em Node/PostgreSQL e artefatos de dados
    temporários.

Arquivos como `package.json`, configuração de ferramentas e estrutura de código
PERN serão criados **a partir da Etapa 2**, seguindo as Tarefas definidas em
`overview_etapa2`.

---

## 3. Padrão de Branches

Padrão geral:

- `main` → releases estáveis do LeagueInsight Lab.
- `develop` → fluxo contínuo de desenvolvimento.

Branches de trabalho (features, fixes, etc.) seguem a convenção:

`feature/e<etapa>-f<fase>-s<sprint>-t<tarefa>-<slug-descritivo>`

Exemplos futuros:

- `feature/e2-f1-s1-t1-schema-db-ligas-temporadas`
- `feature/e2-f1-s2-t2-ingestao-season-2021`
- `feature/e3-f1-s1-t3-modelo-logistico-baseline`

Para correções específicas:

- `fix/e<etapa>-f<fase>-s<sprint>-t<tarefa>-<slug>` (mesma lógica, apenas
  trocando o prefixo).

Merges em `develop` e `main` devem ser feitos com **merge commit explícito**
(sem squash destrutivo da história Orion).

---

## 4. Padrão de Commits & Tags

Commits seguem convenção semântica com emoji na frente:

- `✨ feat:` novas funcionalidades (código ou pipeline).
- `🐛 fix:` correções de bug.
- `🛠️ refactor:` refatorações sem mudança de comportamento.
- `🧪 test:` adição ou ajuste de testes.
- `📝 docs:` alterações de documentação (incluindo ETO).
- `🔧 build:` ajustes de build/configuração.
- `🚀 release:` commits que fecham uma versão estável em `main`.
- `🧹 chore:` tarefas de manutenção (limpeza, ajustes menores).
- `🔭 perf/otel:` melhorias de desempenho ou telemetria (quando aplicável).
- `🛡️ security:` mudanças focadas em segurança.

Formato recomendado:

`✨ feat(e2-f1-s1-t1): criar schema base de ligas/temporadas`

Tags de release (quando o MVP for ganhando marcos) podem seguir:

- `v0.1.0-leagueinsight-mvp-dados`
- `v0.2.0-leagueinsight-modelo-baseline`
- `v1.0.0-leagueinsight-mvp-cientifico`

---

## 5. Integração Documentação ↔ Código ↔ Dados

A partir da **Etapa 2**, cada Etapa ganhará:

- `doc/ETO/etapa_<X>/overview_etapa<X>.md`

  - plano da Etapa: Fases, Sprints, Tarefas/Subtarefas.

- `doc/ETO/etapa_<X>/eto_fase<Y>.md`

  - execução viva da Fase:

    - **Pt.1 — Registro Orion** de cada Tarefa/Subtarefa (ID, objetivo, escopo,
      critérios, comandos, riscos, docs relacionados).
    - **Pt.2 — Implementação Operacional** (Branch, Estrutura, Passos, Testes,
      Commit e Merge, Resultado Esperado).

Relações obrigatórias:

- Toda Tarefa/Subtarefa tem um ID do tipo
  `E<etapa>-F<fase>-S<sprint>-T<tarefa>(-Sb<subtarefa>)`.
- Esse ID aparece:

  - no título da Tarefa em `eto_faseY`;
  - na branch correspondente;
  - na mensagem principal de commit;
  - nos scripts ou módulos principais relacionados (ex.: comentário de
    cabeçalho).

Assim, qualquer alteração de código ou modelo pode ser rastreada até:

1. a decisão conceitual (Semente + Gênese),
2. o plano de Fundação (este doc),
3. a Tarefa específica da Etapa (`overview_etapaX` + `eto_faseY`),
4. o commit e a branch associados.

---

## 6. Critérios de “Pronto para Etapa 2”

A Etapa 1.5 — Echo Codex é considerada concluída quando:

- [x] Os quatro documentos raiz existem e estão coerentes:

  - `00_semente_orion.md`
  - `01_genese_orion.md`
  - `02_fundacao_orion.md`
  - `03_echocodex_orion.md`

- [x] O repositório Git foi inicializado com:

  - `main` e `develop` criadas e configuradas;
  - `.gitignore` mínimo adequado a Node/PostgreSQL e dados temporários;
  - `README.md` apontando para o ciclo Orion (00–03).

- [x] O padrão de branches, commits e IDs Orion está declarado neste documento.
- [x] Há clareza de que:

  - a **Etapa 2** começará criando `overview_etapa2` e `eto_fase1` específicos
    da infraestrutura & dados,
  - toda implementação futura estará ancorada nesse sistema de rastreabilidade.

---
