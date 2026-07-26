/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Zap, 
  Layers, 
  Scissors, 
  Printer, 
  Download, 
  BarChart2, 
  Sliders, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Maximize2,
  RefreshCw,
  FileText,
  ChevronRight
} from 'lucide-react';
import { MetalProject, PieceConfig, PIECE_TYPE_LABELS } from '../types';

interface RawCutItem {
  id: string;
  perfil: string;
  comprimento: number; // in mm
  quantidade: number;
  grupo: string;
  nome: string;
}

interface PieceToCut {
  id: string;
  perfil: string;
  comprimento: number; // in mm
  grupo: string;
  nome: string;
}

export interface OptimizedPieceInBar {
  pieceId: string;
  comprimento: number;
  grupo: string;
  nome: string;
}

export interface OptimizedBar {
  barNumber: number;
  profile: string;
  barLengthMm: number;
  pieces: OptimizedPieceInBar[];
  usedPiecesLengthMm: number;
  kerfLossMm: number;
  totalOccupiedMm: number;
  remainingOffcutMm: number;
  efficiencyPercent: number;
}

export interface ProfileOptimizationResult {
  profile: string;
  bars: OptimizedBar[];
  totalBars: number;
  totalPiecesCount: number;
  totalMetersUsed: number;
  totalMetersPurchased: number;
  totalMetersOffcut: number;
  efficiencyPercent: number;
  wastePercent: number;
}

interface BarOptimizationModuleProps {
  project: MetalProject;
  pieces: PieceConfig[];
  onNavigateToCutList?: () => void;
  onNavigateToStructure?: () => void;
}

