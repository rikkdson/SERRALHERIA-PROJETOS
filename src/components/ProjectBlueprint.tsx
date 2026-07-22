/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FrameConfig, MeasurementUnit, PieceConfig, PIECE_TYPE_LABELS } from '../types';
import { Ruler, Layers, Tags } from 'lucide-react';

export const PIECE_COLORS: Record<string, { stroke: string; fill: string; bg: string; text: string; border: string }> = {
  quadro_interno: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.12)', bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-800/50' },
  divisao_vertical: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.12)', bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-800/50' },
  divisao_horizontal: { stroke: '#f97316', fill: 'rgba(249, 115, 22, 0.12)', bg: 'bg-orange-950/40', text: 'text-orange-400', border: 'border-orange-800/50' },
  travessa: { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.12)', bg: 'bg-cyan-950/40', text: 'text-cyan-400', border: 'border-cyan-800/50' },
  coluna: { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.12)', bg: 'bg-blue-950/40', text: 'text-blue-400', border: 'border-blue-800/50' },
  diagonal: { stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.12)', bg: 'bg-rose-950/40', text: 'text-rose-400', border: 'border-rose-800/50' },
  reforco: { stroke: '#a855f7', fill: 'rgba(168, 85, 247, 0.12)', bg: 'bg-purple-950/40', text: 'text-purple-400', border: 'border-purple-800/50' },
  folha_porta: { stroke: '#6366f1', fill: 'rgba(99, 102, 241, 0.12)', bg: 'bg-indigo-950/40', text: 'text-indigo-400', border: 'border-indigo-800/50' },
  folha_portao: { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.12)', bg: 'bg-violet-950/40', text: 'text-violet-400', border: 'border-violet-800/50' },
  folha_janela: { stroke: '#14b8a6', fill: 'rgba(20, 184, 166, 0.12)', bg: 'bg-teal-950/40', text: 'text-teal-400', border: 'border-teal-800/50' },
  perfil_personalizado: { stroke: '#d946ef', fill: 'rgba(217, 70, 239, 0.12)', bg: 'bg-fuchsia-950/40', text: 'text-fuchsia-400', border: 'border-fuchsia-800/50' },
};

interface ProjectBlueprintProps {
  frame: FrameConfig;
  pieces?: PieceConfig[];
  highlightedPieceId?: string | null;
}

