/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  StructuralConnection,
  ParametricConnectionRules,
  GeometricRules,
  FabricationRules,
  FasteningRules,
  ReinforcementRules,
  ProcessRecommendation,
  ReinforcementRequirementResult,
  GeometryValidationResult,
  ParametricTestResult,
  StructuralConnectionType,
} from '../types';

import { getConnections } from './connectionsStore';

export const PARAMETRIC_RULES_STORAGE_KEY = 'serralheria_parametric_rules_v1';
export const PARAMETRIC_RULES_UPDATED_EVENT = 'serralheria_parametric_rules_updated';

/**
 * Retorna as regras geométricas, de fabricação, fixação e reforço padrão para uma determinada conexão
 */
export function getDefaultParametricRulesForConnection(conn: StructuralConnection): ParametricConnectionRules {
  const now = new Date().toISOString();

  // Regras Genéricas Base
  let geo: GeometricRules = {
    continuousBarRole: 'passante',
    interruptedBarRole: 'encostado',
    junctionType: 'perpendicular',
    minAngleDegrees: 85,
    maxAngleDegrees: 95,
    angleToleranceDegrees: 0.5,
    minEngagementLengthMm: 10,
    partGapMm: conn.deductionMm || 1.0,
  };

  let fab: FabricationRules = {
    cutType: 'corte_reto',
    edgePreparation: 'esmerilhado',
    weldGapMm: conn.weldSpecs?.gapMm ?? 1.0,
    paintClearanceMm: 0.5,
    needsBevel: false,
    needsFinishing: true,
  };

  let fix: FasteningRules = {
    fasteningType: conn.category === 'aparafusada' ? 'parafusada' : conn.category === 'mista' ? 'mista' : 'soldada',
    minFastenerCount: conn.boltSpecs?.holeCount ?? (conn.category === 'aparafusada' ? 4 : 0),
    recommendedDiameter: conn.boltSpecs?.boltDiameter ?? 'M8',
    minHoleSpacingMm: 30,
    minEdgeDistanceMm: 15,
  };

  let reinf: ReinforcementRules = {
    reinforcementRequirement: conn.reinforcementSpecs ? 'obrigatorio' : 'opcional',
    reinforcementType: (conn.reinforcementSpecs?.reinforcementType as any) || 'cantoneira',
    minThicknessMm: conn.reinforcementSpecs?.thicknessMm ?? 3.0,
    minDimensionsMm: { width: 80, height: 80, length: conn.reinforcementSpecs?.lengthMm ?? 100 },
  };

  // Personalização específica por Tipo de Conexão (Fase 1, 2, 3, 4)
  switch (conn.type) {
    case 'canto_90':
      geo = {
        continuousBarRole: 'principal',
        interruptedBarRole: 'encostado',
        junctionType: 'perpendicular',
        minAngleDegrees: 88,
        maxAngleDegrees: 92,
        angleToleranceDegrees: 0.3,
        minEngagementLengthMm: 15,
        partGapMm: 0.5,
      };
      fab = {
        cutType: 'corte_reto',
        edgePreparation: 'bisel_simples',
        weldGapMm: 1.0,
        paintClearanceMm: 0.5,
        needsBevel: true,
        needsFinishing: true,
      };
      break;

    case 'meia_esquadria_45':
      geo = {
        continuousBarRole: 'principal',
        interruptedBarRole: 'secundario',
        junctionType: 'angular',
        minAngleDegrees: 40,
        maxAngleDegrees: 50,
        angleToleranceDegrees: 0.2,
        minEngagementLengthMm: 0,
        partGapMm: 1.0,
      };
      fab = {
        cutType: 'corte_45',
        edgePreparation: 'bisel_simples',
        weldGapMm: 1.5,
        paintClearanceMm: 0.5,
        needsBevel: true,
        needsFinishing: true,
      };
      break;

    case 'topo_topo':
      geo = {
        continuousBarRole: 'passante',
        interruptedBarRole: 'encostado',
        junctionType: 'coaxial',
        minAngleDegrees: 178,
        maxAngleDegrees: 182,
        angleToleranceDegrees: 0.1,
        minEngagementLengthMm: 20,
        partGapMm: 1.5,
      };
      fab = {
        cutType: 'corte_reto',
        edgePreparation: 'bisel_duplo',
        weldGapMm: 2.0,
        paintClearanceMm: 0.5,
        needsBevel: true,
        needsFinishing: true,
      };
      break;

    case 'tubo_continuo_interrompido':
      geo = {
        continuousBarRole: 'passante',
        interruptedBarRole: 'encostado',
        junctionType: 'perpendicular',
        minAngleDegrees: 30,
        maxAngleDegrees: 150,
        angleToleranceDegrees: 0.5,
        minEngagementLengthMm: 10,
        partGapMm: 1.0,
      };
      fab = {
        cutType: 'boca_de_lobo',
        edgePreparation: 'esmerilhado',
        weldGapMm: 1.0,
        paintClearanceMm: 0.5,
        needsBevel: false,
        needsFinishing: true,
      };
      break;

    case 'emenda_interna':
    case 'emenda_luva':
      geo = {
        continuousBarRole: 'passante',
        interruptedBarRole: 'desmontavel',
        junctionType: 'coaxial',
        minAngleDegrees: 179,
        maxAngleDegrees: 181,
        angleToleranceDegrees: 0.1,
        minEngagementLengthMm: 100,
        partGapMm: 2.0,
      };
      fab = {
        cutType: 'corte_reto',
        edgePreparation: 'escareado',
        weldGapMm: 0,
        paintClearanceMm: 1.0,
        needsBevel: false,
        needsFinishing: false,
      };
      reinf = {
        reinforcementRequirement: 'obrigatorio',
        reinforcementType: conn.type === 'emenda_interna' ? 'luva_interna' : 'cantoneira',
        minThicknessMm: 2.5,
        minDimensionsMm: { width: 40, height: 40, length: 150 },
      };
      break;

    case 'reforco_canto':
    case 'reforco_central':
      reinf = {
        reinforcementRequirement: 'obrigatorio',
        reinforcementType: 'chapa_gusset',
        minThicknessMm: 4.0,
        minDimensionsMm: { width: 120, height: 120, length: 120 },
      };
      break;

    case 'ligacao_aparafusada':
      geo = {
        continuousBarRole: 'suporte_fixo',
        interruptedBarRole: 'desmontavel',
        junctionType: 'perpendicular',
        minAngleDegrees: 85,
        maxAngleDegrees: 95,
        angleToleranceDegrees: 0.5,
        minEngagementLengthMm: 0,
        partGapMm: 3.0,
      };
      fab = {
        cutType: 'corte_reto',
        edgePreparation: 'esmerilhado',
        weldGapMm: 0,
        paintClearanceMm: 1.0,
        needsBevel: false,
        needsFinishing: false,
      };
      fix = {
        fasteningType: 'parafusada',
        minFastenerCount: 4,
        recommendedDiameter: 'M10',
        minHoleSpacingMm: 35,
        minEdgeDistanceMm: 20,
      };
      break;
  }

  return {
    connectionId: conn.id,
    geometricRules: geo,
    fabricationRules: fab,
    fasteningRules: fix,
    reinforcementRules: reinf,
    updatedAt: now,
  };
}