export const BarOptimizationModule: React.FC<BarOptimizationModuleProps> = ({
  project,
  pieces = [],
  onNavigateToCutList,
  onNavigateToStructure
}) => {
  // Simulation parameters (does NOT modify project or cut list)
  const [barLengthMm, setBarLengthMm] = useState<number>(6000);
  const [customBarInput, setCustomBarInput] = useState<string>('6000');
  const [sawKerfMm, setSawKerfMm] = useState<number>(3); // Standard blade kerf
  const [selectedProfileFilter, setSelectedProfileFilter] = useState<string>('todos');
  const [printNotice, setPrintNotice] = useState<boolean>(false);

  // Quick preset bar lengths
  const BAR_PRESETS = [3000, 5800, 6000, 12000];

  // 1. Extract raw cut items from project (identical piece source as CutListModule)
  const rawCutItems = useMemo<RawCutItem[]>(() => {
    const items: RawCutItem[] = [];

    const hasFrameInPieces = pieces.some(p => p.id.includes('frame') || p.id.includes('quadro') || p.id.includes('base_frame'));

    // A) Quadro Principal (Outer Frame) - Fallback ONLY if frame pieces are not already in FabricationModel finalPieces
    if (project.frame && !hasFrameInPieces && pieces.length === 0) {
      const frameProfile = project.frame.profile || 'Metalon 30x30 mm';
      
      // 2 horizontals
      items.push({
        id: 'frame-horiz-sup-inf',
        perfil: frameProfile,
        comprimento: Math.round(project.frame.width),
        quantidade: 2,
        grupo: 'Quadro Principal',
        nome: 'Quadro Principal (Horizontais)'
      });

      // 2 verticals
      items.push({
        id: 'frame-vert-esq-dir',
        perfil: frameProfile,
        comprimento: Math.round(project.frame.height),
        quantidade: 2,
        grupo: 'Quadro Principal',
        nome: 'Quadro Principal (Verticais)'
      });
    }

    // B) Internal Structural Components & Smart Fill pieces
    pieces.forEach((p, index) => {
      const perfilUsed = p.perfil || p.profile || project.frame?.profile || 'Metalon 30x30 mm';
      const compMm = Math.round(p.comprimento || p.length || 0);

      let groupName = 'Estrutura Interna';
      if (p.fillGroupId) {
        groupName = 'Preenchimento Vertical';
      } else if (p.grupo) {
        groupName = p.grupo;
      } else if (p.type) {
        groupName = PIECE_TYPE_LABELS[p.type] || 'Estrutura Interna';
      }

      const qty = (p.type === 'folha_porta' || p.type === 'folha_portao' || p.type === 'folha_janela') && p.leafQuantity 
        ? p.leafQuantity 
        : 1;

      items.push({
        id: p.id || `piece-${index}`,
        perfil: perfilUsed,
        comprimento: compMm,
        quantidade: qty,
        grupo: groupName,
        nome: p.name || 'Peça Interna'
      });
    });

    return items;
  }, [project, pieces]);

  // Unique list of present profiles
  const presentProfiles = useMemo<string[]>(() => {
    const set = new Set<string>();
    rawCutItems.forEach(item => set.add(item.perfil.trim()));
    return Array.from(set).sort();
  }, [rawCutItems]);

  // 2. Perform Optimization Algorithm (Best Fit Decreasing) grouped strictly by profile
  const optimizationResults = useMemo<ProfileOptimizationResult[]>(() => {
    const results: ProfileOptimizationResult[] = [];

    presentProfiles.forEach((profileName) => {
      // Collect all individual pieces for this profile
      const piecesToCut: PieceToCut[] = [];
      
      rawCutItems
        .filter(item => item.perfil.trim() === profileName)
        .forEach(item => {
          for (let q = 0; q < item.quantidade; q++) {
            piecesToCut.push({
              id: `${item.id}-${q}`,
              perfil: profileName,
              comprimento: item.comprimento,
              grupo: item.grupo,
              nome: item.nome
            });
          }
        });

      // Sort pieces in descending order of length (Best Fit Decreasing)
      piecesToCut.sort((a, b) => b.comprimento - a.comprimento);

      const bars: OptimizedBar[] = [];

      piecesToCut.forEach((p) => {
        let bestBarIndex = -1;
        let smallestRemainingAfter = Infinity;

        // Try to find the best existing bar that can fit this piece (+ saw kerf)
        for (let b = 0; b < bars.length; b++) {
          const bar = bars[b];
          const hasPieces = bar.pieces.length > 0;
          const requiredSpace = p.comprimento + (hasPieces ? sawKerfMm : 0);

          if (bar.remainingOffcutMm >= requiredSpace) {
            const remainingAfter = bar.remainingOffcutMm - requiredSpace;
            if (remainingAfter < smallestRemainingAfter) {
              smallestRemainingAfter = remainingAfter;
              bestBarIndex = b;
            }
          }
        }

        if (bestBarIndex !== -1) {
          // Place piece into existing best bar
          const targetBar = bars[bestBarIndex];
          const isFirstPiece = targetBar.pieces.length === 0;
          const kerfForThisPiece = isFirstPiece ? 0 : sawKerfMm;

          targetBar.pieces.push({
            pieceId: p.id,
            comprimento: p.comprimento,
            grupo: p.grupo,
            nome: p.nome
          });

          targetBar.usedPiecesLengthMm += p.comprimento;
          targetBar.kerfLossMm += kerfForThisPiece;
          targetBar.totalOccupiedMm = targetBar.usedPiecesLengthMm + targetBar.kerfLossMm;
          targetBar.remainingOffcutMm = Math.max(0, barLengthMm - targetBar.totalOccupiedMm);
          targetBar.efficiencyPercent = (targetBar.usedPiecesLengthMm / barLengthMm) * 100;
        } else {
          // Open a new bar
          const newBarNumber = bars.length + 1;
          const usedPiecesLength = p.comprimento;
          const kerfLoss = 0;
          const totalOccupied = usedPiecesLength;
          const remainingOffcut = Math.max(0, barLengthMm - totalOccupied);

          bars.push({
            barNumber: newBarNumber,
            profile: profileName,
            barLengthMm: barLengthMm,
            pieces: [{
              pieceId: p.id,
              comprimento: p.comprimento,
              grupo: p.grupo,
              nome: p.nome
            }],
            usedPiecesLengthMm: usedPiecesLength,
            kerfLossMm: kerfLoss,
            totalOccupiedMm: totalOccupied,
            remainingOffcutMm: remainingOffcut,
            efficiencyPercent: (usedPiecesLength / barLengthMm) * 100
          });
        }
      });

      // Summary metrics for this profile
      const totalBars = bars.length;
      const totalPiecesCount = piecesToCut.length;
      const totalMetersUsed = piecesToCut.reduce((acc, p) => acc + p.comprimento, 0) / 1000;
      const totalMetersPurchased = (totalBars * barLengthMm) / 1000;
      const totalMetersOffcut = Math.max(0, totalMetersPurchased - totalMetersUsed);
      const efficiencyPercent = totalMetersPurchased > 0 
        ? (totalMetersUsed / totalMetersPurchased) * 100 
        : 0;
      const wastePercent = Math.max(0, 100 - efficiencyPercent);

      results.push({
        profile: profileName,
        bars,
        totalBars,
        totalPiecesCount,
        totalMetersUsed,
        totalMetersPurchased,
        totalMetersOffcut,
        efficiencyPercent,
        wastePercent
      });
    });

    return results;
  }, [presentProfiles, rawCutItems, barLengthMm, sawKerfMm]);

  // Overall Global Statistics across all profiles
  const globalStats = useMemo(() => {
    let totalBarsAll = 0;
    let totalPiecesAll = 0;
    let totalMetersUsedAll = 0;
    let totalMetersPurchasedAll = 0;

    optimizationResults.forEach(res => {
      totalBarsAll += res.totalBars;
      totalPiecesAll += res.totalPiecesCount;
      totalMetersUsedAll += res.totalMetersUsed;
      totalMetersPurchasedAll += res.totalMetersPurchased;
    });

    const totalMetersOffcutAll = Math.max(0, totalMetersPurchasedAll - totalMetersUsedAll);
    const globalEfficiency = totalMetersPurchasedAll > 0 
      ? (totalMetersUsedAll / totalMetersPurchasedAll) * 100 
      : 0;
    const globalWaste = Math.max(0, 100 - globalEfficiency);

    return {
      totalBars: totalBarsAll,
      totalPieces: totalPiecesAll,
      totalMetersUsed: totalMetersUsedAll,
      totalMetersPurchased: totalMetersPurchasedAll,
      totalMetersOffcut: totalMetersOffcutAll,
      globalEfficiency,
      globalWaste
    };
  }, [optimizationResults]);

  // Utility to get efficiency badge styles and label
  const getEfficiencyBadge = (percent: number) => {
    if (percent >= 90) {
      return {
        label: '🟢 Excelente',
        text: 'Excelente Aproveitamento',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        badgeBg: 'bg-emerald-500 text-white',
        barColor: 'bg-emerald-500'
      };
    } else if (percent >= 82) {
      return {
        label: '🟡 Bom',
        text: 'Bom Aproveitamento',
        bg: 'bg-amber-50 text-amber-800 border-amber-300',
        badgeBg: 'bg-amber-500 text-slate-950',
        barColor: 'bg-amber-500'
      };
    } else if (percent >= 72) {
      return {
        label: '🟠 Regular',
        text: 'Aproveitamento Regular',
        bg: 'bg-orange-50 text-orange-800 border-orange-300',
        badgeBg: 'bg-orange-500 text-white',
        barColor: 'bg-orange-500'
      };
    } else {
      return {
        label: '🔴 Muito Desperdício',
        text: 'Atenção ao Desperdício',
        bg: 'bg-red-50 text-red-800 border-red-300',
        badgeBg: 'bg-red-600 text-white',
        barColor: 'bg-red-500'
      };
    }
  };

  // Handler for custom bar size change
  const handleBarSizeChange = (size: number) => {
    const valid = Math.max(500, Math.min(20000, size));
    setBarLengthMm(valid);
    setCustomBarInput(valid.toString());
  };

  // Handler for browser print execution
  const handlePrint = () => {
    setPrintNotice(false);
    try {
      window.print();
      setTimeout(() => setPrintNotice(true), 1500);
    } catch (e) {
      setPrintNotice(true);
    }
  };

  // Handler for direct PDF Generation via jsPDF + autoTable
  const handleGeneratePDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const primaryColor: [number, number, number] = [15, 23, 42]; // slate-900

      // Page Header
      doc.setFillColor(...primaryColor);
      doc.rect(14, 12, 182, 18, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('SERRALHERIA PROJETOS — PLANO DE OTIMIZAÇÃO DE BARRAS', 18, 20);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(251, 191, 36); // amber-400
      doc.text('Plano Técnico de Corte e Aproveitamento Máximo de Material', 18, 25);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, 190, 22, { align: 'right' });

      // Simulation Settings & Project Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, 34, 182, 26, 2, 2, 'FD');

      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('PROJETO:', 18, 40);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(project.name || 'Sem nome', 38, 40);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('SIMULAÇÃO DE BARRAS:', 18, 46);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Barra Comercial: ${barLengthMm} mm (${(barLengthMm/1000).toFixed(2)}m) | Perda por Corte (Serra): ${sawKerfMm} mm`, 62, 46);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('RESUMO GERAL:', 18, 52);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const effBadge = getEfficiencyBadge(globalStats.globalEfficiency);
      doc.text(`Total de Barras: ${globalStats.totalBars} | Utilizado: ${globalStats.totalMetersUsed.toFixed(2)} m | Sobras: ${globalStats.totalMetersOffcut.toFixed(2)} m | Aproveitamento: ${globalStats.globalEfficiency.toFixed(1)}% (${effBadge.text})`, 48, 52);

      // Section Title
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('DETALHAMENTO DO PLANO DE CORTE POR BARRA E PERFIL', 14, 66);

      let currentY = 70;

      optimizationResults.forEach((profResult) => {
        if (currentY > 240) {
          doc.addPage();
          currentY = 20;
        }

        // Profile Banner Header
        doc.setFillColor(30, 41, 59);
        doc.rect(14, currentY, 182, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(`PERFIL: ${profResult.profile.toUpperCase()} — (${profResult.totalBars} barras de ${barLengthMm}mm | Aproveitamento: ${profResult.efficiencyPercent.toFixed(1)}%)`, 18, currentY + 5);

        currentY += 9;

        // Table for Bars in this Profile
        const tableHead = [['# Barra', 'Peças a Cortar (Comprimento mm e Nome)', 'Metragem Peças', 'Sobra (Mm)', 'Aproveitamento']];
        const tableData = profResult.bars.map((bar) => {
          const piecesText = bar.pieces
            .map(p => `${p.comprimento}mm [${p.nome}]`)
            .join(' + ');

          return [
            `Barra ${bar.barNumber}`,
            piecesText,
            `${(bar.usedPiecesLengthMm / 1000).toFixed(2)} m`,
            `${bar.remainingOffcutMm} mm`,
            `${bar.efficiencyPercent.toFixed(1)}%`
          ];
        });

        autoTable(doc, {
          startY: currentY,
          head: tableHead,
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [51, 65, 85],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'left'
          },
          bodyStyles: {
            fontSize: 7.5,
            textColor: [15, 23, 42],
            cellPadding: 2
          },
          columnStyles: {
            0: { cellWidth: 18, fontStyle: 'bold', halign: 'center' },
            1: { cellWidth: 95, fontStyle: 'bold' },
            2: { cellWidth: 24, halign: 'center' },
            3: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
            4: { cellWidth: 23, halign: 'right', fontStyle: 'bold' }
          },
          alternateRowStyles: {
            fillColor: [241, 245, 249]
          }
        });

        currentY = (doc as any).lastAutoTable?.finalY + 8 || currentY + 30;
      });

      // Save PDF
      const rawName = project.name || 'Projeto';
      const sanitizedName = rawName.trim().replace(/[^a-zA-Z0-9_\-áéíóúãõçÁÉÍÓÚÃÕÇ]/g, '_');
      doc.save(`Plano_de_Otimizacao_Barras_${sanitizedName}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF do Plano de Otimização:', err);
      alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
    }
  };

  return (
    <div className="w-full space-y-6">

      {/* DEDICATED PRINT ORDER SHEET FOR BAR OPTIMIZATION (ONLY VISIBLE ON PRINT / PDF) */}
      <div className="hidden print:block space-y-5 font-sans text-slate-900">
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">
              SERRALHERIA PROJETOS — PLANO DE CORTE E OTIMIZAÇÃO DE BARRAS
            </h1>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              Esquema de Distribuição Inteligente por Barra Comercial
            </p>
          </div>
          <div className="text-right text-xs font-mono">
            <div><strong>Data e Hora:</strong> {new Date().toLocaleString('pt-BR')}</div>
            <div><strong>Projeto ID:</strong> {project.id}</div>
          </div>
        </div>

        {/* Project Metadata & Simulation Info */}
        <div className="border border-slate-700 bg-slate-50 p-3 rounded-lg text-xs grid grid-cols-2 gap-3 font-mono">
          <div>
            <span className="font-bold text-slate-500 uppercase block text-[10px]">Projeto:</span>
            <strong className="text-sm text-slate-950 font-bold">{project.name}</strong>
          </div>
          <div>
            <span className="font-bold text-slate-500 uppercase block text-[10px]">Tamanho da Barra Comercial:</span>
            <strong className="text-sm text-slate-950 font-bold">{barLengthMm} mm ({(barLengthMm/1000).toFixed(2)}m)</strong>
          </div>
          <div>
            <span className="font-bold text-slate-500 uppercase block text-[10px]">Espessura do Corte (Serra):</span>
            <strong className="text-slate-900">{sawKerfMm} mm</strong>
          </div>
          <div>
            <span className="font-bold text-slate-500 uppercase block text-[10px]">Total de Barras Necessárias:</span>
            <strong className="text-slate-950 font-bold">{globalStats.totalBars} barras de {(barLengthMm/1000).toFixed(2)}m</strong>
          </div>
        </div>

        {/* Summary Metric Box */}
        <div className="border border-slate-700 p-3 bg-slate-100 font-mono text-xs rounded space-y-1">
          <div className="grid grid-cols-4 gap-2 text-slate-900 font-bold">
            <div>Barras: {globalStats.totalBars} un</div>
            <div>Utilizado: {globalStats.totalMetersUsed.toFixed(2)} m</div>
            <div>Sobras: {globalStats.totalMetersOffcut.toFixed(2)} m</div>
            <div>Aproveitamento: {globalStats.globalEfficiency.toFixed(1)}%</div>
          </div>
        </div>

        {/* Breakdown Tables by Profile */}
        {optimizationResults.map((prof) => (
          <div key={`print-opt-${prof.profile}`} className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-600 pb-1 font-mono">
              Perfil: {prof.profile} ({prof.totalBars} barras | Aproveitamento: {prof.efficiencyPercent.toFixed(1)}%)
            </h3>

            <table className="w-full text-left border-collapse font-mono text-xs border border-slate-700">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold uppercase">
                  <th className="py-1.5 px-2 border border-slate-700 w-16 text-center"># Barra</th>
                  <th className="py-1.5 px-2 border border-slate-700">Peças a Cortar (mm)</th>
                  <th className="py-1.5 px-2 border border-slate-700 w-28 text-center">Metragem Útil</th>
                  <th className="py-1.5 px-2 border border-slate-700 w-24 text-center">Sobra</th>
                  <th className="py-1.5 px-2 border border-slate-700 w-24 text-right">Aproveit.</th>
                </tr>
              </thead>
              <tbody>
                {prof.bars.map((bar) => (
                  <tr key={`print-bar-${prof.profile}-${bar.barNumber}`} className="border-b border-slate-400">
                    <td className="py-1.5 px-2 border border-slate-600 text-center font-bold">Barra {bar.barNumber}</td>
                    <td className="py-1.5 px-2 border border-slate-600">
                      {bar.pieces.map(p => `${p.comprimento}mm (${p.nome})`).join(' + ')}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-600 text-center font-bold">{(bar.usedPiecesLengthMm / 1000).toFixed(2)} m</td>
                    <td className="py-1.5 px-2 border border-slate-600 text-center font-bold">{bar.remainingOffcutMm} mm</td>
                    <td className="py-1.5 px-2 border border-slate-600 text-right font-bold">{bar.efficiencyPercent.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* 1. MODULE HEADER & SIMULATION CONTROLS TOOLBAR (SCREEN ONLY) */}
      <div className="print:hidden bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-slate-900 text-amber-400 rounded-2xl shadow-sm">
              <Zap className="w-6 h-6 fill-amber-400/20 stroke-[2.2]" />
            </span>
            <div>
              <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
                Otimização Inteligente de Barras
                <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  Algoritmo Best-Fit
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Distribuição automática dos cortes nas barras comerciais com desperdício mínimo de metalon
              </p>
            </div>
          </div>

          {/* Action Buttons: Navigation & Export */}
          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToCutList && (
              <button
                id="btn-voltar-lista-corte"
                type="button"
                onClick={onNavigateToCutList}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer border border-slate-300"
              >
                <Scissors className="w-4 h-4 text-amber-600" />
                <span>Ver Lista de Corte</span>
              </button>
            )}

            <button
              id="btn-imprimir-otimizacao"
              type="button"
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer border border-slate-700"
              title="Imprimir pelo navegador"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button
              id="btn-gerar-pdf-otimizacao"
              type="button"
              onClick={handleGeneratePDF}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer border border-amber-600"
              title="Baixar PDF com o Plano de Corte Completo"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>📄 Gerar PDF Plano de Corte</span>
            </button>
          </div>
        </div>

        {/* PRINT NOTICE */}
        {printNotice && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start space-x-2 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong>Dica de Impressão e PDF:</strong> Caso o navegador limite a janela de impressão no Preview, utilize o botão <strong className="text-amber-950">"📄 Gerar PDF Plano de Corte"</strong> para baixar diretamente o documento em PDF!
            </div>
            <button type="button" onClick={() => setPrintNotice(false)} className="font-bold text-amber-800 hover:text-amber-950">✕</button>
          </div>
        )}

        {/* SIMULATION PARAMETERS PANEL (Interactive controls) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Simulação & Parâmetros de Corte Comercial</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono italic">
              Não altera a Lista de Corte nem os dados do projeto
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Tamanho da Barra Comercial */}
            <div className="space-y-2">
              <label htmlFor="input-tamanho-barra" className="block text-xs font-bold text-slate-700 font-mono">
                1. Tamanho da Barra Comercial (mm):
              </label>
              
              {/* Presets buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {BAR_PRESETS.map((preset) => (
                  <button
                    key={`preset-${preset}`}
                    id={`btn-preset-barra-${preset}`}
                    type="button"
                    onClick={() => handleBarSizeChange(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer border ${
                      barLengthMm === preset 
                        ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset / 1000}m ({preset}mm)
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  id="input-tamanho-barra"
                  type="number"
                  min="500"
                  max="20000"
                  step="50"
                  value={customBarInput}
                  onChange={(e) => {
                    setCustomBarInput(e.target.value);
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 500) {
                      setBarLengthMm(val);
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                />
                <span className="text-xs font-mono text-slate-500 shrink-0 font-bold">mm</span>
              </div>
            </div>

            {/* 2. Espessura do Corte da Serra (Kerf) */}
            <div className="space-y-2">
              <label htmlFor="select-perda-serra" className="block text-xs font-bold text-slate-700 font-mono">
                2. Perda por Corte / Serra (Kerf mm):
              </label>
              
              <div className="flex items-center gap-2">
                {[0, 2, 3, 5].map((kVal) => (
                  <button
                    key={`kerf-${kVal}`}
                    id={`btn-kerf-${kVal}`}
                    type="button"
                    onClick={() => setSawKerfMm(kVal)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer border text-center ${
                      sawKerfMm === kVal
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {kVal === 0 ? '0 mm (Ideal)' : `${kVal} mm`}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 font-mono">
                Desconto do disco de corte entre cada peça na barra.
              </p>
            </div>

            {/* 3. Filtro de Perfil */}
            <div className="space-y-2">
              <label htmlFor="select-filtro-perfil-otim" className="block text-xs font-bold text-slate-700 font-mono">
                3. Perfil de Metalon:
              </label>
              
              <select
                id="select-filtro-perfil-otim"
                value={selectedProfileFilter}
                onChange={(e) => setSelectedProfileFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs cursor-pointer"
              >
                <option value="todos">Todos os Perfis ({presentProfiles.length})</option>
                {presentProfiles.map((prof) => (
                  <option key={`opt-prof-${prof}`} value={prof}>
                    {prof}
                  </option>
                ))}
              </select>

              <div className="text-[11px] text-slate-500 font-mono">
                Cada perfil é otimizado estritamente separado sem misturar.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GLOBAL OVERALL SUMMARY CARDS (SCREEN ONLY) */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total de Barras Compradas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-amber-400 rounded-xl shadow-xs shrink-0">
            <Layers className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono block">
              Total de Barras
            </span>
            <div className="text-xl font-bold font-mono text-slate-900">
              {globalStats.totalBars} <span className="text-xs text-slate-500 font-normal">barras ({barLengthMm/1000}m)</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              ≈ {(globalStats.totalMetersPurchased).toFixed(2)} m total comprado
            </span>
          </div>
        </div>

        {/* Card 2: Metragem Utilizada */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl shrink-0">
            <Scissors className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono block">
              Material Útil Empregado
            </span>
            <div className="text-xl font-bold font-mono text-slate-900">
              {globalStats.totalMetersUsed.toFixed(2)} <span className="text-xs text-slate-500 font-normal">metros</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {globalStats.totalPieces} peças cortadas no total
            </span>
          </div>
        </div>

        {/* Card 3: Total de Sobras (Offcuts) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl shrink-0">
            <BarChart2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono block">
              Sobras Totais (Retalhos)
            </span>
            <div className="text-xl font-bold font-mono text-slate-900">
              {globalStats.totalMetersOffcut.toFixed(2)} <span className="text-xs text-slate-500 font-normal">metros</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Desperdício: {globalStats.globalWaste.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Card 4: Taxa de Aproveitamento (%) */}
        {(() => {
          const badge = getEfficiencyBadge(globalStats.globalEfficiency);
          return (
            <div className={`border rounded-2xl p-4 shadow-sm flex items-center space-x-3.5 ${badge.bg}`}>
              <div className={`p-3 rounded-xl shrink-0 ${badge.badgeBg}`}>
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase font-mono block opacity-80">
                  Aproveitamento Global
                </span>
                <div className="text-xl font-bold font-mono">
                  {globalStats.globalEfficiency.toFixed(1)}%
                </div>
                <span className="text-[10px] font-bold font-mono">
                  {badge.label}
                </span>
              </div>
            </div>
          );
        })()}

      </div>

      {/* 3. OPTIMIZATION CUT PLAN BY PROFILE (SCREEN ONLY) */}
      <div className="print:hidden space-y-8">
        {optimizationResults
          .filter(r => selectedProfileFilter === 'todos' || selectedProfileFilter === r.profile)
          .map((profResult) => {
            const effBadge = getEfficiencyBadge(profResult.efficiencyPercent);

            return (
              <div 
                key={`prof-opt-${profResult.profile}`}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5"
              >
                {/* Profile Header Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <span className="p-2 bg-slate-900 text-amber-400 font-mono font-bold text-xs rounded-xl">
                      PERFIL
                    </span>
                    <div>
                      <h3 className="text-lg font-bold font-mono text-slate-950 uppercase tracking-wide">
                        {profResult.profile}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        {profResult.totalPiecesCount} peças • {profResult.totalBars} barras de {barLengthMm}mm ({(barLengthMm/1000)}m)
                      </p>
                    </div>
                  </div>

                  {/* Profile Efficiency Badge */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right font-mono">
                      <div className="text-xs text-slate-500">Aproveitamento do Perfil</div>
                      <div className="text-base font-bold text-slate-900">{profResult.efficiencyPercent.toFixed(1)}%</div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono border ${effBadge.bg}`}>
                      {effBadge.label}
                    </span>
                  </div>
                </div>

                {/* Profile Summary Strip */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Barras Necessárias:</span>
                    <strong className="text-slate-900">{profResult.totalBars} barras</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Metragem Útil:</span>
                    <strong className="text-emerald-700">{profResult.totalMetersUsed.toFixed(2)} m</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Metragem Comprada:</span>
                    <strong className="text-slate-900">{profResult.totalMetersPurchased.toFixed(2)} m</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Sobras (Offcuts):</span>
                    <strong className="text-amber-800">{profResult.totalMetersOffcut.toFixed(2)} m ({profResult.wastePercent.toFixed(1)}%)</strong>
                  </div>
                </div>

                {/* BARS LIST & VISUAL CUT DIAGRAMS */}
                <div className="space-y-4">
                  {profResult.bars.map((bar) => {
                    const barBadge = getEfficiencyBadge(bar.efficiencyPercent);

                    return (
                      <div 
                        key={`bar-${profResult.profile}-${bar.barNumber}`}
                        className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 hover:border-slate-300 transition"
                      >
                        {/* Bar Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-1 bg-slate-900 text-amber-400 font-bold rounded-lg text-xs">
                              Barra {bar.barNumber}
                            </span>
                            <span className="font-bold text-slate-800">
                              {profResult.profile}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600">
                              Uso: <strong>{(bar.usedPiecesLengthMm / 1000).toFixed(2)}m</strong> / {(bar.barLengthMm / 1000)}m
                            </span>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="text-slate-700">
                              Sobra: <strong className="text-amber-800 font-bold">{bar.remainingOffcutMm} mm</strong>
                            </span>
                            <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${barBadge.bg}`}>
                              {bar.efficiencyPercent.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* VISUAL DIAGRAM OF THE BAR CUTS */}
                        <div className="space-y-1">
                          <div className="w-full h-9 bg-slate-200 rounded-xl overflow-hidden flex shadow-inner border border-slate-300 relative">
                            {bar.pieces.map((piece, pIdx) => {
                              const piecePct = (piece.comprimento / bar.barLengthMm) * 100;

                              // Alternating segment colors for visual separation
                              const bgColors = [
                                'bg-indigo-600 text-white',
                                'bg-slate-800 text-amber-300',
                                'bg-blue-600 text-white',
                                'bg-teal-700 text-white',
                                'bg-violet-700 text-white'
                              ];
                              const colorClass = bgColors[pIdx % bgColors.length];

                              return (
                                <div
                                  key={`p-seg-${bar.barNumber}-${pIdx}`}
                                  style={{ width: `${piecePct}%` }}
                                  className={`h-full ${colorClass} border-r border-white/40 flex items-center justify-center px-1 font-mono text-[11px] font-bold truncate transition-all relative group cursor-pointer`}
                                  title={`${piece.nome}: ${piece.comprimento} mm (${piece.grupo})`}
                                >
                                  <span className="truncate">
                                    {piece.comprimento}mm
                                  </span>

                                  {/* Tooltip on Hover */}
                                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-slate-950 text-white text-[10px] p-2 rounded-lg shadow-xl whitespace-nowrap z-30 font-mono pointer-events-none border border-slate-800">
                                    <span className="font-bold text-amber-400">{piece.nome}</span>
                                    <span>Comprimento: {piece.comprimento} mm</span>
                                    <span className="text-slate-400">Grupo: {piece.grupo}</span>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Remaining Offcut (Sobra) Segment */}
                            {bar.remainingOffcutMm > 0 && (
                              <div
                                style={{ width: `${(bar.remainingOffcutMm / bar.barLengthMm) * 100}%` }}
                                className="h-full bg-amber-100/90 border-l border-dashed border-amber-400 flex items-center justify-center px-1 font-mono text-[10px] font-bold text-amber-900 truncate"
                                title={`Sobra / Retalho: ${bar.remainingOffcutMm} mm`}
                              >
                                <span className="truncate">
                                  Sobra: {bar.remainingOffcutMm}mm
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Saw kerf loss indicator text if kerf > 0 */}
                          {sawKerfMm > 0 && bar.pieces.length > 1 && (
                            <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1">
                              <span>Perda acumulada por corte de serra: {bar.kerfLossMm} mm ({bar.pieces.length - 1} cortes x {sawKerfMm}mm)</span>
                              <span>Barra Total: {bar.barLengthMm} mm</span>
                            </div>
                          )}
                        </div>

                        {/* Piece breakdown list */}
                        <div className="pt-1 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Cortes nesta barra:</span>
                          {bar.pieces.map((piece, idx) => (
                            <span 
                              key={`p-badge-${idx}`}
                              className="bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1 shadow-2xs"
                            >
                              <strong className="text-slate-950 font-bold">{piece.comprimento} mm</strong>
                              <span className="text-slate-400">({piece.nome})</span>
                            </span>
                          ))}
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
      </div>

    </div>
  );
};
