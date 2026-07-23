/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Calculator, 
  FileText, 
  Printer, 
  Percent, 
  Clock, 
  Wrench, 
  Truck, 
  Paintbrush, 
  Disc, 
  Layers, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle, 
  Sparkles, 
  Box, 
  Ruler, 
  ArrowRight,
  ShieldCheck,
  Save,
  HelpCircle,
  ExternalLink,
  Plus
} from 'lucide-react';
import { MetalProject, PieceConfig, BudgetConfig, MaterialProfile } from '../types';
import { getMaterialProfiles, getProfileByName, MATERIALS_UPDATED_EVENT } from '../utils/materialsStore';
import { getPriceCenterData, PRICE_CENTER_UPDATED_EVENT, getEffectiveProfileBarCost } from '../utils/priceCenterStore';

interface BudgetModuleProps {
  project: MetalProject | null;
  pieces: PieceConfig[];
  onUpdateProject?: (updatedProject: MetalProject) => void;
  onNavigateToLibrary?: () => void;
}

export const BudgetModule: React.FC<BudgetModuleProps> = ({
  project,
  pieces,
  onUpdateProject,
  onNavigateToLibrary
}) => {
  // Material Profiles & Price Center from store
  const [materialProfiles, setMaterialProfiles] = useState<MaterialProfile[]>([]);
  const [priceCenterData, setPriceCenterData] = useState(getPriceCenterData());

  useEffect(() => {
    setMaterialProfiles(getMaterialProfiles());
    setPriceCenterData(getPriceCenterData());

    const handleMaterialsUpdate = () => {
      setMaterialProfiles(getMaterialProfiles());
    };

    const handlePriceCenterUpdate = () => {
      setPriceCenterData(getPriceCenterData());
    };

    window.addEventListener(MATERIALS_UPDATED_EVENT, handleMaterialsUpdate);
    window.addEventListener(PRICE_CENTER_UPDATED_EVENT, handlePriceCenterUpdate);
    return () => {
      window.removeEventListener(MATERIALS_UPDATED_EVENT, handleMaterialsUpdate);
      window.removeEventListener(PRICE_CENTER_UPDATED_EVENT, handlePriceCenterUpdate);
    };
  }, []);

  // Budget Configuration State initialized from project.budgetConfig or defaults
  const initialConfig: BudgetConfig = useMemo(() => {
    if (project?.budgetConfig) {
      return project.budgetConfig;
    }
    return {
      clientName: '',
      clientPhone: '',
      clientAddress: '',
      laborType: 'fixed',
      laborFixedCost: 250,
      estimatedHours: 8,
      costPerHour: 35,
      consumablesCost: 45,
      paintingCost: 60,
      freightCost: 80,
      otherCosts: 30,
      profitMarginPercent: 20,
      validityDays: 15,
      paymentTerms: '50% de entrada na aprovação + 50% na conclusão da instalação',
      notes: 'Garantia de 1 ano nas soldas e estruturas. Pintura anticorrosiva de alta durabilidade.'
    };
  }, [project]);

  const [config, setConfig] = useState<BudgetConfig>(initialConfig);
  const [saveNotification, setSaveNotification] = useState(false);

  // Sync config state if project changes
  useEffect(() => {
    if (project?.budgetConfig) {
      setConfig(project.budgetConfig);
    }
  }, [project?.id]);

  // Save budget configuration to project whenever config updates
  const handleConfigChange = (updatedFields: Partial<BudgetConfig>) => {
    const updated = { ...config, ...updatedFields, updatedAt: new Date().toISOString() };
    setConfig(updated);

    if (project && onUpdateProject) {
      const updatedProject: MetalProject = {
        ...project,
        budgetConfig: updated,
        updatedAt: new Date().toISOString()
      };
      onUpdateProject(updatedProject);
      
      setSaveNotification(true);
      setTimeout(() => setSaveNotification(false), 2000);
    }
  };

  // Consolidate project pieces by Profile
  const materialBreakdown = useMemo(() => {
    const rawPieces: { profile: string; lengthMm: number; name: string }[] = [];

    // Add pieces from project
    if (pieces && pieces.length > 0) {
      pieces.forEach(p => {
        const pName = p.profile || (project?.frame?.profile || 'Metalon 30x30 mm');
        rawPieces.push({
          profile: pName,
          lengthMm: p.length || 0,
          name: p.name || 'Peça da Estrutura'
        });
      });
    } else if (project?.frame) {
      // Fallback: use frame perimeter if pieces list is empty
      const frameProf = project.frame.profile || 'Metalon 30x30 mm';
      const w = project.frame.width || 0;
      const h = project.frame.height || 0;
      if (w > 0 && h > 0) {
        rawPieces.push({ profile: frameProf, lengthMm: w, name: 'Quadro Superior' });
        rawPieces.push({ profile: frameProf, lengthMm: w, name: 'Quadro Inferior' });
        rawPieces.push({ profile: frameProf, lengthMm: h, name: 'Lateral Esquerda' });
        rawPieces.push({ profile: frameProf, lengthMm: h, name: 'Lateral Direita' });
      }
    }

    // Group by profile name
    const groups: Record<string, {
      profileName: string;
      piecesCount: number;
      totalLengthMm: number;
      totalMeters: number;
      profileObj?: MaterialProfile;
      costPerMeter: number;
      costPerBar: number;
      barLengthMm: number;
      estimatedBars: number;
      totalCostMeters: number;
      totalCostBars: number;
    }> = {};

    rawPieces.forEach(item => {
      const pName = item.profile;
      if (!groups[pName]) {
        const matObj = getProfileByName(pName);
        const normalizedSearch = pName.toLowerCase().replace(/\s*mm\s*$/i, '').trim();
        const foundCenter = priceCenterData.profiles.find(p => 
          p.name.toLowerCase().includes(normalizedSearch) || 
          normalizedSearch.includes(p.name.toLowerCase())
        );

        let costB = matObj ? matObj.costPerBar : 108.00;
        let barLen = matObj ? matObj.defaultBarLengthMm : 6000;
        let costM = matObj ? matObj.costPerMeter : 18.00;

        if (foundCenter) {
          costB = getEffectiveProfileBarCost(foundCenter, priceCenterData.activeSupplierId);
          barLen = foundCenter.defaultBarLengthMm || 6000;
          costM = parseFloat((costB / (barLen / 1000)).toFixed(2));
        }

        groups[pName] = {
          profileName: pName,
          piecesCount: 0,
          totalLengthMm: 0,
          totalMeters: 0,
          profileObj: matObj,
          costPerMeter: costM,
          costPerBar: costB,
          barLengthMm: barLen,
          estimatedBars: 0,
          totalCostMeters: 0,
          totalCostBars: 0
        };
      }

      groups[pName].piecesCount += 1;
      groups[pName].totalLengthMm += item.lengthMm;
    });

    // Calculate final meters, bars & costs for each group
    Object.values(groups).forEach(g => {
      g.totalMeters = parseFloat((g.totalLengthMm / 1000).toFixed(2));
      g.estimatedBars = Math.max(1, Math.ceil(g.totalLengthMm / g.barLengthMm));
      g.totalCostMeters = parseFloat((g.totalMeters * g.costPerMeter).toFixed(2));
      g.totalCostBars = parseFloat((g.estimatedBars * g.costPerBar).toFixed(2));
    });

    return Object.values(groups);
  }, [pieces, project, materialProfiles, priceCenterData]);

  // Overall Total Material Cost
  const totalMaterialCost = useMemo(() => {
    return materialBreakdown.reduce((sum, item) => sum + item.totalCostMeters, 0);
  }, [materialBreakdown]);

  // Overall Total Linear Meters
  const totalProjectMeters = useMemo(() => {
    return materialBreakdown.reduce((sum, item) => sum + item.totalMeters, 0);
  }, [materialBreakdown]);

  // Labor Cost Calculation
  const laborCost = useMemo(() => {
    if (config.laborType === 'fixed') {
      return config.laborFixedCost || 0;
    } else {
      return (config.estimatedHours || 0) * (config.costPerHour || 0);
    }
  }, [config.laborType, config.laborFixedCost, config.estimatedHours, config.costPerHour]);

  // Expenses Breakdown
  const consumablesCost = config.consumablesCost || 0;
  const paintingCost = config.paintingCost || 0;
  const freightCost = config.freightCost || 0;
  const otherCosts = config.otherCosts || 0;

  const totalAdditionalExpenses = paintingCost + freightCost + otherCosts;

  // Base Production Cost (Custo Total de Produção)
  const totalProductionCost = useMemo(() => {
    return totalMaterialCost + laborCost + consumablesCost + totalAdditionalExpenses;
  }, [totalMaterialCost, laborCost, consumablesCost, totalAdditionalExpenses]);

  // Profit Calculation
  const profitMarginPercent = config.profitMarginPercent || 0;
  const profitValue = useMemo(() => {
    return parseFloat((totalProductionCost * (profitMarginPercent / 100)).toFixed(2));
  }, [totalProductionCost, profitMarginPercent]);

  // Final Selling Price (Preço de Venda)
  const finalPrice = useMemo(() => {
    return parseFloat((totalProductionCost + profitValue).toFixed(2));
  }, [totalProductionCost, profitValue]);

  // PDF Proposal Generation
  const handleGeneratePDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para gerar o Orçamento em PDF.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const frameWidthStr = project?.frame?.width ? `${project.frame.width} mm (${(project.frame.width/10).toFixed(1)} cm)` : 'Sob medida';
    const frameHeightStr = project?.frame?.height ? `${project.frame.height} mm (${(project.frame.height/10).toFixed(1)} cm)` : 'Sob medida';

    const itemsTableHtml = materialBreakdown.map(item => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 12px; font-weight: bold; color: #0f172a;">${item.profileName}</td>
        <td style="padding: 10px 12px; text-align: center; color: #475569;">${item.piecesCount} peças</td>
        <td style="padding: 10px 12px; text-align: center; color: #475569;">${item.totalMeters.toFixed(2)} m (${item.estimatedBars} barra(s))</td>
        <td style="padding: 10px 12px; text-align: right; color: #475569;">R$ ${item.costPerMeter.toFixed(2)} /m</td>
        <td style="padding: 10px 12px; text-align: right; font-weight: bold; color: #0f172a;">R$ ${item.totalCostMeters.toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Orçamento - ${project?.name || 'Serralheria'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
            color: #0f172a;
            background-color: #ffffff;
            padding: 40px;
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #f59e0b;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          .brand-title {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
          }
          .brand-sub {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 700;
            margin-top: 2px;
          }
          .doc-badge {
            background-color: #fef3c7;
            color: #92400e;
            border: 1px solid #fde68a;
            padding: 6px 14px;
            border-radius: 8px;
            font-family: 'JetBrains Mono', monospace;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
          }
          .grid-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 18px;
            margin-bottom: 25px;
          }
          .info-block h4 {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .info-block p {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
          }
          .info-block span {
            font-size: 12px;
            color: #475569;
            font-weight: normal;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
          }
          th {
            background-color: #f1f5f9;
            color: #334155;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 12px;
            text-align: left;
          }
          .summary-card {
            background-color: #0f172a;
            color: #ffffff;
            border-radius: 12px;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
          }
          .summary-total {
            text-align: right;
          }
          .summary-total .val {
            font-size: 30px;
            font-weight: 800;
            color: #fbbf24;
            font-family: 'JetBrains Mono', monospace;
          }
          .notes-box {
            background-color: #f8fafc;
            border: 1px dashed #cbd5e1;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 40px;
            font-size: 12px;
            color: #475569;
          }
          .signatures {
            margin-top: 50px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            text-align: center;
          }
          .sig-line {
            border-top: 1px solid #94a3b8;
            padding-top: 8px;
            font-size: 11px;
            color: #475569;
            font-weight: 600;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: #0f172a; color: #fff; border: none; padding: 10px 20px; font-weight: bold; border-radius: 8px; cursor: pointer;">🖨️ Imprimir / Salvar em PDF</button>
        </div>

        <!-- Header -->
        <div class="header">
          <div>
            <div class="brand-title">🛠️ SERRALHERIA PROJETOS</div>
            <div class="brand-sub">Proposta Comercial & Orçamento Técnico</div>
          </div>
          <div class="doc-badge">
            ORÇAMENTO Nº ${Math.floor(1000 + Math.random() * 9000)}
          </div>
        </div>

        <!-- Info Grid -->
        <div class="grid-info">
          <div class="info-block">
            <h4>Dados do Cliente</h4>
            <p>${config.clientName || 'Cliente não informado'}</p>
            <span>${config.clientPhone ? '📞 ' + config.clientPhone : ''} ${config.clientAddress ? '• 📍 ' + config.clientAddress : ''}</span>
          </div>

          <div class="info-block" style="text-align: right;">
            <h4>Projeto & Emissão</h4>
            <p>${project?.name || 'Estrutura Metalon'}</p>
            <span>Dimensões do Quadro: ${frameWidthStr} × ${frameHeightStr}</span><br>
            <span>Data de Emissão: ${todayStr} • Validade: ${config.validityDays || 15} dias</span>
          </div>
        </div>

        <!-- Materials Table -->
        <div class="section-title">📦 Especificação dos Materiais Utilizados</div>
        <table>
          <thead>
            <tr>
              <th>Perfil / Material</th>
              <th style="text-align: center;">Qtd Peças</th>
              <th style="text-align: center;">Metragem Total</th>
              <th style="text-align: right;">Valor Unit.</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTableHtml}
          </tbody>
        </table>

        <!-- Labor & Services Breakdown -->
        <div class="section-title">⚙️ Serviços e Custos Operacionais</div>
        <table style="margin-bottom: 25px;">
          <thead>
            <tr>
              <th>Item / Descrição da Etapa</th>
              <th style="text-align: right;">Valor Estimado</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 12px; color: #0f172a;">
                <strong>Mão de Obra de Fabricação e Montagem</strong>
                <br><span style="font-size: 11px; color: #64748b;">${config.laborType === 'hourly' ? `Estimado em ${config.estimatedHours}h a R$ ${config.costPerHour.toFixed(2)}/h` : 'Valor fixo acordado para execução da estrutura'}</span>
              </td>
              <td style="padding: 10px 12px; text-align: right; font-weight: bold;">R$ ${laborCost.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 12px; color: #0f172a;">
                <strong>Consumíveis de Oficina</strong> (Discos de corte/desbaste, arame MIG, eletrodos, lixas)
              </td>
              <td style="padding: 10px 12px; text-align: right; font-weight: bold;">R$ ${consumablesCost.toFixed(2)}</td>
            </tr>
            ${paintingCost > 0 ? `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 12px; color: #0f172a;">
                <strong>Pintura e Tratamento Anticorrosivo</strong> (Primer Zarcão, tinta esmalte sintético)
              </td>
              <td style="padding: 10px 12px; text-align: right; font-weight: bold;">R$ ${paintingCost.toFixed(2)}</td>
            </tr>` : ''}
            ${freightCost > 0 ? `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 12px; color: #0f172a;">
                <strong>Transporte, Frete e Entrega na Obra</strong>
              </td>
              <td style="padding: 10px 12px; text-align: right; font-weight: bold;">R$ ${freightCost.toFixed(2)}</td>
            </tr>` : ''}
            ${otherCosts > 0 ? `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 12px; color: #0f172a;">
                <strong>Acessórios e Outras Despesas</strong> (Dobradiças, fechos, chumbadores, parafusos)
              </td>
              <td style="padding: 10px 12px; text-align: right; font-weight: bold;">R$ ${otherCosts.toFixed(2)}</td>
            </tr>` : ''}
          </tbody>
        </table>

        <!-- Summary Total Card -->
        <div class="summary-card">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700;">VALOR TOTAL DA PROPOSTA</div>
            <div style="font-size: 12px; color: #cbd5e1; margin-top: 2px;">Condição de pagamento: ${config.paymentTerms || 'A combinar'}</div>
          </div>
          <div class="summary-total">
            <div class="val">R$ ${finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>

        <!-- Notes -->
        ${config.notes ? `
        <div class="notes-box">
          <strong>Observações e Condições Gerais:</strong><br>
          ${config.notes}
        </div>
        ` : ''}

        <!-- Signatures -->
        <div class="signatures">
          <div>
            <div class="sig-line">Serralheria Projetos - Responsável Técnico</div>
          </div>
          <div>
            <div class="sig-line">Aceite do Cliente - ${config.clientName || 'Assinatura'}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Module Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Orçamento Inteligente</span>
            </span>
            {saveNotification && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider animate-in fade-in duration-150">
                ✓ Salvo no Projeto
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white flex items-center gap-3">
            <span>💰 Orçamento Inteligente do Projeto</span>
          </h2>
          <p className="text-slate-300 text-sm mt-2 max-w-2xl">
            Cálculo automático de custos de materiais, mão de obra, insumos e margem de lucro em tempo real para o projeto <strong className="text-white">{project?.name || 'Serralheria'}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto">
          <button
            id="btn-gerar-orcamento-pdf"
            type="button"
            onClick={handleGeneratePDF}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-xl transition duration-150 shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm w-full sm:w-auto"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>📄 Gerar Orçamento PDF</span>
          </button>
        </div>
      </div>

      {/* Main Financial Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Material Cost */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 font-mono uppercase tracking-wider">Custo dos Materiais</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Box className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-slate-900">
              R$ {totalMaterialCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 font-sans mt-1">
              {totalProjectMeters.toFixed(2)} metros lineares em {materialBreakdown.length} perfil(is)
            </p>
          </div>
        </div>

        {/* Labor Cost */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 font-mono uppercase tracking-wider">Mão de Obra</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-slate-900">
              R$ {laborCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 font-sans mt-1">
              {config.laborType === 'hourly' ? `${config.estimatedHours}h x R$ ${config.costPerHour}/h` : 'Valor fixo acordado'}
            </p>
          </div>
        </div>

        {/* Total Cost of Production */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 font-mono uppercase tracking-wider">Custo de Produção</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-slate-900">
              R$ {totalProductionCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 font-sans mt-1">
              Insumos + Pintura + Frete: R$ {(consumablesCost + totalAdditionalExpenses).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Final Selling Price with Margin */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> PREÇO FINAL DE VENDA
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
              +{profitMarginPercent}% Lucro
            </span>
          </div>
          <div>
            <p className="text-3xl font-extrabold font-mono text-amber-400 tracking-tight">
              R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-300 font-sans mt-1">
              Lucro Líquido: <strong className="text-emerald-400">R$ {profitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Grid with Materials Table & Editable Cost Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (7 cols): Materials Breakdown Table & Client Info */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Section 1: Materials Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
                  1. Materiais Utilizados no Projeto
                </h3>
              </div>
              {onNavigateToLibrary && (
                <button
                  type="button"
                  onClick={onNavigateToLibrary}
                  className="text-xs font-bold font-mono text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Biblioteca →</span>
                </button>
              )}
            </div>

            {materialBreakdown.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhum perfil cadastrado na estrutura deste projeto.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4 font-bold">Perfil / Material</th>
                      <th className="py-3 px-4 font-bold text-center">Qtd Peças</th>
                      <th className="py-3 px-4 font-bold text-center">Metragem</th>
                      <th className="py-3 px-4 font-bold text-right">Preço / m</th>
                      <th className="py-3 px-4 font-bold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {materialBreakdown.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-sans font-bold text-slate-900">
                          {item.profileName}
                          {item.profileObj && (
                            <span className="block text-[10px] font-mono text-slate-400 font-normal">
                              ({item.profileObj.widthMm}x{item.profileObj.heightMm}x{item.profileObj.wallThicknessMm}mm)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-700 font-semibold">
                          {item.piecesCount} pçs
                        </td>
                        <td className="py-3 px-4 text-center text-slate-800 font-bold">
                          {item.totalMeters.toFixed(2)} m
                          <span className="block text-[10px] font-mono text-slate-400 font-normal">
                            (~{item.estimatedBars} barra(s))
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          R$ {item.costPerMeter.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 bg-slate-50/50">
                          R$ {item.totalCostMeters.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-mono font-bold">
                      <td colSpan={3} className="py-3.5 px-4 text-xs">
                        TOTAL DOS MATERIAIS
                      </td>
                      <td colSpan={2} className="py-3.5 px-4 text-right text-amber-400 text-sm">
                        R$ {totalMaterialCost.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Client & Proposal Information */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
                2. Informações do Cliente & Proposta
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1">
                  Nome do Cliente
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-orcamento-cliente-nome"
                    type="text"
                    value={config.clientName || ''}
                    onChange={(e) => handleConfigChange({ clientName: e.target.value })}
                    placeholder="Ex: João da Silva / Construtora Alfa"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-orcamento-cliente-telefone"
                    type="text"
                    value={config.clientPhone || ''}
                    onChange={(e) => handleConfigChange({ clientPhone: e.target.value })}
                    placeholder="Ex: (11) 98765-4321"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1">
                  Endereço / Local da Obra
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-orcamento-cliente-endereco"
                    type="text"
                    value={config.clientAddress || ''}
                    onChange={(e) => handleConfigChange({ clientAddress: e.target.value })}
                    placeholder="Ex: Rua das Flores, 120 - Centro, São Paulo/SP"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1">
                  Validade da Proposta (Dias)
                </label>
                <input
                  id="input-orcamento-validade"
                  type="number"
                  min="1"
                  max="90"
                  value={config.validityDays || 15}
                  onChange={(e) => handleConfigChange({ validityDays: parseInt(e.target.value) || 15 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1">
                  Condições de Pagamento
                </label>
                <input
                  id="input-orcamento-condicoes-pagamento"
                  type="text"
                  value={config.paymentTerms || ''}
                  onChange={(e) => handleConfigChange({ paymentTerms: e.target.value })}
                  placeholder="Ex: 50% entrada + 50% na entrega"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 font-mono mb-1">
                Observações Adicionais para o Cliente
              </label>
              <textarea
                id="textarea-orcamento-observacoes"
                rows={2}
                value={config.notes || ''}
                onChange={(e) => handleConfigChange({ notes: e.target.value })}
                placeholder="Ex: Prazo de entrega de 10 dias úteis a contar do pagamento da entrada..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Editable Costs & Profit Margin Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Section 3: Editable Costs (Labor, Consumables, Painting, Freight, Others) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calculator className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
                3. Custos Operacionais Editáveis
              </h3>
            </div>

            {/* Labor Cost Section */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mão de Obra</span>
                </label>

                {/* Labor Type Toggle */}
                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 font-mono text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleConfigChange({ laborType: 'fixed' })}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      config.laborType === 'fixed'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Valor Fixo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfigChange({ laborType: 'hourly' })}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      config.laborType === 'hourly'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Por Horas
                  </button>
                </div>
              </div>

              {config.laborType === 'fixed' ? (
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    Valor total da Mão de Obra (R$)
                  </label>
                  <input
                    id="input-mao-obra-fixo"
                    type="number"
                    step="10"
                    min="0"
                    value={config.laborFixedCost}
                    onChange={(e) => handleConfigChange({ laborFixedCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      Horas Estimadas (h)
                    </label>
                    <input
                      id="input-mao-obra-horas"
                      type="number"
                      step="0.5"
                      min="0"
                      value={config.estimatedHours}
                      onChange={(e) => handleConfigChange({ estimatedHours: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      Custo / Hora (R$)
                    </label>
                    <input
                      id="input-mao-obra-valor-hora"
                      type="number"
                      step="5"
                      min="0"
                      value={config.costPerHour}
                      onChange={(e) => handleConfigChange({ costPerHour: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Consumables */}
            <div>
              <label className="block text-xs font-bold text-slate-700 font-mono mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Disc className="w-3.5 h-3.5 text-purple-600" />
                  <span>Consumíveis (R$)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Discos, eletrodos, MIG, lixas</span>
              </label>
              <input
                id="input-consumiveis-custo"
                type="number"
                step="5"
                min="0"
                value={config.consumablesCost}
                onChange={(e) => handleConfigChange({ consumablesCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Painting */}
            <div>
              <label className="block text-xs font-bold text-slate-700 font-mono mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Paintbrush className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pintura / Acabamento (R$)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Zarcão, fundo, esmalte</span>
              </label>
              <input
                id="input-pintura-custo"
                type="number"
                step="5"
                min="0"
                value={config.paintingCost}
                onChange={(e) => handleConfigChange({ paintingCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Freight / Transport */}
            <div>
              <label className="block text-xs font-bold text-slate-700 font-mono mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Transporte / Frete (R$)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Entrega e instalação</span>
              </label>
              <input
                id="input-frete-custo"
                type="number"
                step="10"
                min="0"
                value={config.freightCost}
                onChange={(e) => handleConfigChange({ freightCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Other Costs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 font-mono mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-600" />
                  <span>Outros Custos (R$)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Fechaduras, dobradiças</span>
              </label>
              <input
                id="input-outros-custos"
                type="number"
                step="5"
                min="0"
                value={config.otherCosts}
                onChange={(e) => handleConfigChange({ otherCosts: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Section 4: Profit Margin Selection (%) */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  4. Margem de Lucro (%)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                +{profitMarginPercent}%
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Selecione a margem desejada ou informe um percentual personalizado:
            </p>

            {/* Preset Margin Buttons */}
            <div className="grid grid-cols-5 gap-2 font-mono">
              {[10, 15, 20, 25, 30].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  id={`btn-margem-${preset}`}
                  onClick={() => handleConfigChange({ profitMarginPercent: preset })}
                  className={`py-2 px-1 text-xs font-bold rounded-xl transition border cursor-pointer text-center ${
                    config.profitMarginPercent === preset
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-[1.03]'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>

            {/* Custom Profit Margin Input */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Margem Personalizada (%)
              </label>
              <div className="relative">
                <Percent className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-margem-lucro-custom"
                  type="number"
                  step="1"
                  min="0"
                  max="500"
                  value={config.profitMarginPercent}
                  onChange={(e) => handleConfigChange({ profitMarginPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Financial Summary Calculation Breakdown */}
            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Custo de Produção Base:</span>
                <span>R$ {totalProductionCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Lucro Bruto (+{profitMarginPercent}%):</span>
                <span>+ R$ {profitValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-400 text-sm font-bold pt-2 border-t border-slate-800/80">
                <span>Preço Final de Venda:</span>
                <span>R$ {finalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
