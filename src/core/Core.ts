/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventBus, eventBus } from './EventBus';
import { ProjectManager, projectManager } from './ProjectManager';
import { ObjectManager, objectManager } from './ObjectManager';
import { IStorageProvider, LocalStorageProvider, SupabaseSyncAdapter } from '../services/persistence';

/**
 * Core - Central Kernel of Serralheria Projetos 2.0
 *
 * Coordinates project lifecycle, object management, event dispatching,
 * and persistence adapters across all application modules.
 */
export class Core {
  private static instance: Core;

  public readonly eventBus: EventBus;
  public readonly projectManager: ProjectManager;
  public readonly objectManager: ObjectManager;
  public storageProvider: IStorageProvider;

  private isInitialized: boolean = false;

  private constructor() {
    this.eventBus = eventBus;
    this.storageProvider = new LocalStorageProvider();
    this.projectManager = projectManager;
    this.objectManager = objectManager;

    // Link default storage provider
    this.projectManager.setStorageProvider(this.storageProvider);
  }

  /**
   * Get Core singleton instance
   */
  public static getInstance(): Core {
    if (!Core.instance) {
      Core.instance = new Core();
    }
    return Core.instance;
  }

  /**
   * Initialize central core and load projects
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    await this.projectManager.init();
    this.isInitialized = true;
    console.log('[Core] Serralheria Projetos 2.0 Core initialized successfully.');
  }

  /**
   * Change storage provider (e.g. switch to Supabase adapter or custom DB)
   */
  public setStorageProvider(provider: IStorageProvider): void {
    this.storageProvider = provider;
    this.projectManager.setStorageProvider(provider);
  }

  /**
   * Enable Supabase Sync adapter
   */
  public enableSupabase(supabaseUrl?: string, supabaseAnonKey?: string): SupabaseSyncAdapter {
    const adapter = new SupabaseSyncAdapter({ supabaseUrl, supabaseAnonKey });
    this.setStorageProvider(adapter);
    return adapter;
  }
}

// Global Core singleton export
export const core = Core.getInstance();