/**
 * Retorna do localStorage todas as regras salvas
 */
export function getAllSavedParametricRules(): Record<string, ParametricConnectionRules> {
  try {
    const raw = localStorage.getItem(PARAMETRIC_RULES_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler regras paramétricas do localStorage:', err);
    return {};
  }
}

/**
 * Salva as regras paramétricas para uma ligação no localStorage
 */
export function saveConnectionRules(
  connectionId: string,
  rules: ParametricConnectionRules
): ParametricConnectionRules {
  const all = getAllSavedParametricRules();
  const updatedRules: ParametricConnectionRules = {
    ...rules,
    connectionId,
    updatedAt: new Date().toISOString(),
  };

  all[connectionId] = updatedRules;
  localStorage.setItem(PARAMETRIC_RULES_STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent(PARAMETRIC_RULES_UPDATED_EVENT));
  return updatedRules;
}

// ======================================================
// FASE 5: API PARAMÉTRICA PÚBLICA
// ======================================================

/**
 * Retorna as regras paramétricas completas de uma ligação
 */
export function getConnectionRules(connectionId: string): ParametricConnectionRules | null {
  const connections = getConnections();
  const targetConn = connections.find((c) => c.id === connectionId);
  if (!targetConn) return null;

  const savedRules = getAllSavedParametricRules()[connectionId];
  if (savedRules) return savedRules;

  return getDefaultParametricRulesForConnection(targetConn);
}

/**
 * Retorna a recomendação de processo de fabricação (solda, corte, ferramentas)
 */
export function getRecommendedProcess(connectionId: string): ProcessRecommendation {
  const connections = getConnections();
  const conn = connections.find((c) => c.id === connectionId);
  const rules = getConnectionRules(connectionId);

  const connName = conn?.name || 'Ligação não identificada';
  const category = conn?.category || 'soldada';

  if (!rules) {
    return {
      connectionId,
      connectionName: connName,
      category,
      primaryProcess: 'Solda MIG/MAG padrão',
      recommendedEquipment: ['Inversora de Solda MIG/MAG', 'Esmerilhadeira 4.5"'],
      edgePrepInstruction: 'Limpeza mecânica das bordas',
      finishingLevel: 'Desbaste e remoção de respingos',
      estimatedSetupTimeMin: 15,
    };
  }

  const fab = rules.fabricationRules;
  const fix = rules.fasteningRules;

  let primaryProcess = 'Solda MIG/MAG com fresta controlada';
  let equip = ['Esmerilhadeira Angular', 'Inversora/Transformador de Solda', 'Esquadro Magnético'];

  if (fix.fasteningType === 'parafusada') {
    primaryProcess = `União Flangeada Aparafusada (${fix.minFastenerCount}x ${fix.recommendedDiameter})`;
    equip = ['Furadeira de Bancada / Serra de Fita', 'Jogo de Chaves Sextavadas / Soquetes', 'Broca de Aço Rápido HSS'];
  } else if (fix.fasteningType === 'rebitada') {
    primaryProcess = `Fixação por Rebites de Repuxo Structural (${fix.minFastenerCount}x)`;
    equip = ['Alicate Rebitador Pneumático/Manual', 'Furadeira Manual', 'Ponteiro de Centro'];
  } else if (conn?.weldSpecs?.weldType === 'solda_tig') {
    primaryProcess = 'Solda TIG (GMAW/GTAW) Alta Precisão';
    equip = ['Máquina TIG HF', 'Vareta de Adição AWS ER70S-6', 'Gás Argônio Puro'];
  }

  let edgePrepText = 'Sem necessidade de biselamento prévio.';
  if (fab.needsBevel) {
    edgePrepText = `Preparar chanfro (${fab.edgePreparation.replace('_', ' ')}) com fresta de ${fab.weldGapMm}mm.`;
  }

  let finishing = fab.needsFinishing ? 'Desbaste total nivelado com disco flap grão 80' : 'Apenas escovação e remoção de escória';

  return {
    connectionId,
    connectionName: connName,
    category,
    primaryProcess,
    recommendedEquipment: equip,
    edgePrepInstruction: edgePrepText,
    finishingLevel: finishing,
    estimatedSetupTimeMin: fix.fasteningType === 'parafusada' ? 25 : 12,
  };
}

/**
 * Retorna os requisitos de reforço estrutural para uma ligação
 */
export function getRequiredReinforcements(connectionId: string): ReinforcementRequirementResult {
  const connections = getConnections();
  const conn = connections.find((c) => c.id === connectionId);
  const rules = getConnectionRules(connectionId);

  const connName = conn?.name || 'Ligação Desconhecida';

  if (!rules) {
    return {
      connectionId,
      connectionName: connName,
      requirement: 'opcional',
      type: 'Sem reforço definido',
      minThicknessMm: 3.0,
      recommendedPlateSpecs: 'Chapa de Aço SAE 1020 e=3.0mm',
      structuralReason: 'Verificação padrão recomendada para cargas médias.',
    };
  }

  const r = rules.reinforcementRules;
  const reqText = r.reinforcementRequirement;
  let reason = 'Aumentar rigidez flexional e prevenir torção no nó.';

  if (reqText === 'obrigatorio') {
    reason = 'CRÍTICO: Exigido pela norma de dimensionamento para evitar flambagem local e distribuição desigual de tensões.';
  } else if (reqText === 'nao_aplicavel') {
    reason = 'A geometria e fixação nativa já suportam as solicitações nominais sem reforço adicional.';
  }

  const specs = `Chapa e=${r.minThicknessMm}mm (${r.minDimensionsMm.width}x${r.minDimensionsMm.height}mm)`;

  return {
    connectionId,
    connectionName: connName,
    requirement: reqText,
    type: r.reinforcementType.replace('_', ' ').toUpperCase(),
    minThicknessMm: r.minThicknessMm,
    recommendedPlateSpecs: specs,
    structuralReason: reason,
  };
}

/**
 * Valida os parâmetros geométricos de uma ligação (ângulo, folga entre peças)
 */
export function validateConnectionGeometry(
  connectionId: string,
  angleDegrees: number,
  gapMm: number
): GeometryValidationResult {
  const connections = getConnections();
  const conn = connections.find((c) => c.id === connectionId);
  const rules = getConnectionRules(connectionId);

  const connName = conn?.name || 'Ligação';
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!rules) {
    return {
      isValid: true,
      connectionId,
      connectionName: connName,
      checkedAngle: angleDegrees,
      checkedGapMm: gapMm,
      issues: [],
      recommendations: ['Regras paramétricas padrão aplicadas sem erros.'],
    };
  }

  const geo = rules.geometricRules;
  const fab = rules.fabricationRules;

  // Verificação de Ângulo
  if (angleDegrees < geo.minAngleDegrees || angleDegrees > geo.maxAngleDegrees) {
    issues.push(
      `Ângulo informado de ${angleDegrees}° está fora da faixa permitida (${geo.minAngleDegrees}° a ${geo.maxAngleDegrees}°).`
    );
    recommendations.push(
      `Ajuste a esquadria para o intervalo recomendado ou inclua compensação angular no corte (${geo.angleToleranceDegrees}° de tolerância).`
    );
  }

  // Verificação de Fresta / Folga
  if (gapMm < fab.weldGapMm) {
    issues.push(`Fresta de montagem (${gapMm}mm) é menor que o mínimo exigido para penetração de solda (${fab.weldGapMm}mm).`);
    recommendations.push(`Aumente a folga de preparação para no mínimo ${fab.weldGapMm}mm para assegurar fusão de raiz.`);
  } else if (gapMm > fab.weldGapMm + 3.0) {
    issues.push(`Fresta excessiva (${gapMm}mm). Risco de deformação e consumo elevado de eletrodo/arame.`);
    recommendations.push(`Reduza o corte da barra ou insira chapa de enchimento/reforço.`);
  }

  return {
    isValid: issues.length === 0,
    connectionId,
    connectionName: connName,
    checkedAngle: angleDegrees,
    checkedGapMm: gapMm,
    issues,
    recommendations,
  };
}

