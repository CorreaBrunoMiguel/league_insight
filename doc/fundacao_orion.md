# Fundação Orion · LeagueInsight Lab

A Fundação Orion define **como o LeagueInsight Lab vai evoluir em Etapas**, como
cada Etapa conversa com as demais e como todas as decisões (de código, dados e
modelo) serão rastreáveis de ponta a ponta. É a ponte entre a **Gênese
conceitual** e o mundo da **implementação viva**.

---

## 1. Mapa de Etapas do Projeto

### 1.1. Visão Geral das Etapas

- **Pré-Etapa 0 — Semente Orion** Documento: `00_semente_orion.md` Conteúdo:
  identidade do projeto, fenômeno observado, pergunta científica principal e
  derivadas, universo de dados e escopo conceitual. Papel: define _por que_ o
  LeagueInsight Lab existe.

- **Etapa 0 — Gênese Orion** Documento: `01_genese_orion.md` Conteúdo: manifesto
  de visão, modelo conceitual, arquitetura-alvo e princípios de ética &
  privacidade. Papel: define _o que_ o sistema é em termos estruturais.

- **Etapa 1 — Fundação Orion** (este documento) Documento:
  `02_fundacao_orion.md` Conteúdo: mapa de Etapas, alinhamento entre elas e
  plano de rastreabilidade global (docs, código, dados, modelos). Papel: define
  _como_ o projeto vai caminhar, Etapa por Etapa.

- **Etapa 1.5 — Echo Codex Orion** Documento futuro: `03_echocodex_orion.md`
  Conteúdo: declaração de repositório “vivo”, padrões de branches, convenções de
  commits, layout inicial de pastas e integração dos documentos 00–02 ao repo.
  Papel: liga a fundação documental ao repositório de código e inaugura o ciclo
  de implementação.

---

### 1.2. Etapas de Implementação (2+), específicas do LeagueInsight Lab

A partir daqui começam as Etapas implementáveis (código, banco, jobs, API,
frontend).

- **Etapa 2 — Infraestrutura & Dados Base** Objetivo macro: montar o “esqueleto
  técnico” e garantir que os dados históricos estejam íntegros, versionados e
  consultáveis. Focos principais:

  - criação do monorepo/projeto base (PERN) e setup inicial do backend;
  - modelagem e criação do schema PostgreSQL para ligas, temporadas, times,
    partidas, snapshots de tabela, features;
  - implementação dos primeiros pipelines de ingestão/normalização (5 temporadas
    históricas + início da temporada atual);
  - versionamento de datasets por temporada.

- **Etapa 3 — Modelagem & Laboratório Preditivo** Objetivo macro: transformar
  dados normalizados em modelos testáveis e comparáveis. Focos principais:

  - definição e cálculo sistemático das features principais (mando, forma
    recente, posição na tabela, forças ofensiva/defensiva etc.);
  - implementação de pelo menos um modelo preditivo baseline (ex.: regressão
    logística 3 classes ou modelo de ratings simples);
  - definição de baselines comparativos (aleatório, “mandante não perde”, etc.);
  - estrutura de avaliação: métricas (acurácia, log-loss, Brier score) e
    registro de experimentos.

- **Etapa 4 — API & Observatório Web** Objetivo macro: expor o laboratório de
  forma acessível via API e dashboards. Focos principais:

  - backend Node.js com endpoints REST para:

    - observatório descritivo (distribuição de resultados, força de mandante,
      histórico de times);
    - previsões de jogos futuros da temporada atual;
    - histórico de performance dos modelos vs baselines;

  - frontend React (SPA) com:

    - dashboards de observatório,
    - painel de previsões,
    - tela de avaliação dos modelos ao longo da temporada.

- **Etapa 5 — Consolidação Científica & Demonstração** Objetivo macro: fechar o
  ciclo do MVP científico e deixá-lo pronto para uso em portfólio e estudos.
  Focos principais:

  - documentação dos resultados principais (relatório técnico, gráficos e
    insights chave);
  - scripts e endpoints de export (CSV/JSON) para análise externa em Python/R;
  - pequenos ajustes de UX e qualidade para apresentação (sem virar B2C, mas
    polido o suficiente para demo).

Etapas posteriores (6+) podem tratar de:

- suporte a múltiplas ligas;
- modelos mais sofisticados (ex.: modelos hierárquicos, aprendizado de
  sequência, etc.);
- novas interfaces e integrações.

---

## 2. Alinhamento entre Etapas

### 2.1. Linha de Causalidade

- **Semente → Gênese** A Semente define o fenômeno (“padrões de resultados em
  ligas de pontos corridos”) e as perguntas científicas. A Gênese traduz isso em
  **entidades, arquitetura-alvo e princípios éticos**.

- **Gênese → Fundação** A Gênese descreve o sistema em nível conceitual (Liga,
  Temporada, Partida, FeatureSet, ModeloPreditivo, etc.). A Fundação pega essa
  visão e organiza o **roteiro de execução** (Etapas 2+), dizendo em que ordem
  as peças ganham vida.

- **Fundação → Echo Codex** A Fundação define _como_ vamos caminhar. O Echo
  Codex conecta isso ao repositório real:

  - cria a estrutura inicial de diretórios,
  - formaliza o padrão de branches e commits,
  - registra como os artefatos documentais (00–02) são referenciados no código.

- **Echo Codex → Etapas 2+** O Echo Codex é o “contrato vivo” entre documentação
  e implementação. A partir de Etapa 2:

  - cada Etapa terá um `overview_etapaX` com plano macro
    (Fases/Sprints/Tarefas);
  - cada Fase terá um `eto_faseY` com a execução viva (Registro Orion +
    Implementação Operacional).

