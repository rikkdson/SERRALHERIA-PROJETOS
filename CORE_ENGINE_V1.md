# DOCUMENTAÇÃO TÉCNICA E CONGELAMENTO DO CORE ENGINE v1.0

**Versão:** Core Engine v1.0  
**Status:** ❄ CONGELADO / CERTIFICADO / PRONTO PARA EVOLUÇÃO DA PLATAFORMA  
**Data de Certificação:** 25 de Julho de 2026  
**Responsável:** Núcleo de Engenharia de Estruturas Metálicas  

---

## 1. VISÃO GERAL E OBJETIVO

O **Core Engine v1.0** (Motor Universal de Fabricação Metálica) é a inteligência matemática e geométrica central do sistema. Ele é responsável por transformar desenhos de estruturas metálicas bidimensionais em vetores reais de fabricação, aplicando regras de interrupção, cortes em esquadro/grau, desmembramento de interseções em cruz e sanitização geométrica.

A partir desta versão (v1.0), o Core Engine está **OFICIALMENTE CONGELADO**. Nenhuma regra de fabricação, algoritmo geométrico ou prioridade estrutural poderá ser alterado sem aprovação prévia e execução do protocolo estrito de regressão e homologação.

---

## 2. ARQUITETURA DO FLUXO DE PROCESSAMENTO

O fluxo de processamento de dados dentro do ecossistema do Core Engine segue uma esteira unidirecional determinística, onde o estado geométrico processado atua como a **Fonte Única da Verdade (SSOT)** para todos os módulos visuais e financeiros.

```
[ Entradas de Usuário / Desenho Livre / Gabaritos ]
                       │
                       ▼
            ┌─────────────────────┐
            │   Geometry Engine   │ Normalização, cálculos vetoriais, posições paramétricas
            └──────────┬──────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │ Intersection Engine │ Detecção paramétrica (tA, tB), nós (cross, T, corner)
            └──────────┬──────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │ Fabrication Engine  │ Ordenação por prioridade, bisseção, corte miter
            └──────────┬──────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │  Validação Output   │ Filtro microsegmentos (<10mm), zero-length, deduplicação
            └──────────┬──────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │     finalPieces     │ Lista canônica de peças fabricáveis
            └──────────┬──────────┘
                       │
      ┌────────────────┼────────────────┬────────────────┐
      │                │                │                │
      ▼                ▼                ▼                ▼
┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│ Blueprint │    │ Lista de  │    │ Orçamento │    │Otimização │
│ Canvas 2D │    │   Corte   │    │  (Cost)   │    │ de Barras │
└───────────┘    └───────────┘    └───────────┘    └───────────┘
```

### Detalhamento das Etapas:
1. **Entrada (`FreeDrawingLine[]`)**: Dados de linhas desenhadas no canvas ou geradas por assistentes estruturais.
2. **Geometry Engine**: Executa a normalização de coordenadas, identificação de inclinações, comprimentos euclidianos e vetorização.
3. **Intersection Engine**: Avalia todas as combinações de linhas em busca de cruzamentos reais (parâmetros `0 < t < 1`), classificando a topologia da junta (`cross`, `t_junction` ou `corner`).
4. **Fabrication Engine**: Ordena as peças conforme a hierarquia estrutural. Se a peça com menor prioridade interceptar uma de maior prioridade no modo `interromper`, a peça de menor prioridade é desmembrada exatamente na borda externa da peça contínua.
5. **Validação e Higienização (`ET-011.3`)**: Remove microsegmentos menores que 10mm, previne coordenadas `NaN`, corrige IDs duplicados e elimina peças totalmente sobrepostas.
6. **Peças Finais (`finalPieces`)**: Matriz congelada e otimizada pronta para consumo.
7. **Módulos Consumidores**: Renderizador Blueprint, Lista de Corte, Orçamento e Otimização de Barras.

---

## 3. REGRAS PERMANENTES DO CORE ENGINE

As 5 regras fundamentais abaixo são cláusulas pétreas do software e devem ser preservadas em todo o ciclo de vida do projeto:

### 1. Fonte Única da Verdade (SSOT)
O array `pieces` (ou `freeDrawing.lines` processado pelo `processFabricationModel`) é a autoridade absoluta sobre o projeto. Nenhum módulo consumidor tem permissão para recalcular ou modificar as dimensões das peças.

### 2. Prioridade Estrutural Hierárquica
Nas interseções em cruz ou junta T, o desmembramento é regido estritamente pelos pesos de prioridade:
* **Quadro Externo / Vigas de Borda (`quadro`)**: Peso 100
* **Colunas / Montantes Verticais (`coluna`)**: Peso 90
* **Travessas / Vigas Horizontais (`travessa`)**: Peso 70
* **Reforços / Gussets / Mão de Força (`reforco`)**: Peso 60
* **Diagonais / Mão de Amarra (`diagonal`)**: Peso 50
* **Preenchimento / Gradil (`preenchimento`)**: Peso 40
* **Linhas Livres (`livre`)**: Peso 30

