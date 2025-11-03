# Genesis Orion - LeagueInsight Lab

---

## 1. Manifesto de Visão — LeagueInsight Lab

### 1.1. Propósito

LeagueInsight Lab existe para estudar, de forma transparente e reproduzível,
**padrões de desempenho em ligas de pontos corridos** e testar até onde modelos
estatísticos conseguem antecipar resultados de partidas. Não é uma casa de
apostas, nem um oráculo definitivo: é um **laboratório de evidências** sobre
futebol.

### 1.2. Visão de Longo Prazo

Ser uma **plataforma de referência em análise de campeonatos nacionais**, onde:

- pesquisadores, analistas e entusiastas podem explorar dados históricos;
- modelos preditivos podem ser comparados, auditados e evoluídos;
- a relação entre **narrativa esportiva** (“time embalado”, “camisa pesa”,
  “mando forte”) e **números concretos** possa ser testada de forma sistemática.

LeagueInsight Lab é um **observatório + arena de experimentos**, não apenas um
score de previsão.

### 1.3. Objetivos do MVP

- Construir um **Observatório descritivo**:

  - distribuição de resultados (mandante/empate/visitante),
  - força de mando por temporada/time,
  - evolução de desempenho por time ao longo de temporadas e rodadas.

- Treinar ao menos **um modelo preditivo básico** (ex.: regressão logística /
  rating + distribuição de gols) usando as 5 últimas temporadas.
- Gerar previsões para as rodadas futuras da temporada atual.
- Medir, registrar e comparar o desempenho do modelo contra **baselines
  simples**:

  - chute aleatório,
  - “mandante não perde”,
  - “favorito pela tabela”.

### 1.4. Público-Alvo

- Analistas de desempenho e scouts interessados em padrões macro.
- Estudantes de ciência de dados buscando um **case completo** (ingestão →
  modelagem → avaliação).
- Desenvolvedores fullstack que querem um projeto **PERN + analytics** bem
  estruturado para portfólio.

### 1.5. Não-Objetivos (MVP)

- Não virar produto comercial de apostas.
- Não competir com provedores profissionais de odds.
- Não cobrir múltiplas ligas e formatos desde o início; foco em **uma liga
  nacional** bem modelada.
- Não perseguir modelos ultra complexos antes de validar os **fundamentos
  estatísticos simples**.

---

## 2. Modelo Conceitual — LeagueInsight Lab

### 2.1. Entidades Centrais

- **Liga**

  - Identifica o campeonato (ex.: “Brasileirão Série A”).
  - Atributos: nome, país, número de times, formato (pontos corridos).

- **Temporada**

  - Uma edição da liga em um ano.
  - Atributos: ano, número de rodadas, datas de início/fim, status (histórica /
    atual).

- **Time**

  - Unidade competitiva (clube).
  - Atributos: nome, sigla, cidade/região, identificador estável entre
    temporadas.

- **Partida (Match)**

  - Unidade de observação principal.
  - Atributos brutos:

    - temporada, rodada, data,
    - mandante, visitante,
    - gols_mandante, gols_visitante,
    - resultado_3_way (H/D/A).

  - Atributos contextuais (derivados antes do jogo):

    - posição_mandante_antes,
    - posição_visitante_antes,
    - pontos_acumulados_mandante/visitante,
    - forma_recente_mandante/visitante (últimos X jogos),
    - saldo_gols_acumulado,
    - flags como: clássico?, título?, rebaixamento?.

- **Tabela / StandingSnapshot**

  - Estado da tabela em uma **rodada específica**.
  - Atributos: temporada, rodada, time, pontos, vitórias, empates, derrotas,
    gols pró, gols contra, saldo, posição.

- **FeatureSet**

  - Conjunto de features calculadas para uma partida antes de ela ocorrer.
  - Atributos: id_partida, vetor de features normalizadas, versão do “schema” de
    features.

- **ModeloPreditivo**

  - Representa uma configuração de modelo (tipo, hiperparâmetros, janela
    temporal de treino).
  - Atributos: identificador, tipo (logística, rating, etc.), temporadas usadas,
    carimbo de versão.

- **Previsão (Prediction)**

  - Saída de um modelo para uma partida futura.
  - Atributos: id_partida, id_modelo, probabilidades (p_H, p_D, p_A), timestamp
    de geração, rodada de referência.

- **RodadaDeAvaliação (EvaluationRun)**

  - Agrupa previsões de um modelo em um período (ex.: rodadas 10 a 20 da
    temporada atual) já com resultado realizado.
  - Atributos: id_modelo, janela de rodadas, métricas (acurácia, log-loss, Brier
    score), comparação com baselines.

### 2.2. Relações Conceituais

- Liga **possui** várias Temporadas.
- Temporada **contém** Times participantes e muitas Partidas.
- Cada Partida **tem** um Snapshot da tabela antes do jogo para cada Time
  (StandingSnapshot).
- Para cada Partida, gera-se um **FeatureSet** (estado do mundo antes do jogo).
- Um ou mais **ModelosPreditivos** são treinados com FeatureSets + resultados de
  temporadas passadas.
- Para Partidas futuras, cada Modelo gera uma **Previsão**.
- Após a realização dos jogos, as Previsões são agrupadas em
  **RodadasDeAvaliação** com métricas calculadas.

---

## 3. Arquitetura-Alvo — LeagueInsight Lab (MVP)

