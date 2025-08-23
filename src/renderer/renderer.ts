/**
 * Renderer process entry point
 * Initializes the browser UI and handles application startup
 */

import './styles/main.css';
import { logger } from '../shared/logger';
import { BrowserUI } from './browser-ui';

// Global browser instance
let browser: BrowserUI;

/**
 * Initialize the application
 */
async function initializeApp(): Promise<void> {
  try {
    logger.info('🚀 Initializing Fractal renderer process', {
      component: 'Renderer',
      method: 'initializeApp',
    });

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      logger.debug('Waiting for DOM to be ready', {
        component: 'Renderer',
        method: 'initializeApp',
      });
      await new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Initialize browser UI
    logger.debug('Initializing browser UI', { component: 'Renderer', method: 'initializeApp' });
    browser = new BrowserUI('app');

    // Load AI providers
    logger.debug('Loading AI providers', { component: 'Renderer', method: 'initializeApp' });
    await browser.loadProviders();

    // Set up global error handling
    logger.debug('Setting up error handling', { component: 'Renderer', method: 'initializeApp' });
    setupErrorHandling();

    // Show welcome message
    logger.debug('Showing welcome message', { component: 'Renderer', method: 'initializeApp' });
    showWelcomeMessage();

    logger.info('✅ Fractal renderer process initialized successfully', {
      component: 'Renderer',
      method: 'initializeApp',
    });
  } catch (error) {
    logger.errorWithDetails(
      error instanceof Error ? error : new Error('Failed to initialize app'),
      { component: 'Renderer', method: 'initializeApp' }
    );
    showError('Failed to initialize application');
  }
}

/**
 * Set up global error handling
 */
function setupErrorHandling(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.errorWithDetails(
      event.reason instanceof Error ? event.reason : new Error('Unhandled promise rejection'),
      {
        component: 'Renderer',
        method: 'setupErrorHandling',
        type: 'unhandledrejection',
      }
    );
    showError('An unexpected error occurred');
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    logger.errorWithDetails(
      event.error instanceof Error ? event.error : new Error('Global error'),
      {
        component: 'Renderer',
        method: 'setupErrorHandling',
        type: 'global-error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
    showError('An error occurred');
  });
}

/**
 * Show welcome message
 */
function showWelcomeMessage(): void {
  const welcomeHtml = `
    <html>
      <head>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .welcome-container {
            text-align: center;
            padding: 3rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 600px;
          }
          .logo {
            font-size: 3rem;
            margin-bottom: 1rem;
          }
          .title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
          }
          .subtitle {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
          }
          .description {
            font-size: 1rem;
            line-height: 1.6;
            margin-bottom: 2rem;
            opacity: 0.8;
          }
          .examples {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            justify-content: center;
            margin-bottom: 2rem;
          }
          .example {
            background: rgba(255, 255, 255, 0.2);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .example:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
          }
          .instructions {
            font-size: 0.9rem;
            opacity: 0.7;
          }
        </style>
      </head>
      <body>
        <div class="welcome-container">
          <div class="logo">🌐</div>
          <div class="title">Fractal</div>
          <div class="subtitle">AI-Powered Web Browser</div>
          <div class="description">
            Enter any URL in the address bar above and watch as AI generates a realistic website for that domain. 
            Experience the future of web browsing powered by Large Language Models.
          </div>
          <div class="examples">
            <div class="example" onclick="navigateTo('google.com')">google.com</div>
            <div class="example" onclick="navigateTo('facebook.com')">facebook.com</div>
            <div class="example" onclick="navigateTo('amazon.com')">amazon.com</div>
            <div class="example" onclick="navigateTo('twitter.com')">twitter.com</div>
            <div class="example" onclick="navigateTo('github.com')">github.com</div>
            <div class="example" onclick="navigateTo('netflix.com')">netflix.com</div>
          </div>
          <div class="instructions">
            Type a URL in the address bar and press Enter to get started
          </div>
        </div>
        <script>
          function navigateTo(url) {
            if (window.parent && window.parent.browser) {
              window.parent.browser.navigateToUrl(url);
            }
          }
        </script>
      </body>
    </html>
  `;

  // Display welcome message in the content frame
  const contentFrame = document.getElementById('content-frame') as HTMLIFrameElement;
  if (contentFrame) {
    contentFrame.srcdoc = welcomeHtml;
  }
}

/**
 * Show error message
 */
function showError(message: string): void {
  const errorHtml = `
    <html>
      <head>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: #f8f9fa;
            color: #333;
          }
          .error-container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            max-width: 500px;
          }
          .error-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          .error-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #e74c3c;
          }
          .error-message {
            font-size: 1rem;
            color: #666;
            line-height: 1.5;
          }
          .retry-button {
            margin-top: 1.5rem;
            padding: 0.75rem 1.5rem;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.2s ease;
          }
          .retry-button:hover {
            background: #5a6fd8;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <div class="error-title">Something went wrong</div>
          <div class="error-message">${message}</div>
          <button class="retry-button" onclick="window.location.reload()">
            Retry
          </button>
        </div>
      </body>
    </html>
  `;

  const contentFrame = document.getElementById('content-frame') as HTMLIFrameElement;
  if (contentFrame) {
    contentFrame.srcdoc = errorHtml;
  }
}

/**
 * Handle keyboard shortcuts
 */
function setupKeyboardShortcuts(): void {
  document.addEventListener('keydown', (event) => {
    // Cmd/Ctrl + L: Focus address bar
    if ((event.metaKey || event.ctrlKey) && event.key === 'l') {
      event.preventDefault();
      const addressBar = document.getElementById('address-bar') as HTMLInputElement;
      if (addressBar) {
        addressBar.focus();
        addressBar.select();
      }
    }

    // Cmd/Ctrl + R: Refresh
    if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
      event.preventDefault();
      if (browser) {
        browser.refresh();
      }
    }

    // Cmd/Ctrl + Left/Right: Navigate back/forward
    if (event.metaKey || event.ctrlKey) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (browser) {
          browser.goBack();
        }
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (browser) {
          browser.goForward();
        }
      }
    }
  });
}

// Initialize app when script loads
initializeApp()
  .then(() => {
    logger.debug('Setting up keyboard shortcuts', { component: 'Renderer', method: 'main' });
    setupKeyboardShortcuts();
  })
  .catch((error) => {
    logger.errorWithDetails(
      error instanceof Error ? error : new Error('Failed to initialize app'),
      { component: 'Renderer', method: 'main' }
    );
    showError('Failed to start application');
  });

// Export browser instance for global access (for debugging)
(window as any).browser = browser;
