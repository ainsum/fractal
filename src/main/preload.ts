/**
 * Preload script for secure IPC communication
 * Exposes APIs to renderer process with proper security
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import {
  type AIProvider,
  type AIRequest,
  type AIResponse,
  type AIStreamChunk,
  type GenerateWebsiteRequest,
  IPCRequest,
  type IPCResponse,
  type StreamWebsiteRequest,
} from '../shared/types';

// Generate unique request IDs
let requestId = 0;
const generateRequestId = () => `req_${++requestId}_${Date.now()}`;

// Type-safe IPC wrapper
const ipc = {
  invoke: async <T = any>(channel: string, payload?: any): Promise<T> => {
    return await ipcRenderer.invoke(channel, payload);
  },

  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, callback);
  },

  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
};

// AI Service API
const aiService = {
  /**
   * Generate website content
   */
  generateWebsite: async (
    request: Omit<AIRequest, 'provider'> & { provider?: string }
  ): Promise<AIResponse> => {
    const ipcRequest: GenerateWebsiteRequest = {
      id: generateRequestId(),
      type: 'generate-website',
      payload: request,
    };

    const response = await ipc.invoke<IPCResponse>(IPC_CHANNELS.GENERATE_WEBSITE, ipcRequest);

    if (response.error) {
      throw new Error(response.error);
    }

    return response.payload as AIResponse;
  },

  /**
   * Stream website content generation
   */
  streamWebsite: async (
    request: Omit<AIRequest, 'provider'> & { provider?: string },
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void> => {
    const ipcRequest: StreamWebsiteRequest = {
      id: generateRequestId(),
      type: 'stream-website',
      payload: request,
    };

    // Set up stream listener
    const handleChunk = (_event: any, chunk: any) => {
      if (chunk.id === ipcRequest.id) {
        onChunk(chunk.payload as AIStreamChunk);
      }
    };

    ipc.on('stream-chunk', handleChunk);

    try {
      const response = await ipc.invoke<IPCResponse>(IPC_CHANNELS.STREAM_WEBSITE, ipcRequest);

      if (response.error) {
        throw new Error(response.error);
      }
    } finally {
      ipc.off('stream-chunk', handleChunk);
    }
  },

  /**
   * Get available AI providers
   */
  getProviders: async (): Promise<AIProvider[]> => {
    return await ipc.invoke<AIProvider[]>('get-providers');
  },

  /**
   * Get default provider
   */
  getDefaultProvider: async (): Promise<string> => {
    return await ipc.invoke<string>('get-default-provider');
  },

  /**
   * Clear AI cache
   */
  clearCache: async (): Promise<{ success: boolean; error?: string }> => {
    return await ipc.invoke<{ success: boolean; error?: string }>('clear-cache');
  },

  /**
   * Get cache statistics
   */
  getCacheStats: async (): Promise<{ size: number; maxSize: number }> => {
    return await ipc.invoke<{ size: number; maxSize: number }>('get-cache-stats');
  },
};

// Browser API
const browser = {
  /**
   * Navigate to URL
   */
  navigate: async (_url: string): Promise<void> => {
    // This will be handled by the renderer process
    // The preload script provides the interface
  },

  /**
   * Go back in history
   */
  goBack: async (): Promise<void> => {
    // This will be handled by the renderer process
  },

  /**
   * Go forward in history
   */
  goForward: async (): Promise<void> => {
    // This will be handled by the renderer process
  },

  /**
   * Refresh current page
   */
  refresh: async (): Promise<void> => {
    // This will be handled by the renderer process
  },
};

// Utility API
const utils = {
  /**
   * Validate URL format
   */
  validateUrl: (url: string): boolean => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  },

  /**
   * Extract domain from URL
   */
  extractDomain: (url: string): string => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace('www.', '');
    }
  },

  /**
   * Generate unique ID
   */
  generateId: (): string => {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
};

// Expose APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  ai: aiService,
  browser,
  utils,
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      ai: typeof aiService;
      browser: typeof browser;
      utils: typeof utils;
    };
  }
}
