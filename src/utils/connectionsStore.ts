/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StructuralConnection, StructuralConnectionType, ConnectionCategory } from '../types';

export const CONNECTIONS_STORAGE_KEY = 'serralheria_structural_connections_v1';
export const CONNECTIONS_UPDATED_EVENT = 'serralheria_connections_updated';

export const DEFAULT_STRUCTURAL_CONNECTIONS: StructuralConnection[] = [
  {
    id: 'conn-canto-90',
    name: 'Canto 90° Padrão',
    type: 'canto_90',
    category: 'soldada',
    description: 'Encontro reto em ângulo de 90° com topo de uma peça apoiado na lateral da outra.',
    isStandard: true,
    isArchived: false,
    compatibleProfiles: ['Metalon Quadrado', 'Metalon Retangular', 'Perfil U', 'Cantoneira'],
    deductionMm: 0,
    allowCutAngleOffset: false,
    weldSpecs: {
      weldType: 'solda_mig_mag',
      gapMm: 1.0,
      passCount: 1,
    },
    notes: 'União clássica de quadros. Exige esquadro preciso na montagem.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-meia-esquadria-45',
    name: 'Meia-Esquadria 45°',
    type: 'meia_esquadria_45',
    category: 'soldada',
    description: 'Ambas as peças cortadas a 45° formando canto de 90° sem ponta exposta.',
    isStandard: true,
    isArchived: false,
    compatibleProfiles: ['Metalon Quadrado', 'Metalon Retangular', 'Perfil T'],
    deductionMm: 0,
    allowCutAngleOffset: true,
    weldSpecs: {
      weldType: 'solda_mig_mag',
      gapMm: 1.5,
      bevelAngleDegrees: 45,
      passCount: 1,
    },
    notes: 'Acabamento estético superior para portões e quadros aparentes.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-topo-topo',
    name: 'Topo x Topo Direto',
    type: 'topo_topo',
    category: 'soldada',
    description: 'Emenda de topo reto para extensão de barras metálicas.',
    isStandard: true,
    isArchived: false,
    compatibleProfiles: ['Todos'],
    deductionMm: 1.5,
    allowCutAngleOffset: false,
    weldSpecs: {
      weldType: 'solda_mma_eletrodo',
      gapMm: 2.0,
      bevelAngleDegrees: 30,
      passCount: 2,
    },
    notes: 'Recomenda-se chancro (bisel) para penetração total do cordão de solda.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-ligacao-t',
    name: 'Ligação em T Intermediária',
    type: 'ligacao_t',
    category: 'soldada',
    description: 'Encontro perpendicular de travessa ou montante no meio de um perfil contínuo.',
    isStandard: true,
    isArchived: false,
    compatibleProfiles: ['Metalon Quadrado', 'Metalon Retangular', 'Tubos Redondos', 'Perfil U'],
    deductionMm: 0,
    allowCutAngleOffset: false,
    weldSpecs: {
      weldType: 'solda_mig_mag',
      gapMm: 1.0,
      passCount: 1,
    },
    notes: 'Utilizada em divisórias, grades e travessamento de quadros.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-ligacao-cruz',
    name: 'Ligação em Cruz (+)',
    type: 'ligacao_cruz',
    category: 'soldada',
    description: 'Cruzamento de duas barras no mesmo plano com interrupção de uma delas.',
    isStandard: true,
    isArchived: false,
    compatibleProfiles: ['Metalon Quadrado', 'Barra Chata', 'Vergalhão'],
    deductionMm: 0,
    allowCutAngleOffset: false,
    weldSpecs: {
      weldType: 'solda_mig_mag',
      gapMm: 1.0,
      passCount: 1,
    },
    notes: 'A peça contínua mantém a rigidez estrutural principal.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-tubo-continuo-interrompido',
    name: 'Tubo Contínuo x Interrompido',
    type: 'tubo_continuo_interrompido',
    category: 'soldada',
    description: 'Boca de lobo ou corte reto ajustado de tubo interrompido sobre tubo contínuo.',
    isStandard: true,
    isArchived: false,
    compatibleProfiles: ['Tubos Redondos', 'Tubo Quadrado'],
    deductionMm: 0,
    allowCutAngleOffset: true,
    weldSpecs: {
      weldType: 'solda_tig',
      gapMm: 1.0,
      passCount: 1,
    },
    notes: 'Requer esmerilhamento ou boca de lobo prévia para ajuste perfeito no raio.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-emenda-interna',
    name: 'Emenda Interna com Bucha',
    type: 'emenda_interna',
    category: 'encaixe',
    description: 'Prolongamento com bucha ou perfil de menor bitola inserido internamente.',
    isStandard: true,
    isArchived: false,
    compatibleProfiles: ['Metalon Quadrado', 'Metalon Retangular', 'Tubos Redondos'],
    deductionMm: 2.0,
    allowCutAngleOffset: false,
    reinforcementSpecs: {
      reinforcementType: 'luva_interna',
      thicknessMm: 2.0,
      lengthMm: 150,
    },
    notes: 'Excelente estabilidade e alinhamento axial garantido pela bucha interna.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-emenda-luva',
    name: 'Emenda com Luva Externa',
    type: 'emenda_luva',
    category: 'encaixe',
    description: 'Aplica-se uma luva justa externamente envolvendo o ponto de encontro.',
    isStandard: true,
    isArchived: false,
    compatibleProfiles: ['Tubos Redondos', 'Metalon Quadrado'],
    deductionMm: 0,
    allowCutAngleOffset: false,
    reinforcementSpecs: {
      reinforcementType: 'cantoneira_reforco',
      thicknessMm: 3.0,
      lengthMm: 200,
    },
    notes: 'Ideal para estruturas modulares ou desmontáveis de alta carga.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-sobreposicao',
    name: 'Sobreposição de Perfis',
    type: 'sobreposicao',
    category: 'soldada',
    description: 'Barras cruzadas ou sobrepostas sem corte de encaixe.',
    isStandard: true,
    isArchived: false,
    compatibleProfiles: ['Barra Chata', 'Cantoneira', 'Vergalhão'],
    deductionMm: 0,
    allowCutAngleOffset: false,
    weldSpecs: {
      weldType: 'solda_mma_eletrodo',
      gapMm: 0,
      passCount: 1,
    },
    notes: 'Montagem rápida e econômica para grades de proteção de janelas.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-reforco-canto',
    name: 'Reforço de Canto (Mão de Força / Gusset)',
    type: 'reforco_canto',
    category: 'mista',
    description: 'Chapa gusset triangular ou mão de força diagonal no canto estrutural.',
    isStandard: true,
    isArchived: false,
    compatibleProfiles: ['Todos'],
    deductionMm: 0,
    allowCutAngleOffset: true,
    reinforcementSpecs: {
      reinforcementType: 'chapa_gusset',
      thicknessMm: 4.0,
      lengthMm: 120,
    },
    notes: 'Aumenta consideravelmente a resistência a momentos de torção e flexão.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-reforco-central',
    name: 'Reforço Central Estrutural',
    type: 'reforco_central',
    category: 'mista',
    description: 'Chapa de enrijecimento soldada no centro do vão para evitar flambagem.',
    isStandard: true,
    isArchived: false,
    compatibleProfiles: ['Perfil U', 'Perfil I', 'Perfil H'],
    deductionMm: 0,
    allowCutAngleOffset: false,
    reinforcementSpecs: {
      reinforcementType: 'cantoneira_reforco',
      thicknessMm: 4.75,
      lengthMm: 250,
    },
    notes: 'Recomendado para vigas sujeitas a cargas pontuais concentradas.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-ligacao-soldada',
    name: 'Ligação Soldada de Alta Penetrabilidade',
    type: 'ligacao_soldada',
    category: 'soldada',
    description: 'Solda contínua nos 4 lados do perfil com chanfro duplo.',
    isStandard: true,
    isArchived: false,
    compatibleProfiles: ['Todos'],
    deductionMm: 1.0,
    allowCutAngleOffset: false,
    weldSpecs: {
      weldType: 'solda_mig_mag',
      gapMm: 1.5,
      bevelAngleDegrees: 30,
      passCount: 2,
    },
    notes: 'Conexão rígida para quadros industriais pesados e mezaninos.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conn-ligacao-aparafusada',
    name: 'Ligação Flangeada Aparafusada',
    type: 'ligacao_aparafusada',
    category: 'aparafusada',
    description: 'União com chapas de extremidade (flanges) unidas por parafusos sextavados.',
    isStandard: true,
    isArchived: false,
    compatibleProfiles: ['Metalon Quadrado', 'Perfil U', 'Perfil I'],
    deductionMm: 6.0, // Chapa flange de cada lado (3mm + 3mm)
    allowCutAngleOffset: false,
    boltSpecs: {
      boltDiameter: 'M10',
      boltType: 'sextavado',
      holeCount: 4,
      plateThicknessMm: 3.0,
    },
    notes: 'Permite montagem e desmontagem rápida no local de instalação.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getConnections(): StructuralConnection[] {
  try {
    const data = localStorage.getItem(CONNECTIONS_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(DEFAULT_STRUCTURAL_CONNECTIONS));
      return DEFAULT_STRUCTURAL_CONNECTIONS;
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(DEFAULT_STRUCTURAL_CONNECTIONS));
      return DEFAULT_STRUCTURAL_CONNECTIONS;
    }
    return parsed;
  } catch (err) {
    console.error('Erro ao ler conexões do localStorage:', err);
    return DEFAULT_STRUCTURAL_CONNECTIONS;
  }
}

