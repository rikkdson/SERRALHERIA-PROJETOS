/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PieceConfig, FreeDrawingData, MetalProject, ParametricConstraint } from '../types';
import { EventBus, eventBus } from './EventBus';
import { ProjectManager, projectManager } from './ProjectManager';
import { solveParametricStructure } from '../engines/parametricEngine';

/**
 * ObjectManager - Responsible for managing individual objects, structural pieces,
 * free drawing entities, and geometric shapes within project instances.
 */
export class ObjectManager {
  private projectMgr: ProjectManager;
  private bus: EventBus;

  constructor(projectMgr: ProjectManager = projectManager, bus: EventBus = eventBus) {
    this.projectMgr = projectMgr;
    this.bus = bus;
  }

  private getTargetProject(projectId?: string): MetalProject | null {
    if (projectId) {
      return this.projectMgr.getProjects().find(p => p.id === projectId) || null;
    }
    return this.projectMgr.getCurrentProject();
  }

  /**
   * Get all pieces of a project
   */
  public getPieces(projectId?: string): PieceConfig[] {
    const project = this.getTargetProject(projectId);
    return project?.pieces ? [...project.pieces] : [];
  }

  /**
   * Set entire list of pieces for a project
   */
  public setPieces(pieces: PieceConfig[], projectId?: string): void {
    const project = this.getTargetProject(projectId);
    if (!project) return;

    const updatedProject: MetalProject = {
      ...project,
      pieces: [...pieces],
      updatedAt: new Date().toISOString(),
    };

    this.projectMgr.saveProject(updatedProject);
    this.bus.emit('objects:updated', { projectId: updatedProject.id, pieces });
  }

  /**
   * Add a single piece to a project
   */
  public addPiece(piece: PieceConfig, projectId?: string): PieceConfig {
    const project = this.getTargetProject(projectId);
    if (!project) return piece;

    const currentPieces = project.pieces || [];
    const newPieces = [...currentPieces, piece];

    const updatedProject: MetalProject = {
      ...project,
      pieces: newPieces,
      updatedAt: new Date().toISOString(),
    };

    this.projectMgr.saveProject(updatedProject);
    this.bus.emit('piece:added', { projectId: updatedProject.id, piece });
    this.bus.emit('objects:updated', { projectId: updatedProject.id, pieces: newPieces });

    return piece;
  }

  /**
   * Update an existing piece by ID
   */
  public updatePiece(id: string, updates: Partial<PieceConfig>, projectId?: string): PieceConfig | null {
    const project = this.getTargetProject(projectId);
    if (!project || !project.pieces) return null;

    let updatedPiece: PieceConfig | null = null;
    const newPieces = project.pieces.map(p => {
      if (p.id === id) {
        updatedPiece = { ...p, ...updates };
        return updatedPiece;
      }
      return p;
    });

    if (!updatedPiece) return null;

    const updatedProject: MetalProject = {
      ...project,
      pieces: newPieces,
      updatedAt: new Date().toISOString(),
    };

    this.projectMgr.saveProject(updatedProject);
    this.bus.emit('piece:updated', { projectId: updatedProject.id, piece: updatedPiece });
    this.bus.emit('objects:updated', { projectId: updatedProject.id, pieces: newPieces });

    return updatedPiece;
  }

  /**
   * Delete a piece by ID
   */
  public deletePiece(id: string, projectId?: string): boolean {
    const project = this.getTargetProject(projectId);
    if (!project || !project.pieces) return false;

    const initialLength = project.pieces.length;
    const newPieces = project.pieces.filter(p => p.id !== id);

    if (newPieces.length === initialLength) return false;

    const updatedProject: MetalProject = {
      ...project,
      pieces: newPieces,
      updatedAt: new Date().toISOString(),
    };

    this.projectMgr.saveProject(updatedProject);
    this.bus.emit('piece:deleted', { projectId: updatedProject.id, pieceId: id });
    this.bus.emit('objects:updated', { projectId: updatedProject.id, pieces: newPieces });

    return true;
  }

  /**
   * Clear all pieces in a project
   */
  public clearPieces(projectId?: string): void {
    this.setPieces([], projectId);
  }

  /**
   * Get free drawing data for a project
   */
  public getFreeDrawing(projectId?: string): FreeDrawingData | undefined {
    const project = this.getTargetProject(projectId);
    return project?.freeDrawing;
  }

