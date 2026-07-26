/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Sparkles,
  CheckCircle2,
  Trash2,
  Eye,
  Sliders,
  Maximize2,
  Box,
  CornerDownRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  StructuralPanel,
  PanelFillConfig,
  PanelFillPattern,
  PanelFillPreviewBar,
  PanelGuideBar,
  FreeDrawingLine,
} from '../types';
import {
  generatePanelFillPreview,
  removePanelFill,
  getLastUsedFillConfig,
} from '../engines/panelFillEngine';

interface PanelFillAssistantModalProps {
  panel: StructuralPanel;
  guideBar?: PanelGuideBar;
  existingLines?: FreeDrawingLine[];
  onPreview: (previewBars: PanelFillPreviewBar[], config: PanelFillConfig) => void;
  onApply: (config: PanelFillConfig, previewBars: PanelFillPreviewBar[]) => void;
  onRemoveFill: (panelId: string) => void;
  onClose: () => void;
}

const PROFILE_OPTIONS = [
  'Metalon 20x20x1.50',
  'Metalon 30x20x1.50',
  'Metalon 40x20x1.50',
  'Metalon 50x30x2.00',
  'Tubo 1" x 1.50mm',
  'Cantoneira 1" x 1/8"',
  'Barra Chata 1" x 3/16"',
];

const SPACING_PRESETS = [50, 80, 100, 120, 150, 200];

