/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetalProject, FrameConfig, PieceConfig, BudgetConfig, FreeDrawingData } from '../types';
import { EventBus, eventBus } from './EventBus';
import { IStorageProvider, LocalStorageProvider } from '../services/persistence';

export interface CreateProjectParams {
  name: string;
  status?: 'planejamento' | 'em_producao' | 'concluido';
  frame?: FrameConfig;
  pieces?: PieceConfig[];
  budgetConfig?: BudgetConfig;
  freeDrawing?: FreeDrawingData;
}

/**
 * ProjectManager - Central manager responsible for lifecycle operations on MetalProjects:
 * - create
 * - open
 * - save
 * - duplicate
 * - delete
 */
export class ProjectManager {
  private projects: MetalProject[] = [];
  private currentProject: MetalProject | null = null;
  private storageProvider: IStorageProvider;
  private bus: EventBus;
  private isInitialized: boolean = false;

  constructor(storageProvider?: IStorageProvider, bus: EventBus = eventBus) {
    this.storageProvider = storageProvider || new LocalStorageProvider();
    this.bus = bus;
  }

  /**
   * Initialize ProjectManager by loading projects from storage
   */
  public async init(): Promise<MetalProject[]> {
    if (this.isInitialized) {
      return this.projects;
    }

    this.projects = await this.storageProvider.loadProjects();
    this.isInitialized = true;
    this.bus.emit('projects:loaded', this.projects);
    return this.projects;
  }

  /**
   * Set a custom storage provider (e.g. SupabaseSyncAdapter)
   */
  public setStorageProvider(provider: IStorageProvider): void {
    this.storageProvider = provider;
  }

  /**
   * Return all currently loaded projects
   */
  public getProjects(): MetalProject[] {
    return [...this.projects];
  }

  /**
   * Get currently active project
   */
  public getCurrentProject(): MetalProject | null {
    return this.currentProject;
  }

  /**
   * Explicitly set current active project
   */
  public setCurrentProject(project: MetalProject | null): void {
    this.currentProject = project;
    this.bus.emit('project:opened', project);
  }

  /**
   * Create a new project
   */
  public async createProject(params: CreateProjectParams): Promise<MetalProject> {
    const now = new Date().toISOString();
    const newProject: MetalProject = {
      id: `proj-${Date.now()}`,
      name: params.name.trim(),
      status: params.status || 'planejamento',
      createdAt: now,
      updatedAt: now,
      frame: params.frame,
      pieces: params.pieces || [],
      diagonals: [],
      divisions: [],
      leaves: [],
      calculations: {},
      cutList: [],
      budgetConfig: params.budgetConfig,
      freeDrawing: params.freeDrawing,
    };

    this.projects = [newProject, ...this.projects];
    await this.storageProvider.saveProjects(this.projects);

    this.currentProject = newProject;
    this.bus.emit('project:created', newProject);
    this.bus.emit('project:opened', newProject);

    return newProject;
  }

  /**
   * Open an existing project by ID
   */
  public async openProject(id: string): Promise<MetalProject | null> {
    if (!this.isInitialized) {
      await this.init();
    }

    const found = this.projects.find(p => p.id === id) || null;
    this.currentProject = found;
    this.bus.emit('project:opened', found);

    return found;
  }

  /**
   * Save changes to a project
   */
  public async saveProject(project: MetalProject): Promise<MetalProject> {
    const updatedProject: MetalProject = {
      ...project,
      updatedAt: new Date().toISOString(),
    };

    const index = this.projects.findIndex(p => p.id === updatedProject.id);
    if (index >= 0) {
      this.projects[index] = updatedProject;
    } else {
      this.projects = [updatedProject, ...this.projects];
    }

    if (this.currentProject?.id === updatedProject.id) {
      this.currentProject = updatedProject;
    }

    await this.storageProvider.saveProjects(this.projects);

    this.bus.emit('project:saved', updatedProject);
    this.bus.emit('project:updated', updatedProject);

    return updatedProject;
  }

  /**
   * Duplicate an existing project
   */
  public async duplicateProject(id: string): Promise<MetalProject | null> {
    const target = this.projects.find(p => p.id === id);
    if (!target) return null;

    const now = new Date().toISOString();
    const duplicated: MetalProject = {
      ...JSON.parse(JSON.stringify(target)),
      id: `proj-${Date.now()}`,
      name: `${target.name} (Cópia)`,
      createdAt: now,
      updatedAt: now,
    };

    this.projects = [duplicated, ...this.projects];
    await this.storageProvider.saveProjects(this.projects);

    this.bus.emit('project:duplicated', duplicated);
    this.bus.emit('project:created', duplicated);

    return duplicated;
  }

  /**
   * Delete a project by ID
   */
  public async deleteProject(id: string): Promise<boolean> {
    const initialLength = this.projects.length;
    this.projects = this.projects.filter(p => p.id !== id);

    if (this.projects.length === initialLength) {
      return false; // Not found
    }

    await this.storageProvider.saveProjects(this.projects);

    if (this.currentProject?.id === id) {
      this.currentProject = null;
      this.bus.emit('project:opened', null);
    }

    this.bus.emit('project:deleted', { id });
    return true;
  }
}

// Global default ProjectManager instance
export const projectManager = new ProjectManager();
