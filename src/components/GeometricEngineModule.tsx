/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Ruler, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  HelpCircle, 
  Sparkles, 
  Layers, 
  Compass, 
  ArrowRightLeft, 
  Triangle, 
  Maximize2,
  Info,
  ChevronRight
} from 'lucide-react';
import { LengthUnit } from '../types';
import { 
  calculateRectangleDiagonal, 
  checkSquareness, 
  calculateMissingSide, 
  convertAllUnits,
  formatLength
} from '../utils/geometricEngine';

export const GeometricEngineModule: React.FC = () => {
  // Global Unit Selector
  const [globalUnit, setGlobalUnit] = useState<LengthUnit>('mm');

  // Tool 1: Diagonal do Retângulo State
  const [diagWidth, setDiagWidth] = useState<number>(1200);
  const [diagHeight, setDiagHeight] = useState<number>(2000);

  // Tool 2: Conferência de Esquadro State
  const [sqWidth, setSqWidth] = useState<number>(1500);
  const [sqHeight, setSqHeight] = useState<number>(2200);
  const [sqDiag1, setSqDiag1] = useState<number>(2662);
  const [sqDiag2, setSqDiag2] = useState<number>(2662);

  // Tool 3: Medida Faltante State
  const [missingMode, setMissingMode] = useState<'altura' | 'largura'>('altura');
  const [missingKnown, setMissingKnown] = useState<number>(1200);
  const [missingDiag, setMissingDiag] = useState<number>(2332);

  // Tool 4: Conversor State
  const [converterVal, setConverterVal] = useState<number>(1500);
  const [converterSourceUnit, setConverterSourceUnit] = useState<LengthUnit>('mm');

  // Copy Toast State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Tool 1 Calculations
  const diagResult = calculateRectangleDiagonal(diagWidth, diagHeight, globalUnit);

  // Tool 2 Calculations
  const squareResult = checkSquareness(sqWidth, sqHeight, sqDiag1, sqDiag2, globalUnit);

  // Tool 3 Calculations
  const missingResult = calculateMissingSide(missingMode, missingKnown, missingDiag, globalUnit);

  // Tool 4 Calculations
  const convertedValues = convertAllUnits(converterVal, converterSourceUnit);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>ET-008A • Motor Geométrico (Base)</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white flex items-center gap-3">
            <span>📐 Motor Geométrico Inteligente</span>
          </h2>
          <p className="text-slate-300 text-sm mt-2 max-w-2xl">
            Cálculos geométricos rápidos de oficina: Diagonais, conferência de esquadro perfeito a 90°, cálculo de lados faltantes por Pitágoras e conversão instantânea de unidades.
          </p>
        </div>

        {/* Global Unit Switcher */}
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 p-3 rounded-2xl shrink-0 flex flex-col gap-1.5 w-full sm:w-auto">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Unidade Padrão dos Cálculos:
          </span>
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl">
            {(['mm', 'cm', 'm'] as LengthUnit[]).map((u) => (
              <button
                key={u}
                id={`btn-unit-global-${u}`}
                type="button"
                onClick={() => setGlobalUnit(u)}
                className={`flex-1 px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                  globalUnit === u
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of 4 Core Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* FERRAMENTA 1: DIAGONAL DO RETÂNGULO */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-sans">
                    1. Diagonal do Retângulo
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">Calcular diagonal</span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                Teorema de Pitágoras
              </span>
            </div>

            {/* Visual SVG Diagram */}
            <div className="my-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center">
              <svg width="220" height="120" viewBox="0 0 220 120" className="max-w-full">
                {/* Rectangle frame */}
                <rect x="20" y="15" width="180" height="90" fill="none" stroke="#334155" strokeWidth="2.5" rx="2" />
                {/* Diagonal line */}
                <line x1="20" y1="105" x2="200" y2="15" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="4 3" />
                {/* Right angle symbol */}
                <path d="M 20,95 L 30,95 L 30,105" fill="none" stroke="#f59e0b" strokeWidth="2" />
                {/* Labels */}
                <text x="110" y="116" textAnchor="middle" className="text-[11px] font-mono font-bold fill-slate-700">
                  Largura (L): {diagWidth} {globalUnit}
                </text>
                <text x="10" y="65" textAnchor="middle" transform="rotate(-90 10 65)" className="text-[11px] font-mono font-bold fill-slate-700">
                  Altura (H): {diagHeight} {globalUnit}
                </text>
                <text x="115" y="52" textAnchor="middle" className="text-[11px] font-mono font-bold fill-indigo-600">
                  Diagonal: {diagResult.formattedDiagonal}
                </text>
              </svg>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-bold font-mono text-slate-700 mb-1">
                  Largura ({globalUnit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={diagWidth || ''}
                  onChange={(e) => setDiagWidth(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-slate-700 mb-1">
                  Altura ({globalUnit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={diagHeight || ''}
                  onChange={(e) => setDiagHeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Result Box */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 font-mono">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-indigo-900 font-bold uppercase tracking-wider">
                Diagonal Calculada:
              </span>
              <button
                type="button"
                id="btn-copy-tool-1"
                onClick={() => handleCopyText(`Diagonal: ${diagResult.formattedDiagonal}\n${diagResult.theoreticalMessage}`, 'tool1')}
                className="bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-300 font-bold px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'tool1' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>📋 Copiar Resultado</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-2xl font-bold text-indigo-950 mb-2">
              {diagResult.formattedDiagonal}
            </div>

            <p className="text-xs text-indigo-800 font-sans leading-relaxed">
              {diagResult.theoreticalMessage}
            </p>
          </div>
        </div>

        {/* FERRAMENTA 2: CONFERÊNCIA DE ESQUADRO */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Ruler className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-sans">
                    2. Conferência de Esquadro
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">Confira o esquadro</span>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                squareResult.statusColor === 'green'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : squareResult.statusColor === 'red'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {squareResult.statusLabel}
              </span>
            </div>

            {/* Visual Diagram */}
            <div className="my-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center">
              <svg width="220" height="120" viewBox="0 0 220 120" className="max-w-full">
                <rect x="20" y="15" width="180" height="90" fill="none" stroke="#334155" strokeWidth="2.5" rx="2" />
                {/* Diag 1 */}
                <line x1="20" y1="105" x2="200" y2="15" stroke="#3b82f6" strokeWidth="2" />
                {/* Diag 2 */}
                <line x1="20" y1="15" x2="200" y2="105" stroke="#f59e0b" strokeWidth="2" />
                {/* Labels */}
                <text x="110" y="55" textAnchor="middle" className="text-[10px] font-mono font-bold fill-blue-600">
                  D1: {sqDiag1} {globalUnit}
                </text>
                <text x="110" y="72" textAnchor="middle" className="text-[10px] font-mono font-bold fill-amber-600">
                  D2: {sqDiag2} {globalUnit}
                </text>
              </svg>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-bold font-mono text-slate-700 mb-1">
                  Largura ({globalUnit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={sqWidth || ''}
                  onChange={(e) => setSqWidth(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-slate-700 mb-1">
                  Altura ({globalUnit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={sqHeight || ''}
                  onChange={(e) => setSqHeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-blue-700 mb-1">
                  Diagonal Medida D1 ({globalUnit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={sqDiag1 || ''}
                  onChange={(e) => setSqDiag1(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-blue-50/50 border border-blue-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-amber-700 mb-1">
                  Diagonal Medida D2 ({globalUnit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={sqDiag2 || ''}
                  onChange={(e) => setSqDiag2(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Result Box */}
          <div className={`border rounded-xl p-4 font-mono ${
            squareResult.statusColor === 'green'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : squareResult.statusColor === 'red'
              ? 'bg-rose-50/80 border-rose-200 text-rose-950'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                Diferença de Esquadro:
              </span>
              <button
                type="button"
                id="btn-copy-tool-2"
                onClick={() => handleCopyText(`Status: ${squareResult.statusLabel}\nDiferença: ${squareResult.formattedDiff}\n${squareResult.adviceMessage}`, 'tool2')}
                className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'tool2' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>📋 Copiar Resultado</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-2xl font-bold mb-1">
              {squareResult.formattedDiff}
            </div>

            <p className="text-xs font-sans leading-relaxed">
              {squareResult.adviceMessage}
            </p>
          </div>
        </div>

        {/* FERRAMENTA 3: MEDIDA FALTANTE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Triangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-sans">
                    3. Medida Faltante
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {missingMode === 'altura' ? 'Descobrir altura' : 'Descobrir largura'}
                  </span>
                </div>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  id="btn-mode-missing-altura"
                  onClick={() => setMissingMode('altura')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                    missingMode === 'altura'
                      ? 'bg-slate-900 text-emerald-400 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Descobrir Altura
                </button>
                <button
                  type="button"
                  id="btn-mode-missing-largura"
                  onClick={() => setMissingMode('largura')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                    missingMode === 'largura'
                      ? 'bg-slate-900 text-emerald-400 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Descobrir Largura
                </button>
              </div>
            </div>

            {/* Visual Diagram */}
            <div className="my-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center">
              <svg width="220" height="120" viewBox="0 0 220 120" className="max-w-full">
                <path d="M 30,105 L 190,105 L 190,15 Z" fill="rgba(16, 185, 129, 0.08)" stroke="#10b981" strokeWidth="2.5" />
                <path d="M 180,105 L 180,95 L 190,95" fill="none" stroke="#f59e0b" strokeWidth="2" />
                <text x="110" y="118" textAnchor="middle" className="text-[10px] font-mono font-bold fill-slate-700">
                  {missingMode === 'altura' ? `Largura Conhecida: ${missingKnown} ${globalUnit}` : `Largura Calculada (?): ${missingResult.formattedResult}`}
                </text>
                <text x="200" y="60" textAnchor="start" className="text-[10px] font-mono font-bold fill-slate-700">
                  {missingMode === 'altura' ? `Altura (?): ${missingResult.formattedResult}` : `Altura Conhecida: ${missingKnown} ${globalUnit}`}
                </text>
                <text x="100" y="55" textAnchor="middle" transform="rotate(-28 100 55)" className="text-[10px] font-mono font-bold fill-emerald-700">
                  Diagonal: {missingDiag} {globalUnit}
                </text>
              </svg>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-bold font-mono text-slate-700 mb-1">
                  {missingMode === 'altura' ? `Largura Conhecida (${globalUnit})` : `Altura Conhecida (${globalUnit})`}
                </label>
                <input
                  type="number"
                  step="any"
                  value={missingKnown || ''}
                  onChange={(e) => setMissingKnown(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-slate-700 mb-1">
                  Diagonal Medida ({globalUnit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={missingDiag || ''}
                  onChange={(e) => setMissingDiag(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Result Box */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 font-mono">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-emerald-900 font-bold uppercase tracking-wider">
                {missingMode === 'altura' ? 'Altura Calculada:' : 'Largura Calculada:'}
              </span>
              <button
                type="button"
                id="btn-copy-tool-3"
                onClick={() => handleCopyText(`${missingMode === 'altura' ? 'Altura' : 'Largura'} Calculada: ${missingResult.formattedResult}`, 'tool3')}
                className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'tool3' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>📋 Copiar Resultado</span>
                  </>
                )}
              </button>
            </div>

            {missingResult.isValid ? (
              <div className="text-2xl font-bold text-emerald-950">
                {missingResult.formattedResult}
              </div>
            ) : (
              <div className="text-xs font-sans font-bold text-rose-700">
                {missingResult.errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* FERRAMENTA 4: CONVERSOR RÁPIDO */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-sans">
                    4. Conversor de Unidades
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">Conversão instantânea</span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full">
                mm ⇄ cm ⇄ m
              </span>
            </div>

            {/* Input Converter */}
            <div className="my-4">
              <label className="block text-xs font-bold font-mono text-slate-700 mb-1">
                Digite a Medida:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  value={converterVal || ''}
                  onChange={(e) => setConverterVal(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
                <select
                  value={converterSourceUnit}
                  onChange={(e) => setConverterSourceUnit(e.target.value as LengthUnit)}
                  className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="mm">milímetros (mm)</option>
                  <option value="cm">centímetros (cm)</option>
                  <option value="m">metros (m)</option>
                </select>
              </div>
            </div>

            {/* Converted Badges */}
            <div className="grid grid-cols-3 gap-2 my-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center font-mono">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Milímetros</span>
                <span className="text-sm font-bold text-slate-900">{convertedValues.formattedMm}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center font-mono">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Centímetros</span>
                <span className="text-sm font-bold text-slate-900">{convertedValues.formattedCm}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center font-mono">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Metros</span>
                <span className="text-sm font-bold text-slate-900">{convertedValues.formattedM}</span>
              </div>
            </div>
          </div>

          {/* Result Copy */}
          <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-4 font-mono">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-purple-900 font-bold uppercase tracking-wider block">
                  Resumo da Conversão:
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {convertedValues.formattedMm} = {convertedValues.formattedCm} = {convertedValues.formattedM}
                </span>
              </div>

              <button
                type="button"
                id="btn-copy-tool-4"
                onClick={() => handleCopyText(`${convertedValues.formattedMm} = ${convertedValues.formattedCm} = ${convertedValues.formattedM}`, 'tool4')}
                className="bg-white hover:bg-purple-100 text-purple-800 border border-purple-300 font-bold px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedId === 'tool4' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>📋 Copiar Resultado</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* FUTURE EXTENSIONS ARCHITECTURE PREPARATION SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-white mt-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base font-mono text-white">
                🔮 Preparação para Futuras Expansões Geométricas
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Arquitetura do Motor Geométrico preparada para novos módulos avançados de serralheria nas próximas atualizações.
              </p>
            </div>
          </div>
          <span className="bg-slate-800 text-amber-400 border border-slate-700 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase">
            Em Desenvolvimento
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-amber-400 font-bold block mb-1">📐 1. Ângulos & Meia Esquadria</span>
              <p className="text-slate-300 font-sans text-xs">
                Cálculo de ângulos de corte para quadros ortogonais, poligonais (45°, 22.5°, 30°) e bissetriz de junta.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-700/50 block">
              Módulo: angulos_esquadria
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-amber-400 font-bold block mb-1">🏠 2. Telhados & Inclinações</span>
              <p className="text-slate-300 font-sans text-xs">
                Cálculo de queda/caída em porcentagem (%), cumeeiras, tesouras de telhado e trapézios laterais.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-700/50 block">
              Módulo: triangulos_telhados
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-amber-400 font-bold block mb-1">🪜 3. Escadas & Estruturas</span>
              <p className="text-slate-300 font-sans text-xs">
                Dimensionamento de degraus de serralheria (Fórmula de Blondel: 2E + P = 63cm) e vigas rampa.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-700/50 block">
              Módulo: escadas_estruturas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
