/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetalProject } from '../../types';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  message?: string;
  error?: string;
}

export interface IStorageProvider {
  /**
   * Load all projects from storage
   */
  loadProjects(): Promise<MetalProject[]>;

  /**
   * Save entire project list to storage
   */
  saveProjects(projects: MetalProject[]): Promise<void>;

  /**
   * Save or update a single project
   */
  saveProject(project: MetalProject): Promise<void>;

  /**
   * Delete a project by ID
   */
  deleteProject(id: string): Promise<void>;

  /**
   * Load a single project by ID
   */
  loadProjectById(id: string): Promise<MetalProject | null>;

  /**
   * Sync projects with remote server (e.g., Supabase) when enabled
   */
  syncRemote?(): Promise<SyncResult>;
}
