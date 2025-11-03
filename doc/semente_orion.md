# Semente Orion — LeagueInsight Lab

## 1. Identidade

- Nome de trabalho: LeagueInsight Lab — Observatório & Previsor de Campeonatos
  de Futebol
- Pitch (1 frase): Plataforma que analisa os últimos campeonatos nacionais de
  futebol, aprende padrões de resultados e testa modelos de previsão nas rodadas
  ainda não disputadas do campeonato atual.
- Contexto (área/tema): Futebol · Campeonatos nacionais de pontos corridos ·
  Estatística aplicada e modelagem preditiva com dados oficiais.

## 2. Fenômeno Observado

Padrões de desempenho de times em campeonatos nacionais de pontos corridos, ao
longo de várias temporadas, considerando fatores como mando de campo, força
relativa dos times, histórico recente, posição na tabela e outros indicadores
agregados de performance. O sistema observa como esses fatores se relacionam com
os resultados de partidas (vitória/empate/derrota e eventualmente placar) e como
esses padrões se repetem ou mudam entre temporadas.

## 3. Pergunta Científica Principal

Até que ponto é possível prever resultados de jogos (vitória/empate/derrota, e
opcionalmente placar) em um campeonato nacional de pontos corridos usando dados
das últimas temporadas e informações contextuais dos times e das partidas?

## 4. Perguntas Derivadas

- P1: Modelos treinados nas últimas 5 temporadas conseguem ter desempenho
  consistentemente melhor que baselines simples (chute aleatório, sempre mandar
  “mandante não perde”, etc.)?
- P2: O efeito de mando de campo é estável entre temporadas ou varia
  significativamente de ano para ano?
- P3: Em que medida a forma recente (últimos X jogos) impacta a probabilidade de
  vitória de um time em uma partida específica?
- P4: A posição na tabela antes do jogo é um bom preditor de resultado por si só
  ou precisa ser combinada com outros fatores para ganhar poder explicativo?
- P5: Em qual momento da temporada atual (rodada) as previsões se tornam mais
  confiáveis à medida que o modelo incorpora dados da própria temporada em
  andamento?

## 5. Universo de Dados

- Fontes (APIs/datasets oficiais):
  - APIs públicas ou comerciais de estatísticas de futebol (ex.: provedores de
    dados de ligas nacionais, APIs de resultados, open data de
    federações/confederações).
  - Alternativamente, datasets históricos estruturados (CSV/JSON) de campeonatos
    nacionais já disponíveis em repositórios públicos confiáveis.
- Intervalo temporal:
  - As 5 últimas temporadas completas do campeonato nacional escolhido (ex.:
    Campeonato Brasileiro Série A, ou outra liga nacional equivalente).
  - A temporada atual (em andamento) para validar o modelo nas rodadas ainda não
    disputadas.
- Nível de detalhe (linha do dataset principal):
  - Cada linha do dataset base representa **um jogo** de campeonato, com:
    - times mandante e visitante,
    - gols de cada lado,
    - data e rodada,
    - posição de cada time na tabela antes do jogo,
    - forma recente (resumo dos últimos X jogos),
    - outras features derivadas (ex.: saldo de gols acumulado).
- Público-alvo dos dados:
  - Pessoas interessadas em análise de desempenho em futebol (analistas,
    estudantes de dados, entusiastas de estatística esportiva), e como
    demonstração de portfólio técnico.

## 6. Unidade de Observação & Granularidade

Cada registro principal é **uma partida de campeonato nacional de pontos
corridos**, com contexto do estado do campeonato naquele momento (rodada,
posição dos times, forma recente).  
Granularidades derivadas:

- Por temporada: agregações de performance por time ao longo de uma temporada.
- Por time: estatísticas agregadas em múltiplas temporadas (força média, padrão
  de mando de campo, etc.).
- Por rodada: visão de equilíbrio/variação do campeonato ao longo do tempo.

## 7. Variáveis Centrais