### 2.2. Dependências Lógicas

- **Etapa 2 depende de:**

  - entidades e arquitetura definidas em `01_genese_orion.md`;
  - mapa de Etapas e prioridades deste `02_fundacao_orion.md`;
  - padrões de repo/branches que serão cravados em `03_echocodex_orion.md`.

- **Etapa 3 depende de:**

  - dados íntegros e versionados (Etapa 2);
  - clareza nas variáveis centrais (definidas na Semente e refinadas na Gênese).

- **Etapa 4 depende de:**

  - modelos e métricas mínimos funcionando (Etapa 3);
  - esquema de dados estável para servir observatório e previsões (Etapa 2).

- **Etapa 5 depende de:**

  - pipeline modelagem → previsão → avaliação operando de forma consistente
    (Etapas 3 e 4);
  - decisões de escopo e objetivos de demonstração (já indicados na Semente e
    Gênese).

---

## 3. Rastreabilidade Global

A rastreabilidade no LeagueInsight Lab segue o **Protocolo Orion v3.7**,
especializado para dados + modelos + código.

### 3.1. Camadas de Fonte de Verdade

- **Camada Conceitual (por projeto)**

  - `00_semente_orion.md` → fonte da **pergunta científica** e do universo de
    dados.
  - `01_genese_orion.md` → fonte do **modelo conceitual** e da
    **arquitetura-alvo**.
  - `02_fundacao_orion.md` → fonte do **roteiro de Etapas** e do plano de
    rastreabilidade.
  - `03_echocodex_orion.md` → fonte do **padrão de repo** (branches, commits,
    estrutura) e do vínculo entre docs e código.

- **Camada de Execução por Etapa (Etapas ≥ 2)**

  - `/doc/ETO/etapa_<X>/overview_etapa<X>.md`

    - define Fases e Sprints da Etapa X (plano macro).

  - `/doc/ETO/etapa_<X>/eto_fase<Y>.md`

    - registra, em fluxo único, todas as Tarefas/Subtarefas daquela Fase:

      - **Pt.1 — Registro Orion** (ID, objetivo, escopo, critérios de aceite,
        artefatos, comandos, riscos, docs relacionados);
      - **Pt.2 — Implementação Operacional** (Branch, Objetivo, Estrutura,
        Passos, Testes, Commit e Merge, Resultado Esperado).

### 3.2. Identificadores Orion para Trabalho

Cada Tarefa/Subtarefa terá um identificador canônico:

`E<etapa>-F<fase>-S<sprint>-T<tarefa>(-Sb<subtarefa>)`

Exemplos:

- `E2-F1-S1-T1` — “Modelagem do schema PostgreSQL base para
  ligas/temporadas/times/partidas”.
- `E3-F1-S2-T3-Sb1` — “Implementar cálculo de forma recente (últimos 5 jogos)”.

Esse ID aparece sempre em:

- título da Tarefa/Subtarefa no `eto_faseY`;
- nome da branch de feature (que será formalizado no Echo Codex, ex.:
  `feature/e2-f1-s1-t1-schema-db`);
- descrição do PR e mensagem de commit principal.

### 3.3. Rastreabilidade para Dados & Modelos

Para garantir que qualquer resultado científico seja reconstituível:

- **Dados**

  - Cada temporada ingestada recebe um identificador estável (ex.:
    `season_2021`).
  - Pipelines e tarefas de ingestão referenciam explicitamente quais temporadas
    e fontes foram usadas.

- **Features**

  - O “schema de features” (quais variáveis entram no modelo) é descrito em:

    - doc da Etapa 3 (`overview_etapa3` e `eto_faseY` correspondente);
    - código (definição de colunas/tensores) com referência ao ID da Tarefa.

- **Modelos**

  - Cada configuração de modelo recebe um ID (`model_run_id`) e é ligada a:

    - Tarefa/Subtarefa Orion que o implementou;
    - temporadas usadas no treino;
    - features ativas;
    - métricas obtidas.

- **Avaliações**

  - Cada rodada de avaliação (ex.: previsões das rodadas 20–25 da temporada
    atual) é registrada:

    - com uma chave que inclui `model_run_id`, janela temporal e data de
      execução;
    - com link para a Tarefa/Subtarefa que definiu o experimento (ID Orion).

### 3.4. Governança Git & Commits (ponte com Echo Codex)

Os detalhes operacionais (nomenclatura de branches, emojis de commit, regras de
merge) serão registrados em `03_echocodex_orion.md`, mas a Fundação já define os
princípios:

- Toda mudança relevante deve:

  - nascer de uma **Tarefa/Subtarefa Orion** com ID explícito;
  - ser implementada em uma branch relacionada a esse ID;
  - terminar com um commit semanticamente etiquetado (ex.: `✨ feat`, `🧪 test`,
    `📝 docs` etc.).

- PRs/merges servirão como ponto de contato final entre:

  - documentos ETO (descrição da Tarefa),
  - código,
  - dados ou alterações de schema.

---

Com este `02_fundacao_orion.md`, o LeagueInsight Lab passa a ter:

- um **mapa claro de Etapas** (0 a 5, com foco forte em Etapas 2–4 para o MVP
  científico);
- um **alinhamento explícito** entre Semente, Gênese, Fundação, Echo Codex e
  Etapas futuras;
- um **esqueleto de rastreabilidade** que conecta documentos, código, dados e
  modelos.

A próxima parada natural no ciclo é a **Etapa 1.5 — Echo Codex**, onde esse
plano ganha carne de repositório: estrutura de pastas, padrão de
branches/commits e declaração oficial do LeagueInsight Lab como projeto “vivo”.