  /**
   * Update free drawing data for a project
   */
  public updateFreeDrawing(data: FreeDrawingData, projectId?: string): void {
    const project = this.getTargetProject(projectId);
    if (!project) return;

    const updatedProject: MetalProject = {
      ...project,
      freeDrawing: data,
      updatedAt: new Date().toISOString(),
    };

    this.projectMgr.saveProject(updatedProject);
    this.bus.emit('freedrawing:updated', { projectId: updatedProject.id, freeDrawing: data });
  }

  /**
   * Recalculates the entire parametric structure when width or height changes.
   */
  public recalculateParametricStructure(newWidth: number, newHeight: number, projectId?: string): MetalProject | null {
    const project = this.getTargetProject(projectId);
    if (!project) return null;

    const currentLines = project.freeDrawing?.lines || [];
    const currentPanels = project.freeDrawing?.panels || [];

    const solved = solveParametricStructure(currentLines, newWidth, newHeight, currentPanels);

    const updatedFrame = project.frame
      ? {
          ...project.frame,
          width: newWidth,
          height: newHeight,
          displayWidth: newWidth,
          displayHeight: newHeight,
        }
      : {
          width: newWidth,
          height: newHeight,
          displayUnit: 'mm' as const,
          displayWidth: newWidth,
          displayHeight: newHeight,
          profile: 'Metalon 30x30 mm',
        };

    const updatedFreeDrawing: FreeDrawingData = {
      ...(project.freeDrawing || {
        viewport: { zoom: 0.35, panX: 250, panY: 180 },
        gridSizeMm: 50,
        snapToGrid: true,
        snapToEndpoints: true,
      }),
      lines: solved.lines,
      panels: solved.panels,
      updatedAt: new Date().toISOString(),
    };

    const updatedProject: MetalProject = {
      ...project,
      frame: updatedFrame,
      pieces: solved.pieces,
      freeDrawing: updatedFreeDrawing,
      updatedAt: new Date().toISOString(),
    };

    this.projectMgr.saveProject(updatedProject);
    this.bus.emit('parametric:recalculated', {
      projectId: updatedProject.id,
      newWidth,
      newHeight,
      piecesCount: solved.pieces.length,
    });
    this.bus.emit('freedrawing:updated', { projectId: updatedProject.id, freeDrawing: updatedFreeDrawing });
    this.bus.emit('objects:updated', { projectId: updatedProject.id, pieces: solved.pieces });
    this.bus.emit('project:updated', updatedProject);

    return updatedProject;
  }

  /**
   * Update parametric constraints for a specific piece/line
   */
  public updatePieceConstraints(
    pieceId: string,
    constraints: ParametricConstraint[],
    projectId?: string
  ): boolean {
    const project = this.getTargetProject(projectId);
    if (!project) return false;

    let updated = false;

    // Update in freeDrawing
    if (project.freeDrawing?.lines) {
      const newLines = project.freeDrawing.lines.map((l) => {
        if (l.id === pieceId) {
          updated = true;
          return {
            ...l,
            constraints,
            restricoes: constraints,
          };
        }
        return l;
      });

      if (updated) {
        const updatedFD = {
          ...project.freeDrawing,
          lines: newLines,
          updatedAt: new Date().toISOString(),
        };

        const newPieces = (project.pieces || []).map((p) => {
          if (p.id === pieceId) {
            return {
              ...p,
              constraints,
              restricoes: constraints,
            };
          }
          return p;
        });

        const updatedProject = {
          ...project,
          freeDrawing: updatedFD,
          pieces: newPieces,
          updatedAt: new Date().toISOString(),
        };

        this.projectMgr.saveProject(updatedProject);
        this.bus.emit('parametric:constraint_updated', { projectId: updatedProject.id, pieceId });
        this.bus.emit('freedrawing:updated', { projectId: updatedProject.id, freeDrawing: updatedFD });
        this.bus.emit('objects:updated', { projectId: updatedProject.id, pieces: newPieces });
        return true;
      }
    }

    // Fallback update in pieces array
    if (project.pieces) {
      const newPieces = project.pieces.map((p) => {
        if (p.id === pieceId) {
          updated = true;
          return {
            ...p,
            constraints,
            restricoes: constraints,
          };
        }
        return p;
      });

      if (updated) {
        const updatedProject = {
          ...project,
          pieces: newPieces,
          updatedAt: new Date().toISOString(),
        };
        this.projectMgr.saveProject(updatedProject);
        this.bus.emit('parametric:constraint_updated', { projectId: updatedProject.id, pieceId });
        this.bus.emit('objects:updated', { projectId: updatedProject.id, pieces: newPieces });
        return true;
      }
    }

    return false;
  }
}

// Global default ObjectManager instance
export const objectManager = new ObjectManager();