/**
 * Restaura as regras paramétricas para as configurações padrão
 */
export function resetParametricRulesToDefaults(): void {
  localStorage.removeItem(PARAMETRIC_RULES_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(PARAMETRIC_RULES_UPDATED_EVENT));
}

// ======================================================
// FASE 7: SUÍTE DE TESTES E CERTIFICAÇÃO ET-021.2
// ======================================================

export function runParametricTestSuite(): ParametricTestResult[] {
  const results: ParametricTestResult[] = [];

  // TESTE 1: Carregamento de regras paramétricas padrão
  try {
    const connections = getConnections();
    if (connections.length > 0) {
      const firstConn = connections[0];
      const rules = getConnectionRules(firstConn.id);

      if (rules && rules.geometricRules && rules.fabricationRules && rules.fasteningRules && rules.reinforcementRules) {
        results.push({
          testId: 'PARAM-TEST-001',
          name: 'Carregamento das Regras Paramétricas',
          passed: true,
          message: `Regras de 4 fases carregadas com sucesso para "${firstConn.name}".`,
        });
      } else {
        results.push({
          testId: 'PARAM-TEST-001',
          name: 'Carregamento das Regras Paramétricas',
          passed: false,
          message: 'Incompleto: Alguma das 4 fases não retornou regras válidas.',
        });
      }
    } else {
      results.push({
        testId: 'PARAM-TEST-001',
        name: 'Carregamento das Regras Paramétricas',
        passed: false,
        message: 'Nenhuma ligação encontrada no repositório ET-021.1.',
      });
    }
  } catch (e: any) {
    results.push({
      testId: 'PARAM-TEST-001',
      name: 'Carregamento das Regras Paramétricas',
      passed: false,
      message: `Exceção: ${e.message}`,
    });
  }

  // TESTE 2: Persistência de regras personalizadas
  try {
    const connections = getConnections();
    const target = connections[0];
    const originalRules = getConnectionRules(target.id)!;

    const modifiedRules: ParametricConnectionRules = {
      ...originalRules,
      geometricRules: {
        ...originalRules.geometricRules,
        minAngleDegrees: 10,
        maxAngleDegrees: 170,
      },
    };

    saveConnectionRules(target.id, modifiedRules);
    const reloaded = getConnectionRules(target.id);

    if (reloaded && reloaded.geometricRules.minAngleDegrees === 10 && reloaded.geometricRules.maxAngleDegrees === 170) {
      results.push({
        testId: 'PARAM-TEST-002',
        name: 'Persistência de Regras Customizadas',
        passed: true,
        message: 'Alterações personalizadas persistidas e lidas corretamente.',
      });
      // Restore original
      saveConnectionRules(target.id, originalRules);
    } else {
      results.push({
        testId: 'PARAM-TEST-002',
        name: 'Persistência de Regras Customizadas',
        passed: false,
        message: 'Falha ao re-carregar parâmetros salvos do localStorage.',
      });
    }
  } catch (e: any) {
    results.push({
      testId: 'PARAM-TEST-002',
      name: 'Persistência de Regras Customizadas',
      passed: false,
      message: `Exceção: ${e.message}`,
    });
  }

  // TESTE 3: API Paramétrica - getRecommendedProcess & getRequiredReinforcements
  try {
    const connections = getConnections();
    const target = connections[0];

    const proc = getRecommendedProcess(target.id);
    const reinf = getRequiredReinforcements(target.id);

    if (proc.primaryProcess && proc.recommendedEquipment.length > 0 && reinf.requirement) {
      results.push({
        testId: 'PARAM-TEST-003',
        name: 'Consulta via API Paramétrica (Fase 5)',
        passed: true,
        message: `API retornou processo "${proc.primaryProcess}" e reforço "${reinf.requirement}".`,
      });
    } else {
      results.push({
        testId: 'PARAM-TEST-003',
        name: 'Consulta via API Paramétrica (Fase 5)',
        passed: false,
        message: 'Respostas da API com campos ausentes ou incompletos.',
      });
    }
  } catch (e: any) {
    results.push({
      testId: 'PARAM-TEST-003',
      name: 'Consulta via API Paramétrica (Fase 5)',
      passed: false,
      message: `Exceção na API: ${e.message}`,
    });
  }

  // TESTE 4: Validação Geométrico-Paramétrica (validateConnectionGeometry)
  try {
    const connections = getConnections();
    const target = connections.find((c) => c.type === 'canto_90') || connections[0];

    const invalidRes = validateConnectionGeometry(target.id, 15, 0.1); // 15° em canto 90°
    const validRes = validateConnectionGeometry(target.id, 90, 1.0); // 90° exatos

    if (invalidRes.isValid === false && invalidRes.issues.length > 0 && validRes.isValid === true) {
      results.push({
        testId: 'PARAM-TEST-004',
        name: 'Validação Geométrico-Paramétrica',
        passed: true,
        message: 'Identificou erro de esquadria (15°) e aprovou geometria nominal de 90°.',
      });
    } else {
      results.push({
        testId: 'PARAM-TEST-004',
        name: 'Validação Geométrico-Paramétrica',
        passed: false,
        message: 'Algoritmo de validação angular não disparou inconsistência esperada.',
      });
    }
  } catch (e: any) {
    results.push({
      testId: 'PARAM-TEST-004',
      name: 'Validação Geométrico-Paramétrica',
      passed: false,
      message: `Exceção na validação: ${e.message}`,
    });
  }

  // TESTE 5: Proteção e Isolamento do Core Engine v1.0
  try {
    const nullRules = getConnectionRules('id-inexistente-12345');
    if (nullRules === null) {
      results.push({
        testId: 'PARAM-TEST-005',
        name: 'Isolamento e Segurança do Core Engine',
        passed: true,
        message: 'Consultas com IDs inválidos tratadas com graciosidade (retorno null sem crashes).',
      });
    } else {
      results.push({
        testId: 'PARAM-TEST-005',
        name: 'Isolamento e Segurança do Core Engine',
        passed: false,
        message: 'ID inexistente não retornou null.',
      });
    }
  } catch (e: any) {
    results.push({
      testId: 'PARAM-TEST-005',
      name: 'Isolamento e Segurança do Core Engine',
      passed: false,
      message: `Exceção: ${e.message}`,
    });
  }

  return results;
}
