/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetalProject } from '../../types';
import { IStorageProvider, SyncResult } from './IStorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';

export interface SupabaseConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  autoSync?: boolean;
}

/**
 * SupabaseSyncAdapter - Prepared persistence adapter for future cloud sync with Supabase
 *
 * Wraps local storage for offline resilience and provides stub/hook methods for future
 * real-time synchronization with Supabase tables.
 */
export class SupabaseSyncAdapter implements IStorageProvider {
  private localProvider: LocalStorageProvider;
  private config: SupabaseConfig;
  private isConfigured: boolean = false;

  constructor(config: SupabaseConfig = {}, localKey?: string) {
    this.localProvider = new LocalStorageProvider(localKey);
    this.config = config;
    this.isConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  }

  public async loadProjects(): Promise<MetalProject[]> {
    // Always load local projects first for instant offline readiness
    const localProjects = await this.localProvider.loadProjects();

    if (this.isConfigured) {
      try {
        // Placeholder for remote fetch from Supabase table 'projects'
        // e.g. const { data, error } = await supabase.from('projects').select('*');
      } catch (err) {
        console.warn('[SupabaseSyncAdapter] Cloud fetch failed, using local cache:', err);
      }
    }

    return localProjects;
  }

  public async saveProjects(projects: MetalProject[]): Promise<void> {
    await this.localProvider.saveProjects(projects);

    if (this.isConfigured) {
      try {
        // Placeholder for batch upsert to Supabase
        // e.g. await supabase.from('projects').upsert(projects);
      } catch (err) {
        console.warn('[SupabaseSyncAdapter] Remote batch save failed, local saved:', err);
      }
    }
  }

  public async saveProject(project: MetalProject): Promise<void> {
    await this.localProvider.saveProject(project);

    if (this.isConfigured) {
      try {
        // Placeholder for single row upsert to Supabase
        // e.g. await supabase.from('projects').upsert([project]);
      } catch (err) {
        console.warn('[SupabaseSyncAdapter] Remote project save failed:', err);
      }
    }
  }

  public async deleteProject(id: string): Promise<void> {
    await this.localProvider.deleteProject(id);

    if (this.isConfigured) {
      try {
        // Placeholder for remote delete from Supabase
        // e.g. await supabase.from('projects').delete().eq('id', id);
      } catch (err) {
        console.warn('[SupabaseSyncAdapter] Remote project deletion failed:', err);
      }
    }
  }

  public async loadProjectById(id: string): Promise<MetalProject | null> {
    return this.localProvider.loadProjectById(id);
  }

  public async syncRemote(): Promise<SyncResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        syncedCount: 0,
        message: 'Supabase não configurado. Adicione SUPABASE_URL e SUPABASE_ANON_KEY nas configurações.'
      };
    }

    try {
      // Prepared logic for future bidirection sync algorithm
      const localProjects = await this.localProvider.loadProjects();
      return {
        success: true,
        syncedCount: localProjects.length,
        message: 'Sincronização com Supabase preparada e pronta.'
      };
    } catch (err: any) {
      return {
        success: false,
        syncedCount: 0,
        error: err.message || 'Erro durante a sincronização com Supabase.'
      };
    }
  }

  public setConfig(config: SupabaseConfig): void {
    this.config = { ...this.config, ...config };
    this.isConfigured = Boolean(this.config.supabaseUrl && this.config.supabaseAnonKey);
  }

  public getIsConfigured(): boolean {
    return this.isConfigured;
  }
}