### 3.1. Visão Geral

Arquitetura em camadas, baseada em **PERN**:

1. **Camada de Ingestão & Normalização (Jobs Batch)**
2. **Camada de Armazenamento (PostgreSQL)**
3. **Camada de Modelagem & Avaliação**
4. **API de Leitura & Analytics (Node.js)**
5. **Frontend React — Observatório & Painel de Previsões**

### 3.2. Camada de Ingestão

- Jobs batch responsáveis por:

  - consumir APIs / arquivos CSV históricos das temporadas;
  - normalizar para o esquema interno:

    - ligas, temporadas, times, partidas, snapshots de tabela.

  - gerar e versionar **datasets por temporada** (ex.: `season_2020`,
    `season_2021`, etc.).

- Separação clara:

  - código de ingestão **não** fica misturado com a API de leitura;
  - execução agendada/manual, focada em consistência, não em tempo real.

### 3.3. Armazenamento (PostgreSQL)

- Tabelas principais:

  - `leagues`, `seasons`, `teams`, `matches`, `standings_snapshots`, `features`,
    `models`, `predictions`, `evaluation_runs`.

- Padrões:

  - chaves estáveis por time e partida,
  - versionamento por temporada,
  - índices planejados para consultas comuns (por temporada, por time, por
    rodada).

### 3.4. Modelagem & Avaliação

- Camada lógica que:

  - lê dados consolidados (features + resultados) de temporadas passadas;
  - treina modelos simples;
  - grava modelos e previsões no banco;
  - roda rotinas de avaliação periódica (ex.: a cada rodada concluída na
    temporada atual).

- Interface:

  - pode ser implementada como conjunto de **scripts/serviços de backend** (por
    exemplo, um worker Node ou um serviço analítico separado, desde que alinhado
    ao PERN);
  - foco em:

    - reproduzibilidade (parâmetros e seed registrados),
    - comparabilidade entre diferentes modelos e baselines.

### 3.5. API de Leitura (Backend Node.js)

- Exposta como REST (ou REST + alguns endpoints voltados a analytics).
- Responsável por:

  - servir dados descritivos (observatório): distribuição de resultados, força
    de mando, histórico de times;
  - servir previsões para rodadas futuras da temporada atual;
  - servir histórico de avaliação de modelos vs baselines.

- Sem endpoints de ingestão pesada: a ingestão fica em outra camada/job.

### 3.6. Frontend React (Observatório & Lab)

- SPA que consome a API.
- Módulos principais:

  - **Dashboard Observatório**:

    - gráficos de distribuição de resultados,
    - mapas de força de mandante,
    - curvas de desempenho por time/temporada.

  - **Painel de Previsões**:

    - lista de jogos futuros com probabilidades,
    - comparação com baselines (ex.: badges “modelo x baseline”).

  - **Área de Avaliação**:

    - métricas por rodada,
    - evolução de performance ao longo da temporada atual.

### 3.7. Export & Reprodutibilidade

- Endpoints e/ou jobs para:

  - exportar datasets consolidados em CSV/JSON por temporada;
  - permitir que analistas rodem experimentos em Python/R externamente, usando
    os mesmos dados.

---

## 4. Ética & Privacidade — LeagueInsight Lab

### 4.1. Natureza dos Dados

- Dados trabalhados são **estatísticas esportivas públicas**:

  - resultados de jogos,
  - gols,
  - posição na tabela,
  - informações de clubes.

- Não há dados sensíveis de indivíduos (sem dados pessoais de torcedores, sem
  dados financeiros, etc.).

### 4.2. Posicionamento Estratégico

- O projeto **não** é uma plataforma de apostas; é um laboratório de análise.
- Quaisquer integrações futuras com ecossistemas de apostas:

  - não fazem parte do MVP,
  - exigiriam nova avaliação ética e de riscos, com políticas explícitas.

### 4.3. Transparência Metodológica

- Modelos devem ser documentados:

  - features utilizadas,
  - janelas temporais de treino,
  - métricas de avaliação,
  - comparação com baselines simples.

- As limitações dos modelos devem ser sempre explicitadas:

  - não há “garantia de acerto”,
  - futebol é inerentemente incerto, e o propósito é **medir essa incerteza**,
    não negar.

### 4.4. Uso Responsável

- Recomenda-se comunicar de forma clara:

  - que previsões são estimativas probabilísticas;
  - que decisões financeiras (ex.: apostas) não devem se basear exclusivamente
    nas saídas do sistema.

- Priorização de:

  - educação (explicar métricas e incerteza),
  - uso acadêmico e de portfólio técnico.

### 4.5. Licenciamento de Dados & Código

- Respeitar termos de uso das fontes de dados (APIs, datasets públicos).
- Preferência por:

  - código do projeto com licença aberta adequada ao uso de portfólio (ex.: MIT
    ou similar, a decidir na Etapa 1),
  - documentação clara de quais partes dependem de dados de terceiros, que não
    podem ser redistribuídos indiscriminadamente.

---

Com isso, **Etapa 0 — Visão & Conceito do LeagueInsight Lab** está
conceitualmente completa e coerente com a Semente Orion. O próximo degrau
natural, quando você quiser subir, é a **Etapa 1 — Fundação**, onde desenhamos o
mapa das Etapas/Fases e a rastreabilidade global desse observatório preditivo.
