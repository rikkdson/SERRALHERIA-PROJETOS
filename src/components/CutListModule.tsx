/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Scissors, 
  Search, 
  Filter, 
  ArrowUpDown, 
  CheckCircle2, 
  Circle, 
  Copy, 
  Printer, 
  Box, 
  Layers, 
  Ruler, 
  Check, 
  AlertCircle,
  FileText,
  Tag,
  Download
} from 'lucide-react';
import { MetalProject, PieceConfig, PIECE_TYPE_LABELS } from '../types';

export interface RawCutItem {
  id: string;
  perfil: string;
  comprimento: number; // em milímetros
  quantidade: number;
  grupo: string;
  orientacao: 'horizontal' | 'vertical' | 'diagonal';
  ordem: number;
  nome: string;
}

export interface GroupedCutItem {
  key: string;
  perfil: string;
  comprimento: number; // em milímetros
  quantidadeTotal: number;
  grupos: { nome: string; quantidade: number }[];
  orientacaoPrincipal: 'horizontal' | 'vertical' | 'diagonal';
  ordemMinima: number;
  subItems: RawCutItem[];
}

interface CutListModuleProps {
  project: MetalProject;
  pieces: PieceConfig[];
  onNavigateToStructure?: () => void;
}

export const CutListModule: React.FC<CutListModuleProps> = ({
  project,
  pieces = [],
  onNavigateToStructure
}) => {
  // State for cut list completion checkmarks in the workshop
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<string>('todos');
  const [lengthFilter, setLengthFilter] = useState<'todos' | 'longo' | 'medio' | 'curto'>('todos');
  const [quantityFilter, setQuantityFilter] = useState<'todos' | 'lote' | 'pouco'>('todos');
  const [sortBy, setSortBy] = useState<'maior_comprimento' | 'menor_comprimento' | 'perfil' | 'ordem_fabricacao'>('ordem_fabricacao');

  // 1. Extract ALL raw cut items from project (Quadro Principal + Pieces + Preenchimento)
  const rawCutItems = useMemo<RawCutItem[]>(() => {
    const items: RawCutItem[] = [];

    const hasFrameInPieces = pieces.some(p => p.id.includes('frame') || p.id.includes('quadro') || p.id.includes('base_frame'));

    // A) Quadro Principal (Outer Frame) - Fallback ONLY if frame pieces are not already in FabricationModel finalPieces
    if (project.frame && !hasFrameInPieces && pieces.length === 0) {
      const frameProfile = project.frame.profile || 'Metalon 30x30 mm';
      
      // 2 horizontal frame members (Superior e Inferior)
      items.push({
        id: 'frame-horiz-sup-inf',
        perfil: frameProfile,
        comprimento: Math.round(project.frame.width),
        quantidade: 2,
        grupo: 'Quadro Principal',
        orientacao: 'horizontal',
        ordem: 0,
        nome: 'Quadro Principal (Horizontais)'
      });

      // 2 vertical frame members (Laterais Esquerda e Direita)
      items.push({
        id: 'frame-vert-esq-dir',
        perfil: frameProfile,
        comprimento: Math.round(project.frame.height),
        quantidade: 2,
        grupo: 'Quadro Principal',
        orientacao: 'vertical',
        ordem: 1,
        nome: 'Quadro Principal (Verticais)'
      });
    }

    // B) Internal Structural Components & Smart Fill pieces
    pieces.forEach((p, index) => {
      const perfilUsed = p.perfil || p.profile || project.frame?.profile || 'Metalon 30x30 mm';
      const compMm = Math.round(p.comprimento || p.length || 0);
      const orient = p.orientacao || p.orientation || 'horizontal';
      const ord = p.ordem !== undefined ? p.ordem : index + 2;

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
        id: p.id,
        perfil: perfilUsed,
        comprimento: compMm,
        quantidade: qty,
        grupo: groupName,
        orientacao: orient,
        ordem: ord,
        nome: p.name || 'Peça Interna'
      });
    });

    return items;
  }, [project, pieces]);

  // 2. Group identical pieces (same profile + same length)
  const groupedCutItems = useMemo<GroupedCutItem[]>(() => {
    const map = new Map<string, GroupedCutItem>();

    rawCutItems.forEach((item) => {
      const cleanProfile = item.perfil.trim();
      const key = `${cleanProfile.toLowerCase()}___${item.comprimento}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          perfil: cleanProfile,
          comprimento: item.comprimento,
          quantidadeTotal: item.quantidade,
          grupos: [{ nome: item.grupo, quantidade: item.quantidade }],
          orientacaoPrincipal: item.orientacao,
          ordemMinima: item.ordem,
          subItems: [item]
        });
      } else {
        const existing = map.get(key)!;
        existing.quantidadeTotal += item.quantidade;
        existing.subItems.push(item);

        if (item.ordem < existing.ordemMinima) {
          existing.ordemMinima = item.ordem;
        }

        const existingGroup = existing.grupos.find((g) => g.nome === item.grupo);
        if (existingGroup) {
          existingGroup.quantidade += item.quantidade;
        } else {
          existing.grupos.push({ nome: item.grupo, quantidade: item.quantidade });
        }
      }
    });

    return Array.from(map.values());
  }, [rawCutItems]);

  // Unique list of profiles present in project for filtering
  const presentProfiles = useMemo<string[]>(() => {
    const set = new Set<string>();
    groupedCutItems.forEach(i => set.add(i.perfil));
    return Array.from(set).sort();
  }, [groupedCutItems]);

  // 3. Apply Filters, Search & Sorting
  const filteredAndSortedItems = useMemo<GroupedCutItem[]>(() => {
    let result = [...groupedCutItems];

    // Filter by text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        const matchProfile = item.perfil.toLowerCase().includes(query);
        const matchComp = `${item.comprimento} mm`.includes(query) || `${item.comprimento}`.includes(query);
        const matchGroups = item.grupos.some(g => g.nome.toLowerCase().includes(query));
        const matchSub = item.subItems.some(s => s.nome.toLowerCase().includes(query));
        return matchProfile || matchComp || matchGroups || matchSub;
      });
    }

    // Filter by Profile
    if (selectedProfile !== 'todos') {
      result = result.filter(item => item.perfil.toLowerCase() === selectedProfile.toLowerCase());
    }

    // Filter by Length
    if (lengthFilter === 'longo') {
      result = result.filter(item => item.comprimento >= 2000);
    } else if (lengthFilter === 'medio') {
      result = result.filter(item => item.comprimento >= 1000 && item.comprimento < 2000);
    } else if (lengthFilter === 'curto') {
      result = result.filter(item => item.comprimento < 1000);
    }

    // Filter by Quantity
    if (quantityFilter === 'lote') {
      result = result.filter(item => item.quantidadeTotal >= 5);
    } else if (quantityFilter === 'pouco') {
      result = result.filter(item => item.quantidadeTotal < 5);
    }

    // Apply Sorting
    result.sort((a, b) => {
      if (sortBy === 'maior_comprimento') {
        return b.comprimento - a.comprimento;
      }
      if (sortBy === 'menor_comprimento') {
        return a.comprimento - b.comprimento;
      }
      if (sortBy === 'perfil') {
        return a.perfil.localeCompare(b.perfil);
      }
      // default: ordem_fabricacao
      return a.ordemMinima - b.ordemMinima;
    });

    return result;
  }, [groupedCutItems, searchQuery, selectedProfile, lengthFilter, quantityFilter, sortBy]);

  // 4. Overall Totals Calculations
  const totals = useMemo(() => {
    let totalPieces = 0;
    let totalMeters = 0;

    const profileBreakdown: Record<string, { totalMeters: number; pieceCount: number; bars6m: number }> = {};

    groupedCutItems.forEach((item) => {
      const pieceCount = item.quantidadeTotal;
      const lengthMeters = (item.quantidadeTotal * item.comprimento) / 1000;

      totalPieces += pieceCount;
      totalMeters += lengthMeters;

      if (!profileBreakdown[item.perfil]) {
        profileBreakdown[item.perfil] = { totalMeters: 0, pieceCount: 0, bars6m: 0 };
      }
      profileBreakdown[item.perfil].totalMeters += lengthMeters;
      profileBreakdown[item.perfil].pieceCount += pieceCount;
    });

    // Compute 6m bars per profile
    let grandTotalBars6m = 0;
    Object.keys(profileBreakdown).forEach((prof) => {
      const bars = Math.ceil(profileBreakdown[prof].totalMeters / 6);
      profileBreakdown[prof].bars6m = bars;
      grandTotalBars6m += bars;
    });

    return {
      totalPieces,
      totalMeters,
      totalBars6m: grandTotalBars6m,
      profileBreakdown
    };
  }, [groupedCutItems]);

  // Toggle cut completion for an item key
  const toggleItemCompletion = (key: string) => {
    setCompletedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Copy Cut List Summary to Clipboard
  const handleCopyCutList = () => {
    let text = `📋 ORDEM DE CORTE - SERRALHERIA PROJETOS\n`;
    text += `Projeto: ${project.name}\n`;
    if (project.frame) {
      text += `Quadro: ${project.frame.displayWidth}x${project.frame.displayHeight} ${project.frame.displayUnit} (${project.frame.profile})\n`;
    }
    text += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    text += `----------------------------------------\n\n`;

    Object.keys(totals.profileBreakdown).forEach(prof => {
      const data = totals.profileBreakdown[prof];
      text += `📦 PERFIL: ${prof.toUpperCase()}\n`;
      text += `Total: ${data.pieceCount} peças | ${data.totalMeters.toFixed(2)}m (≈ ${data.bars6m} barras de 6m)\n`;
      
      const profItems = groupedCutItems.filter(i => i.perfil === prof);
      profItems.forEach(item => {
        const groupsStr = item.grupos.map(g => g.nome).join(', ');
        text += `  • ${item.quantidadeTotal} peças × ${item.comprimento} mm [${groupsStr}]\n`;
      });
      text += `\n`;
    });

    text += `----------------------------------------\n`;
    text += `TOTAL GERAL: ${totals.totalPieces} peças | ${totals.totalMeters.toFixed(2)} metros | ≈ ${totals.totalBars6m} barras de 6m\n`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 3000);
    });
  };

  // Group Badge Color Selector
  const getGroupBadgeStyle = (grupoNome: string) => {
    const name = grupoNome.toLowerCase();
    if (name.includes('quadro principal')) {
      return 'bg-slate-900 text-slate-100 border-slate-700 font-bold';
    }
    if (name.includes('preenchimento')) {
      return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
    }
    if (name.includes('diagonal')) {
      return 'bg-rose-100 text-rose-900 border-rose-300 font-bold';
    }
    if (name.includes('travessa') || name.includes('coluna') || name.includes('divisão')) {
      return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    }
    if (name.includes('quadro interno')) {
      return 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold';
    }
    if (name.includes('folha')) {
      return 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold';
    }
    return 'bg-slate-100 text-slate-800 border-slate-300 font-bold';
  };

  // Handler for browser print execution
  const [printBlockedNotice, setPrintBlockedNotice] = useState(false);

  const handlePrint = () => {
    setPrintBlockedNotice(false);
    try {
      window.print();
      setTimeout(() => {
        setPrintBlockedNotice(true);
      }, 1500);
    } catch (err) {
      console.warn("window.print() indisponível neste ambiente:", err);
      setPrintBlockedNotice(true);
    }
  };

  // Handler for direct PDF generation via jsPDF + autoTable
  const handleGeneratePDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const primaryColor: [number, number, number] = [15, 23, 42]; // slate-900
      const lightBg: [number, number, number] = [248, 250, 252]; // slate-50

      // Header Banner
      doc.setFillColor(...primaryColor);
      doc.rect(14, 12, 182, 18, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('SERRALHERIA PROJETOS — ORDEM DE CORTE', 18, 20);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(251, 191, 36); // amber-400
      doc.text('Relatório Técnico de Corte Milimétrico para Oficina', 18, 25);

      // Date right aligned
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, 190, 22, { align: 'right' });

      // Project Metadata Box
      doc.setFillColor(...lightBg);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, 34, 182, 24, 2, 2, 'FD');

      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('PROJETO:', 18, 40);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(project.name || 'Sem nome', 38, 40);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('ESTRUTURA:', 18, 46);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const frameStr = project.frame 
        ? `${project.frame.displayWidth} x ${project.frame.displayHeight} ${project.frame.displayUnit} (${project.frame.profile || 'Metalon 30x30 mm'})`
        : 'N/A';
      doc.text(frameStr, 42, 46);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('PEÇAS TOTAIS:', 18, 52);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${totals.totalPieces} peças`, 46, 52);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('MATERIAL ESTIMADO:', 110, 52);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${totals.totalMeters.toFixed(2)} m (≈ ${totals.totalBars6m} barras de 6m)`, 148, 52);

      // Table Header Label
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('TABELA COMPLETA DE CORTE (TODAS AS PEÇAS)', 14, 65);

      // AutoTable
      const tableHead = [['#', 'Perfil / Metalon', 'Qtd', 'Comprimento', 'Grupo / Origem', 'Total Linear']];
      const tableData = groupedCutItems.map((item, idx) => {
        const lineMeters = (item.quantidadeTotal * item.comprimento) / 1000;
        const groupsStr = item.grupos.map(g => `${g.nome}${g.quantidade > 1 ? ` (${g.quantidade}x)` : ''}`).join(', ');
        return [
          (idx + 1).toString(),
          item.perfil,
          `${item.quantidadeTotal}x`,
          `${item.comprimento} mm`,
          groupsStr,
          `${lineMeters.toFixed(2)} m`
        ];
      });

      autoTable(doc, {
        startY: 68,
        head: tableHead,
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [15, 23, 42],
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 45, fontStyle: 'bold' },
          2: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
          3: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
          4: { cellWidth: 55 },
          5: { cellWidth: 27, halign: 'right', fontStyle: 'bold' }
        },
        alternateRowStyles: {
          fillColor: [241, 245, 249]
        }
      });

      // Summary Box
      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      let summaryStartY = finalY + 8;

      if (summaryStartY > 240) {
        doc.addPage();
        summaryStartY = 20;
      }

      doc.setFillColor(15, 23, 42);
      doc.rect(14, summaryStartY, 182, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('RESUMO GERAL DE FABRICAÇÃO E MATERIAL', 18, summaryStartY + 5);

      let summaryBoxY = summaryStartY + 7;
      const profileKeys = Object.keys(totals.profileBreakdown);
      const boxHeight = 14 + (profileKeys.length * 5);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, summaryBoxY, 182, boxHeight, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);

      doc.text(`Total Geral de Peças: ${totals.totalPieces} peças`, 18, summaryBoxY + 5);
      doc.text(`Material Linear Total: ${totals.totalMeters.toFixed(2)} metros`, 80, summaryBoxY + 5);
      doc.text(`Barras de 6m Estimadas: ≈ ${totals.totalBars6m} barras`, 140, summaryBoxY + 5);

      let lineY = summaryBoxY + 10;
      doc.setDrawColor(226, 232, 240);
      doc.line(18, lineY - 2, 192, lineY - 2);

      doc.setFont('helvetica', 'bold');
      doc.text('Detalhamento por Perfil:', 18, lineY);
      doc.setFont('helvetica', 'normal');

      profileKeys.forEach((prof) => {
        lineY += 5;
        const bd = totals.profileBreakdown[prof];
        doc.text(`• ${prof}:`, 22, lineY);
        doc.text(`${bd.pieceCount} peças`, 80, lineY);
        doc.text(`${bd.totalMeters.toFixed(2)} m (≈ ${bd.bars6m} barras de 6m)`, 140, lineY);
      });

      // Download PDF
      const rawName = project.name || 'Projeto';
      const sanitizedName = rawName.trim().replace(/[^a-zA-Z0-9_\-áéíóúãõçÁÉÍÓÚÃÕÇ]/g, '_');
      doc.save(`Lista_de_Corte_${sanitizedName}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF da Lista de Corte:', error);
      alert('Ocorreu um erro ao gerar o arquivo PDF. Por favor, tente novamente.');
    }
  };

  return (
    <div className="w-full space-y-6">

      {/* DEDICATED PRINT ORDER SHEET (ONLY VISIBLE ON PRINT / PDF) */}
      <div className="hidden print:block space-y-5 font-sans text-slate-900">
        {/* Printable Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">
              SERRALHERIA PROJETOS — ORDEM DE CORTE
            </h1>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              Relatório Técnico de Corte Milimétrico para Oficina
            </p>
          </div>
          <div className="text-right text-xs font-mono">
            <div><strong>Data e Hora:</strong> {new Date().toLocaleString('pt-BR')}</div>
            <div><strong>Projeto ID:</strong> {project.id}</div>
          </div>
        </div>

        {/* Project Metadata Box */}
        <div className="border border-slate-700 bg-slate-50 p-3 rounded-lg text-xs grid grid-cols-2 gap-3 font-mono">
          <div>
            <span className="font-bold text-slate-500 uppercase block text-[10px]">Nome do Projeto:</span>
            <strong className="text-sm text-slate-950 font-bold">{project.name}</strong>
          </div>
          <div>
            <span className="font-bold text-slate-500 uppercase block text-[10px]">Dimensões da Estrutura:</span>
            <strong className="text-sm text-slate-950 font-bold">
              {project.frame ? `${project.frame.displayWidth} x ${project.frame.displayHeight} ${project.frame.displayUnit}` : 'N/A'}
              {project.frame?.profile ? ` (${project.frame.profile})` : ''}
            </strong>
          </div>
          <div>
            <span className="font-bold text-slate-500 uppercase block text-[10px]">Quantidade Total de Peças:</span>
            <strong className="text-slate-900">{totals.totalPieces} peças</strong>
          </div>
          <div>
            <span className="font-bold text-slate-500 uppercase block text-[10px]">Material Total & Barras 6m:</span>
            <strong className="text-slate-900">{totals.totalMeters.toFixed(2)} m (≈ {totals.totalBars6m} barras de 6m)</strong>
          </div>
        </div>

        {/* Printable Cut Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 font-mono border-b border-slate-400 pb-1">
            ✂️ Tabela Completa de Corte (Todas as Peças)
          </h3>
          <table className="w-full text-left border-collapse font-mono text-xs border border-slate-700">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-bold uppercase">
                <th className="py-2 px-2 border border-slate-700 w-8 text-center">#</th>
                <th className="py-2 px-2 border border-slate-700">Perfil / Metalon</th>
                <th className="py-2 px-2 border border-slate-700 w-24 text-center">Quantidade</th>
                <th className="py-2 px-2 border border-slate-700 w-32 text-center">Comprimento</th>
                <th className="py-2 px-2 border border-slate-700">Grupo / Origem</th>
                <th className="py-2 px-2 border border-slate-700 w-28 text-right">Total Linear</th>
              </tr>
            </thead>
            <tbody>
              {groupedCutItems.map((item, idx) => {
                const lineMeters = (item.quantidadeTotal * item.comprimento) / 1000;
                const groupsStr = item.grupos.map(g => `${g.nome}${g.quantidade > 1 ? ` (${g.quantidade}x)` : ''}`).join(', ');
                return (
                  <tr key={`print-${item.key}`} className="border-b border-slate-400">
                    <td className="py-1.5 px-2 border border-slate-600 text-center font-bold">{idx + 1}</td>
                    <td className="py-1.5 px-2 border border-slate-600 font-bold text-slate-950">{item.perfil}</td>
                    <td className="py-1.5 px-2 border border-slate-600 text-center font-bold">{item.quantidadeTotal} peças</td>
                    <td className="py-1.5 px-2 border border-slate-600 text-center font-bold text-slate-950">{item.comprimento} mm</td>
                    <td className="py-1.5 px-2 border border-slate-600 text-slate-800">{groupsStr}</td>
                    <td className="py-1.5 px-2 border border-slate-600 text-right font-bold">{lineMeters.toFixed(2)} m</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Printable Summary Box */}
        <div className="border border-slate-700 p-3 bg-slate-50 font-mono text-xs rounded print-break-inside-avoid space-y-2">
          <h4 className="font-bold text-slate-900 uppercase border-b border-slate-400 pb-1">
            📋 Resumo Geral de Fabricação
          </h4>
          <div className="grid grid-cols-3 gap-2 text-slate-800">
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Peças Totais:</span>
              <strong className="text-slate-950">{totals.totalPieces} peças</strong>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Material Total:</span>
              <strong className="text-slate-950">{totals.totalMeters.toFixed(2)} m</strong>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Barras de 6m Estimadas:</span>
              <strong className="text-slate-950">≈ {totals.totalBars6m} barras</strong>
            </div>
          </div>
          
          <div className="border-t border-slate-300 pt-2 text-[11px] text-slate-800">
            <span className="font-bold block mb-1">Detalhamento por Perfil:</span>
            {Object.keys(totals.profileBreakdown).map((prof) => {
              const bd = totals.profileBreakdown[prof];
              return (
                <div key={`print-summary-${prof}`} className="flex justify-between border-b border-slate-200 py-0.5">
                  <span>• <strong>{prof}</strong>: {bd.pieceCount} peças</span>
                  <span>{bd.totalMeters.toFixed(2)} m (≈ {bd.bars6m} barras de 6m)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* 1. MODULE HEADER & WORKSHOP ACTIONS (SCREEN ONLY) */}
      <div className="print:hidden bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-amber-400 rounded-xl shadow-sm">
              <Scissors className="w-5 h-5 stroke-[2.5]" />
            </span>
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-600 uppercase tracking-widest block">
                Módulo de Fabricação
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight">
                Lista de Corte Inteligente
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xl">
            Tabela unificada de corte para oficina. Reúne automaticamente o quadro base e todas as peças internas agrupadas por tamanho.
          </p>
        </div>

        {/* Quick Workshop Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            id="btn-copiar-lista-corte"
            type="button"
            onClick={handleCopyCutList}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition duration-150 inline-flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-sm"
            title="Copiar lista para colar no WhatsApp ou bloco de notas"
          >
            {copiedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                <span className="text-emerald-700 font-bold">Copiado para Oficina!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Copiar Lista</span>
              </>
            )}
          </button>

          <button
            id="btn-imprimir-ordem-corte"
            type="button"
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition duration-150 inline-flex items-center gap-1.5 shadow-sm cursor-pointer border border-slate-700"
            title="Imprimir Ordem de Corte pelo Navegador"
          >
            <Printer className="w-4 h-4 stroke-[2]" />
            <span>Imprimir Ordem de Corte</span>
          </button>

          <button
            id="btn-gerar-pdf-corte"
            type="button"
            onClick={handleGeneratePDF}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition duration-150 inline-flex items-center gap-1.5 shadow-sm cursor-pointer border border-amber-600"
            title="Baixar arquivo PDF da Ordem de Corte"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>📄 Gerar PDF</span>
          </button>
        </div>
      </div>

      {/* PRINT NOTICE / PREVIEW IFRAME AMBIENTE ALERT */}
      {printBlockedNotice && (
        <div className="print:hidden bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold text-amber-950">
              💡 Dica de Impressão e PDF
            </p>
            <p>
              Se a janela de impressão do seu navegador não abrir automaticamente devido às restrições do ambiente de Preview, utilize o botão <strong className="text-amber-950">"📄 Gerar PDF"</strong> acima para baixar diretamente a Ordem de Corte em formato PDF em alta qualidade!
            </p>
          </div>
          <button 
            type="button" 
            onClick={() => setPrintBlockedNotice(false)} 
            className="text-amber-700 hover:text-amber-950 font-bold text-xs ml-auto shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. SUMMARY CARDS (SCREEN ONLY) */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Peças */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl">
            <Scissors className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider block">
              Total de Peças
            </span>
            <strong className="text-2xl font-bold font-mono text-slate-900">
              {totals.totalPieces} <span className="text-xs text-slate-500 font-sans font-normal">peças</span>
            </strong>
          </div>
        </div>

        {/* Metros Totais */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl">
            <Ruler className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider block">
              Metros Totais
            </span>
            <strong className="text-2xl font-bold font-mono text-slate-900">
              {totals.totalMeters.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-500 font-sans font-normal">m</span>
            </strong>
          </div>
        </div>

        {/* Barras Comerciais 6m */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl">
            <Box className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider block">
              Barras de 6 Metros
            </span>
            <strong className="text-2xl font-bold font-mono text-indigo-950">
              ≈ {totals.totalBars6m} <span className="text-xs text-slate-500 font-sans font-normal">barras</span>
            </strong>
          </div>
        </div>

        {/* Perfis Utilizados */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-sky-50 border border-sky-200 text-sky-700 rounded-xl">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider block">
              Perfis de Metalon
            </span>
            <strong className="text-2xl font-bold font-mono text-slate-900">
              {presentProfiles.length} <span className="text-xs text-slate-500 font-sans font-normal">tipo(s)</span>
            </strong>
          </div>
        </div>

      </div>

      {/* 3. FILTERS, SEARCH & SORTING TOOLBAR (SCREEN ONLY) */}
      <div className="print:hidden bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Pesquisa por Texto */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por perfil, grupo ou comprimento (ex: 1960 mm)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filters Group */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Filter by Profile */}
            <div className="flex items-center space-x-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Perfil:</label>
              <select
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="todos">Todos os Perfis ({presentProfiles.length})</option>
                {presentProfiles.map(prof => (
                  <option key={prof} value={prof}>{prof}</option>
                ))}
              </select>
            </div>

            {/* Filter by Length */}
            <div className="flex items-center space-x-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Tamanho:</label>
              <select
                value={lengthFilter}
                onChange={(e) => setLengthFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="todos">Todos os Tamanhos</option>
                <option value="longo">Mais longos (&ge; 2000 mm)</option>
                <option value="medio">Médios (1000 a 2000 mm)</option>
                <option value="curto">Curtos (&lt; 1000 mm)</option>
              </select>
            </div>

            {/* Filter by Quantity */}
            <div className="flex items-center space-x-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Qtd:</label>
              <select
                value={quantityFilter}
                onChange={(e) => setQuantityFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="todos">Todas as Qtds</option>
                <option value="lote">Em Lote (&ge; 5 peças)</option>
                <option value="pouco">Pequena Qtd (&lt; 5 peças)</option>
              </select>
            </div>

            {/* Ordenação */}
            <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-900 text-white border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="ordem_fabricacao">Ordem de Fabricação</option>
                <option value="maior_comprimento">Maior Comprimento (▼)</option>
                <option value="menor_comprimento">Menor Comprimento (▲)</option>
                <option value="perfil">Nome do Perfil (A-Z)</option>
              </select>
            </div>

          </div>

        </div>

        {/* Filter Quick Pills */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs font-mono pt-2 border-t border-slate-100">
          <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Filtro Ativo:</span>
          <button
            type="button"
            onClick={() => { setSelectedProfile('todos'); setLengthFilter('todos'); setQuantityFilter('todos'); setSearchQuery(''); }}
            className={`px-2.5 py-1 rounded-lg transition font-semibold ${
              selectedProfile === 'todos' && lengthFilter === 'todos' && quantityFilter === 'todos' && !searchQuery
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({groupedCutItems.length} grupos de corte)
          </button>
          {presentProfiles.map(prof => (
            <button
              key={prof}
              type="button"
              onClick={() => setSelectedProfile(prof)}
              className={`px-2.5 py-1 rounded-lg transition font-semibold ${
                selectedProfile === prof
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {prof}
            </button>
          ))}
        </div>
      </div>

      {/* 4. MAIN CUT LIST TABLES BY PROFILE (SCREEN ONLY) */}
      {filteredAndSortedItems.length === 0 ? (
        <div className="print:hidden bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-full mb-3">
            <AlertCircle className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h4 className="text-base font-bold text-slate-800">Nenhuma peça encontrada na Lista de Corte</h4>
          <p className="text-slate-500 text-xs max-w-sm mt-1 mb-4">
            Nenhum componente corresponde aos filtros ou à pesquisa digitada.
          </p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setSelectedProfile('todos'); setLengthFilter('todos'); setQuantityFilter('todos'); }}
            className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition"
          >
            Limpar Filtros de Busca
          </button>
        </div>
      ) : (
        /* Render items grouped by profile for maximum workshop clarity */
        <div className="print:hidden space-y-6">
          {presentProfiles
            .filter(prof => selectedProfile === 'todos' || selectedProfile === prof)
            .map((prof) => {
              const profItems = filteredAndSortedItems.filter(item => item.perfil === prof);
              if (profItems.length === 0) return null;

              const profSummary = totals.profileBreakdown[prof] || { totalMeters: 0, pieceCount: 0, bars6m: 0 };

              return (
                <div key={prof} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  
                  {/* Profile Header Banner */}
                  <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 bg-amber-500 text-slate-950 rounded-lg font-bold">
                        <Box className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="font-bold font-mono text-sm uppercase tracking-wider text-amber-400">
                          {prof}
                        </h4>
                        <span className="text-[11px] text-slate-300 font-mono">
                          {profItems.length} tamanho(s) diferente(s)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs font-mono">
                      <div className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                        <span className="text-slate-400 font-bold uppercase mr-1.5">Materia:</span>
                        <strong className="text-white">{profSummary.totalMeters.toFixed(2)} m</strong>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg text-amber-300 font-bold">
                        ≈ {profSummary.bars6m} barras de 6m
                      </div>
                    </div>
                  </div>

                  {/* Cut Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100/80 text-slate-500 font-mono text-[10px] uppercase tracking-wider border-b border-slate-200">
                          <th className="py-3 px-4 w-12 text-center">Status</th>
                          <th className="py-3 px-4 w-16">Item</th>
                          <th className="py-3 px-4">Quantidade</th>
                          <th className="py-3 px-4">Comprimento de Corte</th>
                          <th className="py-3 px-4">Grupo / Origem</th>
                          <th className="py-3 px-4 text-right">Total Linear</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-xs">
                        {profItems.map((item, idx) => {
                          const isDone = !!completedItems[item.key];
                          const lineTotalMeters = (item.quantidadeTotal * item.comprimento) / 1000;

                          return (
                            <tr
                              key={item.key}
                              onClick={() => toggleItemCompletion(item.key)}
                              className={`transition duration-150 cursor-pointer ${
                                isDone 
                                  ? 'bg-emerald-50/60 text-slate-400 line-through' 
                                  : 'hover:bg-amber-50/40 text-slate-800'
                              }`}
                            >
                              {/* Status checkmark for workshop */}
                              <td className="py-3.5 px-4 text-center">
                                {isDone ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 inline" />
                                ) : (
                                  <Circle className="w-5 h-5 text-slate-300 inline hover:text-amber-500" />
                                )}
                              </td>

                              {/* Item Order Index */}
                              <td className="py-3.5 px-4 font-bold text-slate-400">
                                #{idx + 1}
                              </td>

                              {/* Quantidade */}
                              <td className="py-3.5 px-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-xs ${
                                  isDone 
                                    ? 'bg-slate-200 text-slate-500' 
                                    : 'bg-amber-100 text-amber-950 border border-amber-200 shadow-2xs'
                                }`}>
                                  {item.quantidadeTotal} peças
                                </span>
                              </td>

                              {/* Comprimento */}
                              <td className="py-3.5 px-4">
                                <strong className={`text-sm ${isDone ? 'text-slate-400 font-normal' : 'text-slate-950 font-bold'}`}>
                                  {item.comprimento} mm
                                </strong>
                              </td>

                              {/* Grupo / Indicadores */}
                              <td className="py-3.5 px-4">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {item.grupos.map((g, gIdx) => (
                                    <span
                                      key={gIdx}
                                      className={`text-[10px] px-2 py-0.5 rounded-md border ${getGroupBadgeStyle(g.nome)}`}
                                    >
                                      {g.nome} {g.quantidade > 1 ? `(${g.quantidade}x)` : ''}
                                    </span>
                                  ))}
                                </div>
                              </td>

                              {/* Total Linear */}
                              <td className="py-3.5 px-4 text-right font-bold text-slate-600">
                                {lineTotalMeters.toFixed(2)} m
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </div>
              );
            })}
        </div>
      )}

      {/* 5. RESUMO TÉCNICO FINAL DA OFICINA (SCREEN ONLY) */}
      <div className="print:hidden bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-4 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              📋 Resumo Geral de Fabricação
            </h4>
          </div>
          <span className="text-[10px] bg-slate-800 px-2.5 py-1 rounded text-slate-400 border border-slate-700">
            Oficina de Serralheria
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">Projeto</span>
            <strong className="text-slate-100 text-sm block truncate" title={project.name}>
              {project.name}
            </strong>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">Estrutura Externa</span>
            <strong className="text-slate-100 text-sm block">
              {project.frame ? `${project.frame.displayWidth}x${project.frame.displayHeight} ${project.frame.displayUnit}` : 'Não configurada'}
            </strong>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">Material Necessário</span>
            <strong className="text-emerald-400 text-sm block font-bold">
              {totals.totalMeters.toFixed(2)} m (≈ {totals.totalBars6m} barras de 6m)
            </strong>
          </div>

        </div>

        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between gap-2">
          <span>Serralheria Projetos — Ordem gerada com precisão milimétrica.</span>
          <span className="text-slate-500">Cortes sem sobras não otimizados (Preparo para ET-005)</span>
        </div>
      </div>

    </div>
  );
};
