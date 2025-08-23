/**
 * Main Electron process entry point
 * Handles app lifecycle, window management, and IPC
 */

// Load environment variables first
import 'dotenv/config';

import path from 'node:path';
import { BrowserWindow, Menu, app, ipcMain, shell } from 'electron';
import started from 'electron-squirrel-startup';
import {
  APP_NAME,
  DEV_CONSTANTS,
  IPC_CHANNELS,
  SECURITY_CONSTANTS,
  UI_CONSTANTS,
} from '../shared/constants';
import { logger } from '../shared/logger';
import {
  AIError,
  AIRequest,
  type GenerateWebsiteRequest,
  IPCRequest,
  type IPCResponse,
  NavigationError,
  type StreamWebsiteRequest,
} from '../shared/types';
import { LLMService } from './services';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Global reference to window object
let mainWindow: BrowserWindow | null = null;
let llmService: LLMService;

/**
 * Create the main application window
 */
const createWindow = () => {
  // Create the browser window with secure defaults
  mainWindow = new BrowserWindow({
    width: UI_CONSTANTS.DEFAULT_WINDOW_WIDTH,
    height: UI_CONSTANTS.DEFAULT_WINDOW_HEIGHT,
    minWidth: UI_CONSTANTS.MIN_WINDOW_WIDTH,
    minHeight: UI_CONSTANTS.MIN_WINDOW_HEIGHT,
    title: APP_NAME,
    icon: path.join(__dirname, '../../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      webgl: false,
      plugins: false,
    },
  });

  // Set CSP headers
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [SECURITY_CONSTANTS.CSP_POLICY],
      },
    });
  });

  // Load the app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open DevTools in development
  if (DEV_CONSTANTS.DEV_TOOLS) {
    mainWindow.webContents.openDevTools();

    // Suppress autofill-related DevTools errors
    mainWindow.webContents.on('console-message', (event, _level, message, _line, _sourceId) => {
      if (message.includes('Autofill.enable') || message.includes('Autofill.setAddresses')) {
        event.preventDefault();
      }
    });
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

/**
 * Initialize the application
 */
const initializeApp = async () => {
  logger.info('Initializing Fractal application', {
    component: 'MainProcess',
    method: 'initializeApp',
  });

  try {
    // Debug: Check if environment variables are loaded
    logger.info('Environment variables check:', {
      component: 'MainProcess',
      method: 'initializeApp',
    });
    logger.info(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'Set' : 'Not set'}`, {
      component: 'MainProcess',
      method: 'initializeApp',
    });
    logger.info(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'Set' : 'Not set'}`, {
      component: 'MainProcess',
      method: 'initializeApp',
    });
    logger.info(`GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY ? 'Set' : 'Not set'}`, {
      component: 'MainProcess',
      method: 'initializeApp',
    });

    // Initialize AI service
    logger.debug('Initializing AI service', { component: 'MainProcess', method: 'initializeApp' });
    llmService = new LLMService();

    // Set up IPC handlers
    logger.debug('Setting up IPC handlers', { component: 'MainProcess', method: 'initializeApp' });
    setupIPCHandlers();

    // Create window
    logger.debug('Creating main window', { component: 'MainProcess', method: 'initializeApp' });
    createWindow();

    // Set up application menu
    logger.debug('Setting up application menu', {
      component: 'MainProcess',
      method: 'initializeApp',
    });
    setupMenu();

    logger.info('Fractal initialized successfully', {
      component: 'MainProcess',
      method: 'initializeApp',
    });
  } catch (error) {
    logger.errorWithDetails(
      error instanceof Error ? error : new Error('Failed to initialize app'),
      { component: 'MainProcess', method: 'initializeApp' }
    );
    app.quit();
  }
};

/**
 * Set up IPC handlers for communication with renderer
 */