### 3. Independência da Ordem de Desenho
A ordem em que o usuário desenhou as linhas na tela não pode alterar o resultado geométrico final. A permutação das linhas de entrada produz exatamente o mesmo conjunto de peças cortadas.

### 4. Proibição de Recálculos Paralelos
Fica proibida a recriação de lógica de cálculo de corte, miter ou interseção dentro dos componentes de interface (ex: `CutListModule`, `BudgetModule`, `BarOptimizationModule`). Todos devem consumir diretamente o output do Core Engine.

### 5. Sincronização Estrita Multimódulo
A soma dos comprimentos lineares, a quantidade de peças e os perfis utilizados devem ser 100% idênticos em todos os módulos:
$$\text{Quantidade e Comprimento em Render} \equiv \text{Lista de Corte} \equiv \text{Orçamento} \equiv \text{Otimização de Barras}$$

---

## 4. API PÚBLICA DO CORE ENGINE

A API pública exportada por `src/engines/fabricationEngine.ts` é composta pelas seguintes funções:

### `processFabricationModel(lines: FreeDrawingLine[], mode: FabricationInterruptionMode): FreeDrawingLine[]`
* **Descrição**: Função principal de execução do Core Engine. Transforma as linhas brutas de entrada na lista final de peças cortadas e validadas.
* **Parâmetros**:
  * `lines`: Array de segmentos de reta desenhados.
  * `mode`: `'interromper'` (bissecciona peças secundárias nas interseções) ou `'continuo'` (preserva barras inteiras).
* **Retorno**: Array de `FreeDrawingLine` representando as peças finais fabricáveis.
* **Consumidores**: `FreeDrawingModule`, `StructureAssistantModule`, `App.tsx`.

### `runHomologationSuite(): HomologationSuiteResult`
* **Descrição**: Executa os testes oficiais de homologação estrutural (TESTE-001 a TESTE-010).
* **Retorno**: Relatório com índice de confiabilidade (0 a 100%) e status de aprovação.

### `runRegressionSuite(): RegressionSuiteReport`
* **Descrição**: Suíte permanente de testes de regressão (CORE-001 a CORE-010) com medição de performance e validação multimódulo.
* **Retorno**: Relatório com índice de regressão e tempo de execução em milissegundos.

### `runRobustnessSuite(): RobustnessSuiteReport`
* **Descrição**: Suíte de testes de estresse e robustez (entradas inválidas, geometrias degeneradas, nós estelares, grids densos de 100+ interseções e mutação estocástica).
* **Retorno**: Relatório de robustez e índice de estabilidade para produção.

### `runFabricationEngineValidationTests()`
* **Descrição**: Agregador de testes para uso em rotinas CI/CD ou diagnósticos em ambiente de desenvolvimento.

---

## 5. PROTOCOLO E REGRAS DE EVOLUÇÃO DO CÓDIGO

Se em etapas futuras for estritamente necessária alguma modificação técnica no Core Engine, o desenvolvedor ou agente de IA **DEVERÁ** obrigatoriamente seguir este protocolo:

1. **Proposta de Mudança**: Documentar o motivo técnico da alteração e os impactos esperados.
2. **Execução de Suítes de Validação**:
   ```ts
   const regression = runRegressionSuite();
   const homologation = runHomologationSuite();
   const robustness = runRobustnessSuite();
   ```
3. **Critério de Aceitação Zero Defect**:
   * Índice de Regressão: **100% (Aprovado/Certificado)**
   * Índice de Confiabilidade: **100% (Certificado)**
   * Índice de Robustez: **100% (Certificado para Produção)**
4. Se qualquer teste falhar ou apresentar divergência multimódulo, a alteração é **REJEITADA AUTOMATICAMENTE**.

---

## 6. RELATÓRIO FINAL DE CONGELAMENTO E CERTIFICAÇÃO

Abaixo estão os resultados consolidados das três suítes de teste executadas na data de congelamento:

| Suíte de Validação | Testes Executados | Aprovados | Falhas | Índice de Desempenho | Classificação Oficial |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Homologação Estrutural (ET-012.1)** | 10 | 10 | 0 | **100%** | ✅ Certificado |
| **Regressão Permanente (ET-013.2)** | 10 | 10 | 0 | **100%** | ✅ Certificado |
| **Robustez & Estresse (ET-013.3)** | 5 Fases | 5 | 0 | **100%** | ✅ Certificado para Produção |

### Resumo do Teste de Estresse (ET-013.1):
* **Massa Máxima Testada**: Grid 10x10 com 100 interseções ativas e 20.000 mm de perfil metálico.
* **Tempo Médio de Processamento**: < 4.5 ms para estruturas complexas.
* **Integridade de Massa**: 100% de conservação do comprimento linear sem perdas ou acréscimos indevidos.
* **Sincronismo Multimódulo**: Renderização, Lista de Corte, Orçamento e Otimização mantiveram 0% de divergência.

---

**Selo de Congelamento Oficial:**  
`CORE_ENGINE_V1_FROZEN_CONFIRMED_2026_07_25`