export const ProjectBlueprint: React.FC<ProjectBlueprintProps> = ({ 
  frame, 
  pieces = [], 
  highlightedPieceId = null 
}) => {
  const { width, height, displayUnit, displayWidth, displayHeight, profile } = frame;

  // We want to draw a proportional rectangle within a 500x400 SVG box
  const svgWidth = 500;
  const svgHeight = 400;
  
  const paddingX = 70; // extra padding for dimension lines on left/right
  const paddingY = 70; // extra padding for dimension lines on top/bottom

  const maxCanvasWidth = svgWidth - paddingX * 2;
  const maxCanvasHeight = svgHeight - paddingY * 2;

  // Determine scale factor to fit the frame inside our max canvas bounds
  const aspectRatio = width / height;
  let rectWidth = maxCanvasWidth;
  let rectHeight = maxCanvasWidth / aspectRatio;

  if (rectHeight > maxCanvasHeight) {
    rectHeight = maxCanvasHeight;
    rectWidth = maxCanvasHeight * aspectRatio;
  }

  // Center the rect in the canvas
  const x = paddingX + (maxCanvasWidth - rectWidth) / 2;
  const y = paddingY + (maxCanvasHeight - rectHeight) / 2;

  // Let's draw the profile double-line effect if it's thick enough,
  // or a nice thick stroke representing the metal profile.
  const strokeWidth = Math.max(4, Math.min(16, rectWidth * 0.05));
  
  // Calculate scaling factor from actual millimeters to SVG coordinate system
  const scale = rectWidth / width;

  // Human-readable formatted dimensions
  const formattedWidth = `${displayWidth} ${displayUnit}`;
  const formattedHeight = `${displayHeight} ${displayUnit}`;
  
  // Calculate corners
  const left = x;
  const right = x + rectWidth;
  const top = y;
  const bottom = y + rectHeight;

  // Unique types of pieces currently in this project to show in the legend
  const presentPieceTypes = Array.from(new Set(pieces.map(p => p.type)));

  return (
    <div className="w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-xl flex flex-col">
      {/* Blueprint Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Ruler className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold">Esquema Técnico (2D)</span>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            Quadro Externo
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            {profile}
          </span>
        </div>
      </div>

      {/* SVG Canvas with Blueprint grid background */}
      <div className="relative bg-blueprint-dark flex-1 flex items-center justify-center p-6 min-h-[340px]">
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className="w-full max-w-[480px] h-auto drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] select-none"
        >
          {/* Defs for arrow heads */}
          <defs>
            <marker
              id="arrow-start"
              viewBox="0 0 10 10"
              refX="0"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 10 0 L 0 5 L 10 10 z" fill="#38bdf8" />
            </marker>
            <marker
              id="arrow-end"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* 1. EXTENSION LINES (Thin dashed lines from corners to dimension lines) */}
          {/* Top Width Extension Lines */}
          <line x1={left} y1={top} x2={left} y2={top - 35} stroke="#475569" strokeWidth="1" strokeDasharray="3,3" />
          <line x1={right} y1={top} x2={right} y2={top - 35} stroke="#475569" strokeWidth="1" strokeDasharray="3,3" />

          {/* Right Height Extension Lines */}
          <line x1={right} y1={top} x2={right + 35} y2={top} stroke="#475569" strokeWidth="1" strokeDasharray="3,3" />
          <line x1={right} y1={bottom} x2={right + 35} y2={bottom} stroke="#475569" strokeWidth="1" strokeDasharray="3,3" />

          {/* 2. DIMENSION LINES WITH ARROWS */}
          {/* Width Dimension Line (Top) */}
          <line 
            x1={left + 5} 
            y1={top - 25} 
            x2={right - 5} 
            y2={top - 25} 
            stroke="#38bdf8" 
            strokeWidth="1.5" 
            markerStart="url(#arrow-start)" 
            markerEnd="url(#arrow-end)" 
          />
          
          {/* Height Dimension Line (Right) */}
          <line 
            x1={right + 25} 
            y1={top + 5} 
            x2={right + 25} 
            y2={bottom - 5} 
            stroke="#38bdf8" 
            strokeWidth="1.5" 
            markerStart="url(#arrow-start)" 
            markerEnd="url(#arrow-end)" 
          />

          {/* 3. DIMENSION LABELS */}
          {/* Width Label */}
          <rect 
            x={(left + right) / 2 - 45} 
            y={top - 36} 
            width="90" 
            height="22" 
            rx="4" 
            fill="#0f172a" 
            stroke="#334155" 
            strokeWidth="1" 
          />
          <text 
            x={(left + right) / 2} 
            y={top - 21} 
            fill="#38bdf8" 
            fontSize="11" 
            fontFamily="JetBrains Mono, monospace" 
            fontWeight="bold" 
            textAnchor="middle"
          >
            {formattedWidth}
          </text>

          {/* Height Label */}
          <g transform={`translate(${right + 25}, ${(top + bottom) / 2})`}>
            <rect 
              x="-11" 
              y="-40" 
              width="22" 
              height="80" 
              rx="4" 
              fill="#0f172a" 
              stroke="#334155" 
              strokeWidth="1" 
            />
            <text 
              transform="rotate(90)" 
              x="0" 
              y="4" 
              fill="#38bdf8" 
              fontSize="11" 
              fontFamily="JetBrains Mono, monospace" 
              fontWeight="bold" 
              textAnchor="middle"
            >
              {formattedHeight}
            </text>
          </g>

          {/* 4. THE ACTUAL METAL FRAME DRAWING */}
          {/* External Outline Rect */}
          <rect 
            x={left} 
            y={top} 
            width={rectWidth} 
            height={rectHeight} 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="2" 
          />

          {/* Steel Frame (Outer Solid metal bar representation with double outlines to look like Metalon profile tubing) */}
          <rect 
            x={left} 
            y={top} 
            width={rectWidth} 
            height={rectHeight} 
            fill="none" 
            stroke="#64748b" 
            strokeWidth={strokeWidth} 
          />
          {/* Inner details to give realistic metal profile look */}
          <rect 
            x={left + strokeWidth / 2} 
            y={top + strokeWidth / 2} 
            width={rectWidth - strokeWidth} 
            height={rectHeight - strokeWidth} 
            fill="rgba(15, 23, 42, 0.5)" 
            stroke="#475569" 
            strokeWidth="1" 
          />

          {/* Subtly draw corner miters (serralheiro weld joints style) */}
          <line x1={left} y1={top} x2={left + strokeWidth} y2={top + strokeWidth} stroke="#334155" strokeWidth="1" />
          <line x1={right} y1={top} x2={right - strokeWidth} y2={top + strokeWidth} stroke="#334155" strokeWidth="1" />
          <line x1={left} y1={bottom} x2={left + strokeWidth} y2={bottom - strokeWidth} stroke="#334155" strokeWidth="1" />
          <line x1={right} y1={bottom} x2={right - strokeWidth} y2={bottom - strokeWidth} stroke="#334155" strokeWidth="1" />

          {/* 5. INDIVIDUAL PIECES DRAWING (WITH MULTICOLORED GROUPS FOR HIGH VISUAL INTUITION) */}
          {pieces.map((piece) => {
            const colors = PIECE_COLORS[piece.type] || { stroke: '#94a3b8', fill: 'rgba(148, 163, 184, 0.1)', text: 'text-slate-400' };
            const isHighlighted = highlightedPieceId === piece.id;

            // Compute SVG pixels coordinates using scale
            const pX = x + (piece.posX * scale);
            const pY = y + (piece.posY * scale);
            const pW = (piece.width || piece.thickness || 30) * scale;
            const pH = (piece.height || piece.thickness || 30) * scale;
            const pLen = (piece.length || 100) * scale;

            if (piece.type === 'diagonal') {
              const dDir = piece.diagonalDirection || '\\';
              const strokeW = Math.max(3, (piece.thickness || 25) * scale);
              
              // Points determination
              let x1 = pX;
              let y1 = pY;
              let x2 = pX + pLen;
              let y2 = pY + pH;

              // Fallback to full frame limits if zero or default
              if (piece.posX === 0 && piece.posY === 0 && piece.length === 0 && piece.height === 0) {
                x1 = left + strokeWidth / 2;
                y1 = top + strokeWidth / 2;
                x2 = right - strokeWidth / 2;
                y2 = bottom - strokeWidth / 2;
              }

              if (dDir === '/') {
                const tempY = y1;
                y1 = y2;
                y2 = tempY;
              }

              return (
                <g key={piece.id}>
                  {/* Highlight Glow */}
                  {isHighlighted && (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#ffffff"
                      strokeWidth={strokeW + 5}
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                  )}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={colors.stroke}
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                    className="transition-all duration-200"
                  />
                  {/* Text label */}
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 4}
                    fill="#ffffff"
                    fontSize="8"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                    style={{ paintOrder: 'stroke', stroke: '#090d16', strokeWidth: 2 }}
                  >
                    {piece.name}
                  </text>
                </g>
              );
            }

            // Normal straight profiles (vertical / horizontal)
            let drawX = pX;
            let drawY = pY;
            let drawW = 0;
            let drawH = 0;

            if (piece.orientation === 'vertical') {
              drawW = pW;
              drawH = pLen;
            } else {
              drawW = pLen;
              drawH = pH;
            }

            // Constrain minimally
            drawW = Math.max(4, drawW);
            drawH = Math.max(4, drawH);

            return (
              <g key={piece.id}>
                {/* Highlight boundary */}
                {isHighlighted && (
                  <rect
                    x={drawX - 2}
                    y={drawY - 2}
                    width={drawW + 4}
                    height={drawH + 4}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    rx="2"
                  />
                )}
                {/* Piece Base Rect */}
                <rect
                  x={drawX}
                  y={drawY}
                  width={drawW}
                  height={drawH}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="1.5"
                  rx="1.5"
                  className="transition-all duration-200"
                />
                
                {/* Inset metal lines detailing */}
                {drawW > 8 && drawH > 8 && (
                  <rect
                    x={drawX + 1.5}
                    y={drawY + 1.5}
                    width={drawW - 3}
                    height={drawH - 3}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth="0.5"
                    strokeDasharray="2,3"
                    opacity="0.6"
                  />
                )}

                {/* Opening arrows / swings if it is a gate or window leaf */}
                {(piece.type === 'folha_porta' || piece.type === 'folha_portao' || piece.type === 'folha_janela') && (
                  <g opacity="0.5" stroke={colors.stroke} strokeWidth="1" fill="none">
                    {piece.leafType === 'esquerda' ? (
                      <path d={`M ${drawX + 2} ${drawY + 2} L ${drawX + drawW - 2} ${drawY + drawH / 2} L ${drawX + 2} ${drawY + drawH - 2}`} strokeDasharray="2,2" />
                    ) : piece.leafType === 'direita' ? (
                      <path d={`M ${drawX + drawW - 2} ${drawY + 2} L ${drawX + 2} ${drawY + drawH / 2} L ${drawX + drawW - 2} ${drawY + drawH - 2}`} strokeDasharray="2,2" />
                    ) : piece.leafType === 'dupla' ? (
                      <g strokeDasharray="2,2">
                        <path d={`M ${drawX + 2} ${drawY + 2} L ${drawX + drawW / 2} ${drawY + drawH / 2} L ${drawX + 2} ${drawY + drawH - 2}`} />
                        <path d={`M ${drawX + drawW - 2} ${drawY + 2} L ${drawX + drawW / 2} ${drawY + drawH / 2} L ${drawX + drawW - 2} ${drawY + drawH - 2}`} />
                      </g>
                    ) : (
                      // Sliding arrows representation
                      <g>
                        <line x1={drawX + drawW / 2 - 8} y1={drawY + drawH / 2} x2={drawX + drawW / 2 + 8} y2={drawY + drawH / 2} />
                        <polyline points={`${drawX + drawW / 2 - 4} ${drawY + drawH / 2 - 3} ${drawX + drawW / 2 - 8} ${drawY + drawH / 2} ${drawX + drawW / 2 - 4} ${drawY + drawH / 2 + 3}`} />
                        <polyline points={`${drawX + drawW / 2 + 4} ${drawY + drawH / 2 - 3} ${drawX + drawW / 2 + 8} ${drawY + drawH / 2} ${drawX + drawW / 2 + 4} ${drawY + drawH / 2 + 3}`} />
                      </g>
                    )}
                  </g>
                )}

                {/* Compact Text Identifier */}
                <text
                  x={drawX + drawW / 2}
                  y={drawY + drawH / 2 + 3}
                  fill="#ffffff"
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  style={{ paintOrder: 'stroke', stroke: '#090d16', strokeWidth: 2 }}
                >
                  {piece.name.length > 10 ? piece.name.substring(0, 8) + '..' : piece.name}
                </text>
              </g>
            );
          })}

          {/* Visual Scale Indicator details (aesthetic crosshair) */}
          <circle cx={left} cy={top} r="3" fill="#38bdf8" />
          <circle cx={right} cy={top} r="3" fill="#38bdf8" />
          <circle cx={left} cy={bottom} r="3" fill="#38bdf8" />
          <circle cx={right} cy={bottom} r="3" fill="#38bdf8" />
        </svg>
      </div>

      {/* Piece color legend when pieces exist */}
      {presentPieceTypes.length > 0 && (
        <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex flex-wrap gap-2 items-center text-[10px] font-mono">
          <span className="text-slate-500 font-bold uppercase flex items-center gap-1">
            <Tags className="w-3.5 h-3.5 text-indigo-400" /> Legenda:
          </span>
          {presentPieceTypes.map(type => {
            const label = PIECE_TYPE_LABELS[type] || type;
            const colors = PIECE_COLORS[type] || { stroke: '#94a3b8', bg: 'bg-slate-800/40', border: 'border-slate-800/50', text: 'text-slate-400' };
            return (
              <span key={type} className={`px-2 py-0.5 rounded border ${colors.bg} ${colors.border} ${colors.text} flex items-center gap-1`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.stroke }}></span>
                {label}
              </span>
            );
          })}
        </div>
      )}

      {/* Blueprint Footer Details */}
      <div className="bg-slate-900 border-t border-slate-800 px-5 py-3.5 flex flex-col sm:flex-row justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-1.5 font-mono">
          <span className="text-slate-500">Perímetro total estimado:</span>
          <span className="text-emerald-400 font-semibold">
            {calcPerimeter(width, height, displayUnit)} {displayUnit}
          </span>
        </div>
        <div className="flex items-center space-x-1.5 font-mono">
          <span className="text-slate-500">Área interna:</span>
          <span className="text-slate-300">
            {calcArea(width, height, displayUnit)} {displayUnit === 'm' ? 'm²' : displayUnit === 'cm' ? 'cm²' : 'mm²'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Helper to calculate estimated metal profile length
function calcPerimeter(wMm: number, hMm: number, unit: MeasurementUnit): string {
  const totalMm = (wMm + hMm) * 2;
  if (unit === 'm') return (totalMm / 1000).toFixed(2);
  if (unit === 'cm') return (totalMm / 10).toFixed(1);
  return totalMm.toFixed(0);
}

// Helper to calculate area
function calcArea(wMm: number, hMm: number, unit: MeasurementUnit): string {
  const w = unit === 'm' ? wMm / 1000 : unit === 'cm' ? wMm / 10 : wMm;
  const h = unit === 'm' ? hMm / 1000 : unit === 'cm' ? hMm / 10 : hMm;
  const area = w * h;
  if (unit === 'm') return area.toFixed(3);
  if (unit === 'cm') return area.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return area.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}