export function saveConnections(connections: StructuralConnection[]): void {
  try {
    localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(connections));
    window.dispatchEvent(new CustomEvent(CONNECTIONS_UPDATED_EVENT));
  } catch (err) {
    console.error('Erro ao salvar conexões no localStorage:', err);
  }
}

export function saveConnection(conn: Partial<StructuralConnection> & { name: string; type: StructuralConnectionType; category: ConnectionCategory }): StructuralConnection {
  const current = getConnections();
  const now = new Date().toISOString();

  if (conn.id) {
    // Update existing connection
    const updated = current.map((c) => {
      if (c.id === conn.id) {
        return {
          ...c,
          ...conn,
          updatedAt: now,
        } as StructuralConnection;
      }
      return c;
    });
    saveConnections(updated);
    return updated.find((c) => c.id === conn.id)!;
  } else {
    // Create new connection
    const newConn: StructuralConnection = {
      id: `conn-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: conn.name,
      type: conn.type,
      category: conn.category,
      description: conn.description || '',
      isStandard: false,
      isArchived: false,
      compatibleProfiles: conn.compatibleProfiles || ['Todos'],
      deductionMm: conn.deductionMm ?? 0,
      allowCutAngleOffset: !!conn.allowCutAngleOffset,
      weldSpecs: conn.weldSpecs,
      boltSpecs: conn.boltSpecs,
      reinforcementSpecs: conn.reinforcementSpecs,
      notes: conn.notes || '',
      createdAt: now,
      updatedAt: now,
    };
    saveConnections([...current, newConn]);
    return newConn;
  }
}

export function duplicateConnection(id: string): StructuralConnection | null {
  const current = getConnections();
  const target = current.find((c) => c.id === id);
  if (!target) return null;

  const now = new Date().toISOString();
  const copy: StructuralConnection = {
    ...target,
    id: `conn-copy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: `${target.name} - Cópia`,
    isStandard: false, // Copies are always editable and deletable custom items
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  saveConnections([...current, copy]);
  return copy;
}

export function archiveConnection(id: string, isArchived: boolean): StructuralConnection | null {
  const current = getConnections();
  const target = current.find((c) => c.id === id);
  if (!target) return null;

  const updated = current.map((c) => (c.id === id ? { ...c, isArchived, updatedAt: new Date().toISOString() } : c));
  saveConnections(updated);
  return updated.find((c) => c.id === id)!;
}

export function deleteConnection(id: string): { success: boolean; message: string } {
  const current = getConnections();
  const target = current.find((c) => c.id === id);

  if (!target) {
    return { success: false, message: 'Ligação não encontrada.' };
  }

  if (target.isStandard) {
    return {
      success: false,
      message: 'Atenção: Ligações padrão do sistema são protegidas e não podem ser excluídas.',
    };
  }

  const filtered = current.filter((c) => c.id !== id);
  saveConnections(filtered);
  return { success: true, message: 'Ligação excluída com sucesso.' };
}

export function resetConnectionsToDefault(): StructuralConnection[] {
  saveConnections(DEFAULT_STRUCTURAL_CONNECTIONS);
  return DEFAULT_STRUCTURAL_CONNECTIONS;
}

// ======================================================
// ET-021.1: SUÍTE PERMANENTE DE REGRESSÃO / VALIDAÇÃO
// ======================================================

export interface ConnectionTestResult {
  testId: string;
  name: string;
  passed: boolean;
  message: string;
  details?: string;
}

export function runConnectionsTestSuite(): ConnectionTestResult[] {
  const results: ConnectionTestResult[] = [];

  // TEST 1: Cadastro de nova ligação personalizada
  try {
    const testName = `Teste Cadastro ${Date.now()}`;
    const created = saveConnection({
      name: testName,
      type: 'canto_90',
      category: 'soldada',
      description: 'Test connection creation',
      deductionMm: 3,
      compatibleProfiles: ['Metalon Quadrado'],
    });

    const current = getConnections();
    const exists = current.some((c) => c.id === created.id);

    if (exists && created.isStandard === false) {
      results.push({
        testId: 'CONN-TEST-001',
        name: 'Cadastro de Conexão Personalizada',
        passed: true,
        message: 'Conexão salva com sucesso e identificada como não-padrão.',
      });
      // cleanup test item
      deleteConnection(created.id);
    } else {
      results.push({
        testId: 'CONN-TEST-001',
        name: 'Cadastro de Conexão Personalizada',
        passed: false,
        message: 'Falha ao salvar nova conexão no repositório central.',
      });
    }
  } catch (e: any) {
    results.push({
      testId: 'CONN-TEST-001',
      name: 'Cadastro de Conexão Personalizada',
      passed: false,
      message: `Exceção durante cadastro: ${e.message}`,
    });
  }

  // TEST 2: Edição de ligação existente
  try {
    const created = saveConnection({
      name: 'Ligação para Teste Edição',
      type: 'ligacao_t',
      category: 'soldada',
      description: 'Original description',
    });

    const updated = saveConnection({
      id: created.id,
      name: 'Ligação Editada com Sucesso',
      type: 'ligacao_t',
      category: 'mista',
      description: 'Updated description',
    });

    if (updated.name === 'Ligação Editada com Sucesso' && updated.category === 'mista') {
      results.push({
        testId: 'CONN-TEST-002',
        name: 'Edição de Parâmetros de Ligação',
        passed: true,
        message: 'Campos e categorias atualizados corretamente no store.',
      });
    } else {
      results.push({
        testId: 'CONN-TEST-002',
        name: 'Edição de Parâmetros de Ligação',
        passed: false,
        message: 'Valores editados não correspondem ao objeto retornado.',
      });
    }
    deleteConnection(created.id);
  } catch (e: any) {
    results.push({
      testId: 'CONN-TEST-002',
      name: 'Edição de Parâmetros de Ligação',
      passed: false,
      message: `Exceção durante edição: ${e.message}`,
    });
  }

  // TEST 3: Duplicação de ligação
  try {
    const created = saveConnection({
      name: 'Ligação Base para Duplicar',
      type: 'meia_esquadria_45',
      category: 'soldada',
    });

    const copy = duplicateConnection(created.id);

    if (copy && copy.name === 'Ligação Base para Duplicar - Cópia' && copy.isStandard === false) {
      results.push({
        testId: 'CONN-TEST-003',
        name: 'Duplicação de Ligações',
        passed: true,
        message: 'Cópia independente gerada com nome alterado e isStandard: false.',
      });
      deleteConnection(copy.id);
    } else {
      results.push({
        testId: 'CONN-TEST-003',
        name: 'Duplicação de Ligações',
        passed: false,
        message: 'Falha ao duplicar conexão ou flag isStandard incorreta.',
      });
    }
    deleteConnection(created.id);
  } catch (e: any) {
    results.push({
      testId: 'CONN-TEST-003',
      name: 'Duplicação de Ligações',
      passed: false,
      message: `Exceção durante duplicação: ${e.message}`,
    });
  }

  // TEST 4: Arquivamento e Desarquivamento
  try {
    const created = saveConnection({
      name: 'Ligação Teste Arquivo',
      type: 'emenda_luva',
      category: 'encaixe',
    });

    const archived = archiveConnection(created.id, true);
    const unarchived = archiveConnection(created.id, false);

    if (archived?.isArchived === true && unarchived?.isArchived === false) {
      results.push({
        testId: 'CONN-TEST-004',
        name: 'Arquivamento & Desarquivamento',
        passed: true,
        message: 'Estado isArchived alterado com sucesso em ambas as direções.',
      });
    } else {
      results.push({
        testId: 'CONN-TEST-004',
        name: 'Arquivamento & Desarquivamento',
        passed: false,
        message: 'Inconsistência na alteração do flag isArchived.',
      });
    }
    deleteConnection(created.id);
  } catch (e: any) {
    results.push({
      testId: 'CONN-TEST-004',
      name: 'Arquivamento & Desarquivamento',
      passed: false,
      message: `Exceção durante arquivamento: ${e.message}`,
    });
  }

  // TEST 5: Proteção de ligações padrão contra exclusão
  try {
    const current = getConnections();
    const standard = current.find((c) => c.isStandard);

    if (standard) {
      const res = deleteConnection(standard.id);
      if (res.success === false && res.message.includes('protegidas')) {
        results.push({
          testId: 'CONN-TEST-005',
          name: 'Proteção de Ligações Padrão',
          passed: true,
          message: 'Bloqueio de exclusão ativado para ligações padrão de fábrica.',
        });
      } else {
        results.push({
          testId: 'CONN-TEST-005',
          name: 'Proteção de Ligações Padrão',
          passed: false,
          message: 'FALHA DE SEGURANÇA: Ligação padrão permitiu exclusão!',
        });
      }
    } else {
      results.push({
        testId: 'CONN-TEST-005',
        name: 'Proteção de Ligações Padrão',
        passed: false,
        message: 'Nenhuma ligação padrão encontrada no repositório.',
      });
    }
  } catch (e: any) {
    results.push({
      testId: 'CONN-TEST-005',
      name: 'Proteção de Ligações Padrão',
      passed: false,
      message: `Exceção no teste de proteção: ${e.message}`,
    });
  }

  return results;
}