export const PanelFillAssistantModal: React.FC<PanelFillAssistantModalProps> = ({
  panel,
  guideBar,
  existingLines,
  onPreview,
  onApply,
  onRemoveFill,
  onClose,
}) => {
  const existingConfig = panel.fillConfig;
  const lastUsed = getLastUsedFillConfig();

  const [pattern, setPattern] = useState<PanelFillPattern>(
    existingConfig?.pattern || lastUsed?.pattern || (guideBar ? 'diagonal' : 'vertical')
  );
  const [profileName, setProfileName] = useState<string>(
    existingConfig?.profileName || lastUsed?.profileName || 'Metalon 20x20x1.50'
  );
  const [spacingMm, setSpacingMm] = useState<number>(
    existingConfig?.spacingMm || lastUsed?.spacingMm || 100
  );
  const [isInverted, setIsInverted] = useState<boolean>(
    existingConfig?.isInverted ?? lastUsed?.isInverted ?? false
  );
  const [alignWithNeighbor, setAlignWithNeighbor] = useState<boolean>(
    existingConfig?.alignWithNeighbor ?? lastUsed?.alignWithNeighbor ?? false
  );

  const [currentPreviews, setCurrentPreviews] = useState<PanelFillPreviewBar[]>([]);
  const [isCalculated, setIsCalculated] = useState<boolean>(false);

  const angleDeg = guideBar ? guideBar.angleDeg : pattern === 'horizontal' ? 0 : pattern === 'vertical' ? 90 : 45;

  const buildConfig = (): PanelFillConfig => ({
    panelId: panel.id,
    pattern,
    profileName,
    spacingMm: Math.max(spacingMm, 10),
    angleDeg,
    isInverted,
    alignWithNeighbor,
    guideBar,
  });

  const handleCalculatePreview = () => {
    const config = buildConfig();
    const bars = generatePanelFillPreview(panel, config, existingLines);
    setCurrentPreviews(bars);
    setIsCalculated(true);
    onPreview(bars, config);
  };

  // Auto calculate on initial load or parameter change for instant zero-click preview
  useEffect(() => {
    handleCalculatePreview();
  }, [pattern, profileName, spacingMm, isInverted, alignWithNeighbor]);

  const handleApply = () => {
    const config = buildConfig();
    const bars = currentPreviews.length > 0 ? currentPreviews : generatePanelFillPreview(panel, config, existingLines);
    onApply(config, bars);
  };

  const totalLengthMeters = currentPreviews.reduce((acc, b) => acc + b.lengthMm, 0) / 1000;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-amber-500/50 overflow-hidden flex flex-col max-h-[92vh]">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 px-5 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-950/20 rounded-xl text-slate-950">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold font-display text-slate-950 leading-tight">
                  Assistente de Preenchimento
                </h2>
                <span className="bg-slate-950 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  ET-021.4
                </span>
              </div>
              <p className="text-[11px] text-slate-950 font-semibold opacity-90">
                {panel.name} ({panel.widthMm} x {panel.heightMm} mm | {panel.areaM2.toFixed(2)} m²)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-950 hover:bg-amber-400/80 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-200 text-xs">
          {/* GUIDE BAR STATUS BADGE */}
          {guideBar ? (
            <div className="bg-emerald-950/40 border border-emerald-500/50 p-3 rounded-xl flex items-center justify-between text-emerald-300 font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-xs block">Barra Guia Detectada</span>
                  <span className="text-[10px] text-emerald-400/80">
                    Comprimento: {guideBar.lengthMm}mm | Ângulo: {guideBar.angleDeg}° ({guideBar.directionType})
                  </span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 px-2 py-1 rounded border border-emerald-500/30 font-bold">
                Direção Fixada
              </span>
            </div>
          ) : (
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2 text-slate-400">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Nenhuma barra guia desenhada. Selecione o padrão desejado abaixo.</span>
            </div>
          )}

          {/* 1. TIPO DE PREENCHIMENTO */}
          <div className="space-y-2">
            <label className="text-amber-400 font-extrabold uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              1. Tipo de Preenchimento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'diagonal', label: 'Diagonal (/)', desc: 'Ripado 45°' },
                { id: 'vertical', label: 'Vertical (|)', desc: 'Grade Padrão' },
                { id: 'horizontal', label: 'Horizontal (—)', desc: 'Veneziana' },
                { id: 'cross', label: 'Cruzado (X)', desc: 'Grelha Triangulada' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPattern(item.id as PanelFillPattern)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    pattern === item.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold">{item.label}</span>
                  <span className="text-[10px] text-slate-400 mt-1">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. PERFIL METÁLICO */}
          <div className="space-y-2">
            <label className="text-amber-400 font-extrabold uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5" />
              2. Perfil das Barras de Preenchimento
            </label>
            <select
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:border-amber-400 outline-none"
            >
              {PROFILE_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* 3. ESPAÇO-LUZ (ESPAÇAMENTO) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-amber-400 font-extrabold uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5" />
                3. Espaço-Luz Entre Barras (mm)
              </label>
              <span className="font-mono text-amber-300 font-bold text-xs">{spacingMm} mm</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={10}
                max={1000}
                step={5}
                value={spacingMm}
                onChange={(e) => setSpacingMm(Number(e.target.value))}
                className="w-28 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-amber-400 outline-none"
              />
              <div className="flex flex-wrap gap-1.5 flex-1">
                {SPACING_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSpacingMm(preset)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono transition cursor-pointer ${
                      spacingMm === preset
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {preset}mm
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. CONFIGURAÇÕES AVANÇADAS (INVERTER & ALINHAR VIZINHO) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsInverted(!isInverted)}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition cursor-pointer text-left ${
                isInverted
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <RefreshCw className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-bold text-xs block">Inverter Sentido</span>
                <span className="text-[10px] text-slate-400">Espelha a inclinação das barras</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAlignWithNeighbor(!alignWithNeighbor)}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition cursor-pointer text-left ${
                alignWithNeighbor
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <CornerDownRight className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-bold text-xs block">Alinhar com Vizinho</span>
                <span className="text-[10px] text-slate-400">Sincroniza fase entre painéis</span>
              </div>
            </button>
          </div>

          {/* RESUMO DA PRÉ-VISUALIZAÇÃO */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">Pré-Visualização Atual:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {currentPreviews.length} barras pré-calculadas
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-300 border-t border-slate-800/80 pt-2">
              <div>
                <span className="text-slate-500 block text-[10px]">TOTAL DE MATERIAL</span>
                <span className="font-bold text-amber-300">{totalLengthMeters.toFixed(2)} m</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">PERMITIDO FORA DO PAINEL</span>
                <span className="font-bold text-emerald-400">0.00 mm (Corte Rente)</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          {existingConfig && (
            <button
              type="button"
              onClick={() => {
                onRemoveFill(panel.id);
                onClose();
              }}
              className="px-3.5 py-2.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Remover Preenchimento</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleCalculatePreview}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Visualizar</span>
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Aplicar ao Projeto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
