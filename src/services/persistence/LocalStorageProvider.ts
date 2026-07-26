/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetalProject } from '../../types';
import { IStorageProvider, SyncResult } from './IStorageProvider';

export const DEFAULT_STORAGE_KEY = 'serralheria_projetos';

export const DEFAULT_PRESET_PROJECTS: MetalProject[] = [
  {
    id: 'proj-1',
    name: 'Portão da casa',
    status: 'planejamento',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    frame: {
      width: 2400,
      height: 1800,
      displayUnit: 'cm',
      displayWidth: 240,
      displayHeight: 180,
      profile: 'Metalon 40x40 mm'
    }
  },
  {
    id: 'proj-2',
    name: 'Janela da sala',
    status: 'em_producao',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    frame: {
      width: 1500,
      height: 1200,
      displayUnit: 'mm',
      displayWidth: 1500,
      displayHeight: 1200,
      profile: 'Metalon 30x30 mm'
    }
  },
  {
    id: 'proj-3',
    name: 'Prateleira Industrial',
    status: 'concluido',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    frame: {
      width: 800,
      height: 1600,
      displayUnit: 'm',
      displayWidth: 0.8,
      displayHeight: 1.6,
      profile: 'Metalon 20x20 mm'
    }
  },
  {
    id: 'proj-4',
    name: 'Estrutura do telhado',
    status: 'planejamento',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export class LocalStorageProvider implements IStorageProvider {
  private storageKey: string;

  constructor(storageKey: string = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  public async loadProjects(): Promise<MetalProject[]> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('[LocalStorageProvider] Error parsing stored projects from localStorage:', e);
    }

    // Default fallback
    await this.saveProjects(DEFAULT_PRESET_PROJECTS);
    return DEFAULT_PRESET_PROJECTS;
  }

  public async saveProjects(projects: MetalProject[]): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(projects));
    } catch (e) {
      console.error('[LocalStorageProvider] Error saving projects to localStorage:', e);
    }
  }

  public async saveProject(project: MetalProject): Promise<void> {
    const projects = await this.loadProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.unshift(project);
    }
    await this.saveProjects(projects);
  }

  public async deleteProject(id: string): Promise<void> {
    const projects = await this.loadProjects();
    const filtered = projects.filter(p => p.id !== id);
    await this.saveProjects(filtered);
  }

  public async loadProjectById(id: string): Promise<MetalProject | null> {
    const projects = await this.loadProjects();
    return projects.find(p => p.id === id) || null;
  }

  public async syncRemote(): Promise<SyncResult> {
    return {
      success: true,
      syncedCount: 0,
      message: 'Modo local ativo (sem sincronização remota).'
    };
  }
}
