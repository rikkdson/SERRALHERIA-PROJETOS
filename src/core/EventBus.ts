/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetalProject, PieceConfig, FreeDrawingData, MaterialProfile } from '../types';

export interface CoreEventMap {
  'project:created': MetalProject;
  'project:updated': MetalProject;
  'project:saved': MetalProject;
  'project:opened': MetalProject | null;
  'project:deleted': { id: string };
  'project:duplicated': MetalProject;
  'projects:loaded': MetalProject[];
  'objects:updated': { projectId: string; pieces: PieceConfig[] };
  'piece:added': { projectId: string; piece: PieceConfig };
  'piece:updated': { projectId: string; piece: PieceConfig };
  'piece:deleted': { projectId: string; pieceId: string };
  'freedrawing:updated': { projectId: string; freeDrawing: FreeDrawingData };
  'parametric:recalculated': { projectId: string; newWidth: number; newHeight: number; piecesCount: number };
  'parametric:constraint_updated': { projectId: string; pieceId: string };
  'materials:updated': MaterialProfile[];
  'sync:status': { status: 'idle' | 'syncing' | 'synced' | 'error'; message?: string };
}

export type EventCallback<T> = (data: T) => void;

/**
 * EventBus - Centralized event emitter for inter-module communication in Serralheria 2.0
 */
export class EventBus {
  private listeners: Map<keyof CoreEventMap, Set<EventCallback<any>>> = new Map();

  /**
   * Subscribe to an event
   */
  public on<K extends keyof CoreEventMap>(event: K, callback: EventCallback<CoreEventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   */
  public off<K extends keyof CoreEventMap>(event: K, callback: EventCallback<CoreEventMap[K]>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
    }
  }

  /**
   * Subscribe to an event once
   */
  public once<K extends keyof CoreEventMap>(event: K, callback: EventCallback<CoreEventMap[K]>): void {
    const onceWrapper: EventCallback<CoreEventMap[K]> = (data) => {
      this.off(event, onceWrapper);
      callback(data);
    };
    this.on(event, onceWrapper);
  }

  /**
   * Emit an event to all subscribers
   */
  public emit<K extends keyof CoreEventMap>(event: K, data: CoreEventMap[K]): void {
    const set = this.listeners.get(event);
    if (set && set.size > 0) {
      set.forEach(cb => {
        try {
          cb(data);
        } catch (error) {
          console.error(`[EventBus] Error in listener for event "${event}":`, error);
        }
      });
    }
  }

  /**
   * Clear all subscribers
   */
  public clear(): void {
    this.listeners.clear();
  }
}

// Global EventBus instance
export const eventBus = new EventBus();