- Entradas (features principais):
  - Identidade do jogo: time mandante, time visitante, rodada, temporada.
  - Mando de campo (mandante/visitante).
  - Posição na tabela de cada time antes do jogo.
  - Pontuação acumulada de cada time antes do jogo.
  - Forma recente (ex.: resultados dos últimos 5 jogos:
    vitórias/empates/derrotas, gols marcados/sofridos).
  - Saldo de gols acumulado antes do jogo.
  - Indicadores simples derivados:
    - “força ofensiva” (gols marcados por jogo até então),
    - “força defensiva” (gols sofridos por jogo),
    - diferença de força entre os dois times.
  - Eventualmente: variáveis binárias como “clássico/regional?”, “time brigando
    por título?”, “time em zona de rebaixamento?”.
- Saída(s) que queremos explicar/prever:
  - Principal: resultado do jogo em 3 classes (vitória mandante, empate, vitória
    visitante).
  - Secundário (opcional): número de gols de cada time (modelos de
    gols/Poisson).

## 8. MVP Científico

O MVP científico do LeagueInsight Lab é uma plataforma que:  
(1) ingere e normaliza dados das últimas 5 temporadas de um campeonato nacional
de pontos corridos, além da temporada atual;  
(2) oferece um modo **Observatório**, com dashboards descritivos sobre
distribuição de resultados, força de mandante, desempenho de times ao longo dos
anos e comparações entre temporadas;  
(3) treina ao menos um modelo preditivo básico (ex.: regressão logística ou
modelo de rating com distribuição de gols) usando as temporadas passadas;  
(4) aplica esse modelo para gerar previsões de resultado para as rodadas ainda
não disputadas da temporada atual;  
(5) registra o desempenho dessas previsões à medida que os jogos reais
acontecem, permitindo comparar o modelo com baselines simples em termos de
acertos e métricas probabilísticas (log-loss, Brier score).

## 9. Fora de Escopo (MVP)

- Sistema de apostas reais, odds comerciais ou qualquer integração direta com
  casas de aposta.
- Modelos extremamente complexos (deep learning pesado, arquiteturas muito
  elaboradas) — podem vir depois, mas não são necessários no MVP.
- Suporte multi-ligas com normalização avançada entre diferentes países e
  formatos (no MVP focamos em **uma liga**).
- Interface de usuário voltada para consumo público em massa; foco inicial é
  painel de análise e experimentos, não produto comercial B2C.
- Recursos de tempo real (live-betting, atualização por minuto durante o jogo);
  o MVP trabalha em granularidade de **partida concluída**.
- Análise detalhada por evento (ex.: cada chute, passe, mapa de calor de
  jogador); o foco está em estatísticas agregadas por jogo.

## 10. Stack & Restrições

- Stack alvo:
  - Preferência: **PERN** (PostgreSQL) para aproveitar melhor consultas
    analíticas e agregações sobre séries temporais e dados tabulares.
  - Backend: Node.js + Express/Nest ou similar, expondo APIs REST para ingestão,
    consulta e analytics.
  - Frontend: React (SPA) consumindo a API, com dashboards e visualizações
    (tabelas, gráficos, comparações).
- Banco de dados:
  - PostgreSQL como banco principal; possibilidade futura de extensões para
    otimizar consultas analíticas.
- Outras restrições/obrigações importantes:
  - Separação clara entre camada de ingestão/import (jobs batch) e API de
    leitura.
  - Versionamento de datasets (pelo menos por temporada) para garantir
    reprodutibilidade de análises.
  - Possibilidade de export de dados em CSV/JSON para análises externas
    (Python/R).

## 11. Critérios de “Pronto para Etapa 0”

- [x] Fenômeno e pergunta-mãe definidos (padrões de resultados em ligas de
      pontos corridos e previsibilidade de jogos).
- [x] Fontes de dados reais definidas em nível conceitual (APIs/datasets
      oficiais de campeonatos; 5 últimas temporadas + atual).
- [x] Universo temporal e granularidade definidos (5 temporadas completas +
      temporada atual; unidade = jogo).
- [x] MVP científico descrito (observatório + modelo + previsões + avaliação).
- [x] Escopo e anti-escopo claros (sem apostas, sem multi-ligas, sem modelos
      overcomplexos no MVP).