const setupIPCHandlers = () => {
  // Generate website content
  ipcMain.handle(IPC_CHANNELS.GENERATE_WEBSITE, async (_event, request: GenerateWebsiteRequest) => {
    logger.info('Handling generate website request', {
      component: 'MainProcess',
      method: 'IPC_GENERATE_WEBSITE',
      requestId: request.id,
      url: request.payload.url,
      provider: request.payload.provider,
    });

    try {
      const response = await llmService.generateWebsite({
        ...request.payload,
        provider: request.payload.provider || llmService.getDefaultProvider(),
      });
      logger.info('Generate website request completed successfully', {
        component: 'MainProcess',
        method: 'IPC_GENERATE_WEBSITE',
        requestId: request.id,
        contentLength: response.content.length,
      });

      return {
        id: request.id,
        type: 'generate-website-response',
        payload: {
          content: response.content,
          provider: response.provider,
          model: response.model,
          metadata: response.metadata,
        },
      } as IPCResponse;
    } catch (error) {
      logger.errorWithDetails(error instanceof Error ? error : new Error('Unknown error'), {
        component: 'MainProcess',
        method: 'IPC_GENERATE_WEBSITE',
        requestId: request.id,
        url: request.payload.url,
      });

      return {
        id: request.id,
        type: 'generate-website-response',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as IPCResponse;
    }
  });

  // Stream website content
  ipcMain.handle(IPC_CHANNELS.STREAM_WEBSITE, async (_event, request: StreamWebsiteRequest) => {
    logger.info('Handling stream website request', {
      component: 'MainProcess',
      method: 'IPC_STREAM_WEBSITE',
      requestId: request.id,
      url: request.payload.url,
      provider: request.payload.provider,
    });

    try {
      const stream = llmService.streamWebsite({
        ...request.payload,
        provider: request.payload.provider || llmService.getDefaultProvider(),
      });
      const chunks: any[] = [];
      let chunkCount = 0;

      for await (const chunk of stream) {
        chunks.push(chunk);
        chunkCount++;

        // Send chunk to renderer
        if (mainWindow && !mainWindow.isDestroyed()) {
          const chunkToSend = {
            id: request.id,
            type: 'stream-website-chunk',
            payload: chunk,
          };

          mainWindow.webContents.send('stream-chunk', chunkToSend);

          logger.debug('Sent stream chunk to renderer', {
            component: 'MainProcess',
            method: 'IPC_STREAM_WEBSITE',
            requestId: request.id,
            chunkCount,
            chunkSize: chunk.content?.length || 0,
            done: chunk.done,
            metadata: chunk.metadata,
          });
        } else {
          logger.warn('Main window not available for streaming', {
            component: 'MainProcess',
            method: 'IPC_STREAM_WEBSITE',
            requestId: request.id,
          });
        }
      }

      logger.info('Stream website request completed successfully', {
        component: 'MainProcess',
        method: 'IPC_STREAM_WEBSITE',
        requestId: request.id,
        totalChunks: chunkCount,
      });

      return {
        id: request.id,
        type: 'stream-website-response',
        payload: { success: true },
      } as IPCResponse;
    } catch (error) {
      logger.errorWithDetails(error instanceof Error ? error : new Error('Unknown error'), {
        component: 'MainProcess',
        method: 'IPC_STREAM_WEBSITE',
        requestId: request.id,
        url: request.payload.url,
      });

      return {
        id: request.id,
        type: 'stream-website-response',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as IPCResponse;
    }
  });

  // Get available providers
  ipcMain.handle('get-providers', async () => {
    try {
      return llmService.getProviders();
    } catch (error) {
      console.error('Failed to get providers:', error);
      return [];
    }
  });

  // Get default provider
  ipcMain.handle('get-default-provider', async () => {
    try {
      return llmService.getDefaultProvider();
    } catch (error) {
      console.error('Failed to get default provider:', error);
      return null;
    }
  });

  // Clear cache
  ipcMain.handle('clear-cache', async () => {
    try {
      llmService.clearCache();
      return { success: true };
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Get cache stats
  ipcMain.handle('get-cache-stats', async () => {
    try {
      return llmService.getCacheStats();
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { size: 0, maxSize: 0 };
    }
  });

  // Get provider status
  ipcMain.handle('get-provider-status', async () => {
    try {
      return {
        hasProviders: llmService.hasProviders(),
        providers: llmService.getProviders(),
        status: llmService.getProviderStatus(),
      };
    } catch (error) {
      console.error('Failed to get provider status:', error);
      return {
        hasProviders: false,
        providers: [],
        status: {},
      };
    }
  });
};

/**
 * Set up application menu
 */
const setupMenu = () => {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            createWindow();
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            // Show about dialog
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// App lifecycle events
app.on('ready', initializeApp);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation - handled by setWindowOpenHandler in createWindow

// Handle app quit
app.on('before-quit', () => {
  // Cleanup resources
  if (llmService) {
    llmService.clearCache();
  }
});
