/**
 * Tests for BrowserUI component
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserUI } from '../renderer/browser-ui';

// Mock the DOM
const createMockDOM = () => {
  const container = document.createElement('div');
  container.id = 'app';
  document.body.appendChild(container);
  return container;
};

describe('BrowserUI', () => {
  let container: HTMLElement;
  let browser: BrowserUI;

  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';

    // Create mock container
    container = createMockDOM();

    // Mock electronAPI
    (window as any).electronAPI = {
      ai: {
        streamWebsite: vi.fn(),
        getProviders: vi.fn().mockResolvedValue([
          { id: 'openai', name: 'OpenAI GPT-4', enabled: true },
          { id: 'anthropic', name: 'Anthropic Claude', enabled: true },
        ]),
        getDefaultProvider: vi.fn().mockResolvedValue('openai'),
      },
      utils: {
        generateId: vi.fn().mockReturnValue('test-id'),
        validateUrl: vi.fn().mockReturnValue(true),
        extractDomain: vi.fn().mockReturnValue('example.com'),
      },
    };
  });

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      browser = new BrowserUI('app');

      expect(browser.getState()).toEqual({
        currentUrl: '',
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        title: 'Fractal',
      });
    });

    it('should throw error if container not found', () => {
      expect(() => new BrowserUI('nonexistent')).toThrow(
        "Container with id 'nonexistent' not found"
      );
    });

    it('should create navigation elements', () => {
      browser = new BrowserUI('app');

      expect(document.getElementById('back-btn')).toBeTruthy();
      expect(document.getElementById('forward-btn')).toBeTruthy();
      expect(document.getElementById('refresh-btn')).toBeTruthy();
      expect(document.getElementById('home-btn')).toBeTruthy();
      expect(document.getElementById('address-bar')).toBeTruthy();
      expect(document.getElementById('content-frame')).toBeTruthy();
    });
  });

  describe('URL navigation', () => {
    beforeEach(() => {
      browser = new BrowserUI('app');
    });

    it('should normalize URLs correctly', async () => {
      const mockStream = (async function* () {
        yield { content: '<html><body>Test</body></html>', done: false };
        yield { content: '', done: true };
      })();

      (window as any).electronAPI.ai.streamWebsite.mockResolvedValue(mockStream);

      await browser.navigateToUrl('google.com');

      expect((window as any).electronAPI.ai.streamWebsite).toHaveBeenCalledWith(
        { url: 'https://google.com', provider: undefined },
        expect.any(Function)
      );
    });

    it('should handle empty URLs', async () => {
      await browser.navigateToUrl('');

      expect((window as any).electronAPI.ai.streamWebsite).not.toHaveBeenCalled();
    });

    it('should update state during navigation', async () => {
      const mockStream = (async function* () {
        yield { content: '<html><body>Test</body></html>', done: false };
        yield { content: '', done: true };
      })();

      (window as any).electronAPI.ai.streamWebsite.mockResolvedValue(mockStream);

      const navigatePromise = browser.navigateToUrl('example.com');

      // Check loading state
      expect(browser.getState().isLoading).toBe(true);

      await navigatePromise;

      // Check final state
      expect(browser.getState().isLoading).toBe(false);
      expect(browser.getState().currentUrl).toBe('https://example.com');
    });
  });

  describe('history management', () => {
    beforeEach(() => {
      browser = new BrowserUI('app');
    });

    it('should add entries to history', async () => {
      const mockStream = (async function* () {
        yield { content: '<html><body>Test</body></html>', done: false };
        yield { content: '', done: true };
      })();

      (window as any).electronAPI.ai.streamWebsite.mockResolvedValue(mockStream);

      await browser.navigateToUrl('example1.com');
      await browser.navigateToUrl('example2.com');

      const history = browser.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].url).toBe('https://example1.com');
      expect(history[1].url).toBe('https://example2.com');
    });

    it('should limit history size', async () => {
      const mockStream = (async function* () {
        yield { content: '<html><body>Test</body></html>', done: false };
        yield { content: '', done: true };
      })();

      (window as any).electronAPI.ai.streamWebsite.mockResolvedValue(mockStream);

      // Navigate more than 100 times
      for (let i = 0; i < 105; i++) {
        await browser.navigateToUrl(`example${i}.com`);
      }

      const history = browser.getHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe('provider management', () => {
    beforeEach(() => {
      browser = new BrowserUI('app');
    });

    it('should load providers correctly', async () => {
      await browser.loadProviders();

      const providerSelector = document.getElementById('provider-selector') as HTMLSelectElement;
      expect(providerSelector.children.length).toBeGreaterThan(1);
    });

    it('should handle provider loading errors', async () => {
      (window as any).electronAPI.ai.getProviders.mockRejectedValue(new Error('API Error'));

      // Should not throw
      await expect(browser.loadProviders()).resolves.toBeUndefined();
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      browser = new BrowserUI('app');
    });

    it('should handle AI service errors', async () => {
      (window as any).electronAPI.ai.streamWebsite.mockRejectedValue(new Error('AI Service Error'));

      await browser.navigateToUrl('example.com');

      const state = browser.getState();
      expect(state.error).toBe('AI Service Error');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('content sanitization', () => {
    beforeEach(() => {
      browser = new BrowserUI('app');
    });

    it('should sanitize dangerous content', () => {
      const dangerousContent = `
        <html>
          <head><title>Test</title></head>
          <body>
            <script>alert('dangerous')</script>
            <img src="http://evil.com/image.jpg" />
            <a href="http://example.com">Link</a>
          </body>
        </html>
      `;

      // Access private method for testing
      const sanitized = (browser as any).sanitizeContent(dangerousContent);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('data-src="');
      expect(sanitized).toContain('target="_blank"');
    });
  });
});
