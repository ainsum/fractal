/**
 * Browser UI Component
 * Handles the browser interface with navigation, address bar, and content display
 */

import { AI_TOKEN_LIMITS, UI_CONSTANTS } from '../shared/constants';
import { logger } from '../shared/logger';
import type { AIStreamChunk, BrowserState, NavigationEntry } from '../shared/types';

export class BrowserUI {
  private container: HTMLElement;
  private addressBar: HTMLInputElement;
  private backButton: HTMLButtonElement;
  private forwardButton: HTMLButtonElement;
  private refreshButton: HTMLButtonElement;
  private homeButton: HTMLButtonElement;
  private contentFrame: HTMLIFrameElement;
  private loadingIndicator: HTMLElement;
  private statusBar: HTMLElement;
  private progressBar: HTMLElement;
  private providerSelector: HTMLSelectElement;

  private currentState: BrowserState;
  private navigationHistory: NavigationEntry[] = [];
  private currentHistoryIndex = -1;
  private isStreaming = false;
  private streamContent = '';
  private thoughtContent = '';
  private codeContent = '';
  private thoughtModal: HTMLElement | null = null;
  private thoughtButton: HTMLElement | null = null;
  private tokenInfo: HTMLElement | null = null;
  private lastInputTokens = 0;
  private lastOutputTokens = 0;
  private lastResponseTime = 0;
  private lastTokenSpeed = 0;
  private averageTokenSpeed = 0;
  private totalSpeedMeasurements = 0;
  private cumulativeSpeed = 0;

  constructor(containerId: string) {
    logger.info('Initializing Browser UI', {
      component: 'BrowserUI',
      method: 'constructor',
      containerId,
    });

    this.container = document.getElementById(containerId) as HTMLElement;
    if (!this.container) {
      logger.error(`Container with id '${containerId}' not found`, {
        component: 'BrowserUI',
        method: 'constructor',
        containerId,
      });
      throw new Error(`Container with id '${containerId}' not found`);
    }

    this.currentState = {
      currentUrl: '',
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      title: 'Fractal',
    };

    this.initializeUI();
    this.setupEventListeners();
    this.updateUI();

    logger.info('Browser UI initialized successfully', {
      component: 'BrowserUI',
      method: 'constructor',
    });
  }

  /**
   * Initialize the browser UI components
   */
  private initializeUI(): void {
    this.container.innerHTML = `
      <div class="browser-container">
        <!-- Navigation Bar -->
        <div class="navigation-bar">
          <div class="nav-controls">
            <button id="back-btn" class="nav-btn" title="Go Back" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
            <button id="forward-btn" class="nav-btn" title="Go Forward" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
              </svg>
            </button>
            <button id="refresh-btn" class="nav-btn" title="Refresh">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
            </button>
            <button id="home-btn" class="nav-btn" title="Home">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </button>
          </div>
          
          <div class="address-bar-container">
            <input 
              id="address-bar" 
              type="text" 
              placeholder="Enter URL (e.g., google.com, facebook.com)"
              class="address-bar"
            />
            <div class="provider-selector-container">
              <select id="provider-selector" class="provider-selector">
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div id="progress-bar" class="progress-bar" style="display: none;">
          <div class="progress-fill"></div>
        </div>

        <!-- Loading Indicator -->
        <div id="loading-indicator" class="loading-indicator" style="display: none;">
          <div class="spinner"></div>
          <span class="loading-text">Generating...</span>
        </div>

        <!-- Content Area -->
        <div class="content-area">
          <iframe 
            id="content-frame" 
            class="content-frame"
            sandbox="allow-scripts allow-same-origin"
          ></iframe>
        </div>

        <!-- Status Bar -->
        <div id="status-bar" class="status-bar">
          <span class="status-text">Ready</span>
          <div class="status-actions">
            <span class="token-info" style="display: none;"></span>
            <button id="thought-button" class="thought-button" style="display: none;" title="Show AI Thought Process">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span class="thought-text">AI Thoughts</span>
            </button>
            <span class="provider-info"></span>
          </div>
        </div>

        <!-- AI Thought Modal -->
        <div id="thought-modal" class="thought-modal minimized" style="display: none;">
          <div class="thought-header">
            <div class="thought-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              AI Thought Process
            </div>
            <div class="thought-controls">
              <button class="thought-minimize" title="Minimize">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13H5v-2h14v2z"/>
                </svg>
              </button>
              <button class="thought-close" title="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="thought-body">
            <div class="thought-content"></div>
          </div>
        </div>
      </div>
    `;

    // Get references to UI elements
    this.backButton = document.getElementById('back-btn') as HTMLButtonElement;
    this.forwardButton = document.getElementById('forward-btn') as HTMLButtonElement;
    this.refreshButton = document.getElementById('refresh-btn') as HTMLButtonElement;
    this.homeButton = document.getElementById('home-btn') as HTMLButtonElement;
    this.addressBar = document.getElementById('address-bar') as HTMLInputElement;
    this.contentFrame = document.getElementById('content-frame') as HTMLIFrameElement;
    this.loadingIndicator = document.getElementById('loading-indicator') as HTMLElement;
    this.statusBar = document.getElementById('status-bar') as HTMLElement;
    this.progressBar = document.getElementById('progress-bar') as HTMLElement;
    this.providerSelector = document.getElementById('provider-selector') as HTMLSelectElement;
    this.thoughtModal = document.getElementById('thought-modal') as HTMLElement;
    this.thoughtButton = document.getElementById('thought-button') as HTMLElement;
    this.tokenInfo = this.statusBar.querySelector('.token-info') as HTMLElement;
  }

  /**
   * Set up event listeners for UI interactions
   */
  private setupEventListeners(): void {
    // Address bar events
    this.addressBar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.navigateToUrl(this.addressBar.value);
      }
    });

    this.addressBar.addEventListener('focus', () => {
      this.addressBar.select();
    });

    // Navigation button events
    this.backButton.addEventListener('click', () => this.goBack());
    this.forwardButton.addEventListener('click', () => this.goForward());
    this.refreshButton.addEventListener('click', () => this.refresh());
    this.homeButton.addEventListener('click', () => this.goHome());

    // Provider selector events
    this.providerSelector.addEventListener('change', () => {
      this.updateStatusBar(`Provider: ${this.providerSelector.value}`);
    });

    // Thought modal events
    this.thoughtButton.addEventListener('click', () => {
      this.toggleThoughtModal();
    });

    // Set up thought modal controls
    this.setupThoughtModalControls();
  }

  /**
   * Set up event listeners for thought modal controls
   */
  private setupThoughtModalControls(): void {
    if (this.thoughtModal) {
      const minimizeBtn = this.thoughtModal.querySelector('.thought-minimize');
      const closeBtn = this.thoughtModal.querySelector('.thought-close');

      minimizeBtn?.addEventListener('click', () => {
        this.minimizeThoughtModal();
      });

      closeBtn?.addEventListener('click', () => {
        this.closeThoughtModal();
      });
    }
  }

  /**
   * Toggle thought modal visibility
   */
  private toggleThoughtModal(): void {
    if (!this.thoughtModal) return;

    if (this.thoughtModal.style.display === 'none') {
      this.showThoughtModal();
    } else {
      this.minimizeThoughtModal();
    }
  }

  /**
   * Show thought modal
   */
  private showThoughtModal(): void {
    if (this.thoughtModal) {
      this.thoughtModal.style.display = 'block';
      this.thoughtModal.classList.remove('minimized');
    }
  }

  /**
   * Minimize thought modal
   */
  private minimizeThoughtModal(): void {
    if (this.thoughtModal) {
      this.thoughtModal.classList.add('minimized');
    }
  }

  /**
   * Close thought modal
   */
  private closeThoughtModal(): void {
    if (this.thoughtModal) {
      this.thoughtModal.style.display = 'none';
    }
  }

  /**
   * Navigate to a URL
   */
  public async navigateToUrl(url: string): Promise<void> {
    if (!url.trim()) {
      logger.warn('Empty URL provided for navigation', {
        component: 'BrowserUI',
        method: 'navigateToUrl',
      });
      return;
    }

    logger.navigation(url, { component: 'BrowserUI', method: 'navigateToUrl' });

    // Normalize URL
    const normalizedUrl = this.normalizeUrl(url);
    logger.debug('Normalized URL', {
      component: 'BrowserUI',
      method: 'navigateToUrl',
      originalUrl: url,
      normalizedUrl,
    });

    // Update state
    this.currentState.currentUrl = normalizedUrl;
    this.currentState.isLoading = true;
    this.currentState.error = undefined;

    // Hide token info for new navigation (but don't reset counts yet)
    this.hideTokenInfo();

    this.updateUI();
    this.showLoading(true);

    try {
      // Add to history
      const historyEntry = {
        id: window.electronAPI.utils.generateId(),
        url: normalizedUrl,
        title: this.extractDomain(normalizedUrl),
        timestamp: Date.now(),
      };
      this.addToHistory(historyEntry);
      logger.debug('Added to navigation history', {
        component: 'BrowserUI',
        method: 'navigateToUrl',
        historyEntry,
      });

      // Generate website content
      logger.info('Starting website generation', {
        component: 'BrowserUI',
        method: 'navigateToUrl',
        url: normalizedUrl,
      });
      await this.generateWebsite(normalizedUrl);

      this.currentState.isLoading = false;
      this.updateStatusBar('Ready');
      logger.info('Navigation completed successfully', {
        component: 'BrowserUI',
        method: 'navigateToUrl',
        url: normalizedUrl,
      });
    } catch (error) {
      this.currentState.isLoading = false;
      this.currentState.error = error instanceof Error ? error.message : 'Navigation failed';
      this.updateStatusBar(`Error: ${this.currentState.error}`);
      this.showError(this.currentState.error);
      logger.errorWithDetails(error instanceof Error ? error : new Error('Navigation failed'), {
        component: 'BrowserUI',
        method: 'navigateToUrl',
        url: normalizedUrl,
      });
    } finally {
      this.showLoading(false);
      this.updateUI();
    }
  }

  /**
   * Generate website content using AI
   */
  private async generateWebsite(url: string): Promise<void> {
    const provider =
      this.providerSelector.value === 'auto' ? undefined : this.providerSelector.value;

    logger.info('Starting AI website generation', {
      component: 'BrowserUI',
      method: 'generateWebsite',
      url,
      provider: provider || 'auto',
    });

    try {
      // Start streaming
      this.isStreaming = true;
      this.streamContent = '';
      this.thoughtContent = '';
      this.codeContent = '';

      // Reset token counts for new generation
      this.lastInputTokens = 0;
      this.lastOutputTokens = 0;
      this.lastResponseTime = 0;
      this.lastTokenSpeed = 0;
      this.averageTokenSpeed = 0;
      this.totalSpeedMeasurements = 0;
      this.cumulativeSpeed = 0;

      this.updateStatusBar('AI is thinking...');
      this.showThoughtButton();
      // Keep modal closed by default - user can click the thought button to open it
      this.closeThoughtModal();
      logger.debug('Streaming started', { component: 'BrowserUI', method: 'generateWebsite', url });

      await window.electronAPI.ai.streamWebsite({ url, provider }, (chunk: AIStreamChunk) => {
        this.handleStreamChunk(chunk);
      });

      // Finalize content
      this.isStreaming = false;
      logger.debug('Streaming completed, displaying content', {
        component: 'BrowserUI',
        method: 'generateWebsite',
        contentLength: this.streamContent.length,
        url,
      });

      // Display the properly extracted HTML content, not the raw stream
      if (this.codeContent) {
        this.displayContent(this.codeContent);
        this.updateStatusBar('Content generated successfully');
      } else {
        // Try to extract HTML from the final stream content as fallback
        const extractedHtml = this.extractHTMLFromContent(this.streamContent);
        if (extractedHtml) {
          this.displayContent(extractedHtml);
          this.updateStatusBar('Content generated successfully');
        } else {
          this.showError('Could not extract HTML content from AI response');
          this.updateStatusBar('Generation failed');
        }
      }
      logger.info('Website generation completed successfully', {
        component: 'BrowserUI',
        method: 'generateWebsite',
        url,
      });
    } catch (error) {
      this.isStreaming = false;
      logger.errorWithDetails(
        error instanceof Error ? error : new Error('Website generation failed'),
        {
          component: 'BrowserUI',
          method: 'generateWebsite',
          url,
        }
      );
      throw error;
    }
  }

  /**
   * Handle streaming content chunks
   */
  private handleStreamChunk(chunk: AIStreamChunk): void {
    if (chunk.content) {
      this.streamContent += chunk.content;

      logger.debug('Received stream chunk', {
        component: 'BrowserUI',
        method: 'handleStreamChunk',
        chunkSize: chunk.content.length,
        totalContentLength: this.streamContent.length,
        tokensUsed: chunk.metadata?.tokensUsed,
      });

      // Parse XML tags and update modal content
      this.parseAndUpdateContent();

      // Update progress
      if (chunk.metadata?.tokensUsed) {
        const progress = Math.min(
          (chunk.metadata.tokensUsed / AI_TOKEN_LIMITS.PROGRESS_DENOMINATOR) * 100,
          100
        );
        this.updateProgress(progress);
      }

      // Update token and timing info
      if (chunk.metadata) {
        console.log('Received chunk metadata:', chunk.metadata);
        this.lastInputTokens = chunk.metadata.inputTokens || 0;
        this.lastOutputTokens = chunk.metadata.outputTokens || 0;
        this.lastResponseTime = chunk.metadata.responseTime || 0;
        this.lastTokenSpeed = chunk.metadata.tokenSpeed || 0;

        // Track average token speed
        if (this.lastTokenSpeed > 0) {
          this.totalSpeedMeasurements++;
          this.cumulativeSpeed += this.lastTokenSpeed;
          this.averageTokenSpeed = this.cumulativeSpeed / this.totalSpeedMeasurements;
        }

        console.log('Updated token counts:', {
          input: this.lastInputTokens,
          output: this.lastOutputTokens,
          time: this.lastResponseTime,
          currentSpeed: this.lastTokenSpeed,
          averageSpeed: this.averageTokenSpeed,
        });
        this.updateTokenInfo();
      } else {
        console.log('No metadata in chunk:', chunk);
      }

      // Only display content if we have a complete HTML document
      if (this.codeContent.length > 100 && this.codeContent.includes('</html>')) {
        this.displayContent(this.codeContent);
      }
    }

    if (chunk.done) {
      logger.debug('Stream chunk marked as done', {
        component: 'BrowserUI',
        method: 'handleStreamChunk',
        finalContentLength: this.streamContent.length,
      });
      this.updateProgress(100);
      this.finalizeGeneration();
    }
  }

  /**
   * Parse XML tags from stream content and update respective sections
   */
  private parseAndUpdateContent(): void {
    // Debug: Show what we're parsing (first time only)
    if (this.streamContent.length > 500 && !this.thoughtContent && !this.codeContent) {
      console.log('==== PARSING DEBUG ====');
      console.log('Full content so far:', this.streamContent);
      console.log('Has <thinking>?', this.streamContent.includes('<thinking>'));
      console.log('Has <reasoning>?', this.streamContent.includes('<reasoning>'));
      console.log('Has <code>?', this.streamContent.includes('<code>'));
      console.log('Has DOCTYPE?', this.streamContent.includes('<!DOCTYPE'));
      console.log('=====================');
    }

    // Try XML tag parsing first
    const thinkingMatch = this.streamContent.match(/<thinking>([\s\S]*?)<\/thinking>/i);
    const reasoningMatch = this.streamContent.match(/<reasoning>([\s\S]*?)<\/reasoning>/i);
    const codeMatch = this.streamContent.match(/<code>([\s\S]*?)<\/code>/i);

    // Combine thinking and reasoning into single thought content
    let combinedThought = '';
    if (thinkingMatch) {
      combinedThought += `🤔 **Thinking**\n${thinkingMatch[1].trim()}\n\n`;
    }
    if (reasoningMatch) {
      combinedThought += `💡 **Reasoning**\n${reasoningMatch[1].trim()}`;
    }

    if (combinedThought) {
      this.thoughtContent = combinedThought;
      this.updateThoughtContent(this.thoughtContent);
    }

    if (codeMatch) {
      this.codeContent = codeMatch[1].trim();
      this.updateStatusBar('Generating HTML...');
      console.log('Found <code> tag, HTML length:', this.codeContent.length);
    } else {
      // Fallback: Extract HTML from unstructured content
      this.codeContent = this.extractHTMLFromContent(this.streamContent);
      if (this.codeContent) {
        console.log('Extracted HTML via fallback, length:', this.codeContent.length);
      }
    }
  }

  /**
   * Extract HTML content from unstructured AI response
   */
  private extractHTMLFromContent(content: string): string {
    // Only log if we haven't found HTML yet
    if (!this.codeContent) {
      console.log('Searching for HTML in content, length:', content.length);
    }

    // First, remove any AI thinking/reasoning tags and their content
    let cleanedContent = content;

    // Remove <thinking>...</thinking> blocks
    cleanedContent = cleanedContent.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');

    // Remove <reasoning>...</reasoning> blocks
    cleanedContent = cleanedContent.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');

    // Trim any leading/trailing whitespace
    cleanedContent = cleanedContent.trim();

    // Look for complete HTML documents first
    const htmlMatch = cleanedContent.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
    if (htmlMatch) {
      return htmlMatch[0];
    }

    // Look for HTML starting tag
    const htmlTagMatch = cleanedContent.match(/<html[\s\S]*?<\/html>/i);
    if (htmlTagMatch) {
      return htmlTagMatch[0];
    }

    // Look for content between ```html blocks
    const codeBlockMatch = cleanedContent.match(/```html([\s\S]*?)```/i);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // Look for content between ``` blocks (generic)
    const genericCodeMatch = cleanedContent.match(/```([\s\S]*?)```/i);
    if (genericCodeMatch) {
      const blockContent = genericCodeMatch[1].trim();
      if (blockContent.includes('<!DOCTYPE html>') || blockContent.includes('<html')) {
        return blockContent;
      }
    }

    // Try to extract HTML content by finding the start of HTML tags
    // Split content into lines and look for the first line that starts with HTML
    const lines = cleanedContent.split('\n');
    let htmlStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Look for the start of HTML content
      if (
        line.startsWith('<!DOCTYPE') ||
        line.startsWith('<html') ||
        (line.startsWith('<') && line.includes('html') && line.includes('>'))
      ) {
        htmlStartIndex = i;
        break;
      }
    }

    if (htmlStartIndex >= 0) {
      // Found HTML start, now look for the end
      const htmlLines = lines.slice(htmlStartIndex);
      let htmlEndIndex = htmlLines.length;
      let foundEndTag = false;

      for (let i = htmlLines.length - 1; i >= 0; i--) {
        const line = htmlLines[i].trim();
        if (line.includes('</html>')) {
          htmlEndIndex = i + 1;
          foundEndTag = true;
          break;
        }
      }

      let extractedHtml = htmlLines.slice(0, htmlEndIndex).join('\n');

      // If we have HTML start but no end tag, add closing tags for valid HTML during streaming
      if (!foundEndTag && extractedHtml.trim()) {
        // Check if we have opening tags that need closing
        const needsBodyClose =
          extractedHtml.includes('<body') && !extractedHtml.includes('</body>');
        const needsHtmlClose =
          (extractedHtml.includes('<html') || extractedHtml.includes('<!DOCTYPE')) &&
          !extractedHtml.includes('</html>');

        if (needsBodyClose) {
          extractedHtml += '\n</body>';
        }
        if (needsHtmlClose) {
          extractedHtml += '\n</html>';
        }

        console.log('Added closing tags for streaming HTML, length:', extractedHtml.length);
      } else if (foundEndTag) {
        console.log('Complete HTML document found, length:', extractedHtml.length);
      }

      return extractedHtml;
    }

    console.log('No complete HTML document found in content');
    return '';
  }

  /**
   * Update the thought content in the modal
   */
  private updateThoughtContent(content: string): void {
    if (this.thoughtModal) {
      const thoughtContentEl = this.thoughtModal.querySelector('.thought-content');
      if (thoughtContentEl) {
        // Convert markdown-style formatting to HTML
        const formattedContent = content
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br>');

        thoughtContentEl.innerHTML = `<p>${formattedContent}</p>`;
      }
    }
  }

  /**
   * Show the thought button in status bar
   */
  private showThoughtButton(): void {
    if (this.thoughtButton) {
      this.thoughtButton.style.display = 'flex';
    }
  }

  /**
   * Finalize the generation process
   */
  private finalizeGeneration(): void {
    // Display the final HTML content
    if (this.codeContent) {
      this.displayContent(this.codeContent);
      this.updateStatusBar('Website generated successfully');
    } else {
      // If we couldn't extract clean HTML, show an error instead of raw content
      this.showError('Could not generate clean website content. The AI response may be malformed.');
      this.updateStatusBar('Generation failed');
    }

    // Update modal with any remaining content if not structured
    if (!this.thoughtContent && this.streamContent) {
      // Extract reasoning/thinking from unstructured content
      this.extractUnstructuredMetadata(this.streamContent);
    }

    // Show final token speed information
    if (this.averageTokenSpeed > 0) {
      console.log(
        `Final average token speed: ${this.averageTokenSpeed.toFixed(2)} tokens/second (${this.totalSpeedMeasurements} measurements)`
      );
      console.log(
        `Peak token speed: ${Math.max(this.lastTokenSpeed, this.averageTokenSpeed).toFixed(2)} tokens/second`
      );
    }

    // Modal remains closed by default - user can open it by clicking the thought button if needed
  }

  /**
   * Extract reasoning and thinking from unstructured content
   */
  private extractUnstructuredMetadata(content: string): void {
    // Split content and look for explanatory text
    const lines = content.split('\n');
    let thoughtText = '';

    for (const line of lines) {
      const trimmed = line.trim();

      // Stop collecting explanatory text once we hit HTML content
      if (
        trimmed.startsWith('<!DOCTYPE') ||
        trimmed.startsWith('<html') ||
        (trimmed.startsWith('<') && trimmed.includes('>'))
      ) {
        break;
      }

      // Collect explanatory text before HTML content
      if (
        trimmed &&
        !trimmed.startsWith('<') &&
        !trimmed.startsWith('```') &&
        !trimmed.includes('DOCTYPE') &&
        trimmed.length > 5
      ) {
        // Filter out obvious HTML fragments that might have been parsed as text
        if (!this.isHtmlFragment(trimmed)) {
          thoughtText += `${trimmed}\n`;
        }
      }
    }

    if (thoughtText.trim()) {
      this.thoughtContent = `💭 **AI Explanation**\n${thoughtText.trim()}`;
      this.updateThoughtContent(this.thoughtContent);
    }
  }

  /**
   * Check if a line is likely an HTML fragment
   */
  private isHtmlFragment(text: string): boolean {
    // Check for common HTML patterns that might be parsed as text
    const htmlPatterns = [
      /^[A-Z][a-z]+ [A-Z][a-z]+$/, // "Video Title", "Channel Name"
      /^\d+[MK]? views/, // "1M views"
      /^Sign In$|^Search$|^Home$/i, // Navigation items
      /thumbnail|avatar|icon/i, // Image-related terms
      /^[A-Z][a-z]+$/, // Single capitalized words like "YouTube"
    ];

    return htmlPatterns.some((pattern) => pattern.test(text.trim()));
  }

  /**
   * Display content in the iframe
   */
  private displayContent(content: string): void {
    logger.debug('Displaying content in iframe', {
      component: 'BrowserUI',
      method: 'displayContent',
      contentLength: content.length,
    });

    // Debug: Show first part of content being displayed
    console.log('DISPLAYING CONTENT (first 500 chars):', content.substring(0, 500));

    try {
      // Sanitize and prepare content
      const sanitizedContent = this.sanitizeContent(content);
      logger.debug('Content sanitized', {
        component: 'BrowserUI',
        method: 'displayContent',
        originalLength: content.length,
        sanitizedLength: sanitizedContent.length,
      });

      // Write content to iframe
      const iframeDoc =
        this.contentFrame.contentDocument || this.contentFrame.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(sanitizedContent);
        iframeDoc.close();

        // Set up link navigation through Fractal using event delegation
        iframeDoc.addEventListener('click', (e) => {
          const target = e.target as HTMLElement;
          const link = target.closest('a[href]') as HTMLAnchorElement;

          if (link) {
            e.preventDefault();

            // Get the raw href attribute, not the resolved URL
            const rawHref = link.getAttribute('href');
            if (!rawHref) return;

            let targetUrl = rawHref;

            // If it's a relative URL, construct full URL based on current Fractal URL
            if (
              !targetUrl.startsWith('http') &&
              !targetUrl.startsWith('mailto:') &&
              !targetUrl.startsWith('tel:')
            ) {
              const currentDomain = this.extractDomain(this.currentState.currentUrl);
              if (targetUrl.startsWith('/')) {
                // Absolute path like "/contact"
                targetUrl = `https://${currentDomain}${targetUrl}`;
              } else if (!targetUrl.startsWith('#')) {
                // Relative path like "contact.html"
                targetUrl = `https://${currentDomain}/${targetUrl}`;
              }
            }

            // Only navigate if it's not a fragment/anchor link
            if (!targetUrl.startsWith('#')) {
              console.log('Fractal Navigation:', {
                rawHref,
                targetUrl,
                currentUrl: this.currentState.currentUrl,
              });
              this.navigateToUrl(targetUrl);
            }
          }
        });

        logger.debug('Content written to iframe', {
          component: 'BrowserUI',
          method: 'displayContent',
        });
      } else {
        logger.warn('Could not access iframe document', {
          component: 'BrowserUI',
          method: 'displayContent',
        });
      }

      // Update title
      const title = this.extractTitle(sanitizedContent);
      this.currentState.title = title || this.extractDomain(this.currentState.currentUrl);
      document.title = `${this.currentState.title} - Fractal`;

      logger.debug('Title updated', {
        component: 'BrowserUI',
        method: 'displayContent',
        title: this.currentState.title,
      });
    } catch (error) {
      logger.errorWithDetails(
        error instanceof Error ? error : new Error('Failed to display content'),
        {
          component: 'BrowserUI',
          method: 'displayContent',
        }
      );
      this.showError('Failed to display generated content');
    }
  }

  /**
   * Sanitize HTML content for security
   */
  private sanitizeContent(content: string): string {
    // Basic sanitization - in production, use a proper HTML sanitizer
    let sanitized = content;

    // Remove external resources that violate CSP
    sanitized = sanitized.replace(/src=["'](?!data:)/gi, 'data-src="');
    sanitized = sanitized.replace(/href=["']https?:\/\/[^"']*["']/gi, '');

    // Remove link tags that load external stylesheets
    sanitized = sanitized.replace(/<link[^>]*href=["']https?:\/\/[^"']*["'][^>]*>/gi, '');

    // Add base target for links
    sanitized = sanitized.replace(/<a\b/gi, '<a target="_blank" rel="noopener noreferrer"');

    return sanitized;
  }

  /**
   * Extract title from HTML content
   */
  private extractTitle(content: string): string {
    const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : '';
  }

  /**
   * Go back in history
   */
  public goBack(): void {
    if (this.currentHistoryIndex > 0) {
      this.currentHistoryIndex--;
      const entry = this.navigationHistory[this.currentHistoryIndex];
      if (entry) {
        this.addressBar.value = entry.url;
        this.navigateToUrl(entry.url);
      }
    }
  }

  /**
   * Go forward in history
   */
  public goForward(): void {
    if (this.currentHistoryIndex < this.navigationHistory.length - 1) {
      this.currentHistoryIndex++;
      const entry = this.navigationHistory[this.currentHistoryIndex];
      if (entry) {
        this.addressBar.value = entry.url;
        this.navigateToUrl(entry.url);
      }
    }
  }

  /**
   * Refresh current page
   */
  public refresh(): void {
    if (this.currentState.currentUrl) {
      this.navigateToUrl(this.currentState.currentUrl);
    }
  }

  /**
   * Go to home page
   */
  public goHome(): void {
    this.navigateToUrl('google.com');
  }

  /**
   * Add entry to navigation history
   */
  private addToHistory(entry: NavigationEntry): void {
    // Remove entries after current index if navigating to new URL
    if (this.currentHistoryIndex < this.navigationHistory.length - 1) {
      this.navigationHistory = this.navigationHistory.slice(0, this.currentHistoryIndex + 1);
    }

    this.navigationHistory.push(entry);
    this.currentHistoryIndex = this.navigationHistory.length - 1;

    // Limit history size
    if (this.navigationHistory.length > 100) {
      this.navigationHistory.shift();
      this.currentHistoryIndex--;
    }
  }

  /**
   * Normalize URL format
   */
  private normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace('www.', '');
    }
  }

  /**
   * Update UI based on current state
   */
  private updateUI(): void {
    // Update navigation buttons
    this.backButton.disabled = !this.currentState.canGoBack;
    this.forwardButton.disabled = !this.currentState.canGoForward;

    // Update address bar
    this.addressBar.value = this.currentState.currentUrl;

    // Update title
    document.title = this.currentState.title;
  }

  /**
   * Show/hide loading indicator
   */
  private showLoading(show: boolean): void {
    this.loadingIndicator.style.display = show ? 'flex' : 'none';
    this.progressBar.style.display = show ? 'block' : 'none';
  }

  /**
   * Update progress bar
   */
  private updateProgress(progress: number): void {
    const progressFill = this.progressBar.querySelector('.progress-fill') as HTMLElement;
    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }
  }

  /**
   * Update status bar
   */
  private updateStatusBar(message: string): void {
    const statusText = this.statusBar.querySelector('.status-text') as HTMLElement;
    if (statusText) {
      statusText.textContent = message;
    }
  }

  /**
   * Update token and timing information in status bar
   */
  private updateTokenInfo(): void {
    if (this.tokenInfo) {
      const timeInSeconds = (this.lastResponseTime / 1000).toFixed(1);

      // Build speed display text
      let speedText = '';
      if (this.lastTokenSpeed > 0) {
        speedText = ` | ${this.lastTokenSpeed.toFixed(1)} t/s`;
        if (this.averageTokenSpeed > 0 && this.totalSpeedMeasurements > 1) {
          speedText += ` (avg: ${this.averageTokenSpeed.toFixed(1)} t/s)`;
        }
      }

      const displayText = `In: ${this.lastInputTokens} | Out: ${this.lastOutputTokens} | ${timeInSeconds}s${speedText}`;
      console.log('Updating token info display:', displayText);
      this.tokenInfo.textContent = displayText;
      this.tokenInfo.style.display = 'inline';

      // Log detailed token speed information for debugging
      if (this.lastTokenSpeed > 0) {
        console.log(`Current Token Speed: ${this.lastTokenSpeed.toFixed(2)} tokens/second`);
        if (this.averageTokenSpeed > 0) {
          console.log(
            `Average Token Speed: ${this.averageTokenSpeed.toFixed(2)} tokens/second (${this.totalSpeedMeasurements} measurements)`
          );
        }
      }
    } else {
      console.log('Token info element not found!');
    }
  }

  /**
   * Hide token information
   */
  private hideTokenInfo(): void {
    if (this.tokenInfo) {
      this.tokenInfo.style.display = 'none';
    }
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.contentFrame.srcdoc = `
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
              background: #f5f5f5;
              color: #333;
            }
            .error-container {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .error-icon {
              font-size: 3rem;
              color: #e74c3c;
              margin-bottom: 1rem;
            }
            .error-message {
              font-size: 1.1rem;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <div class="error-icon">⚠️</div>
            <div class="error-message">${message}</div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Load available AI providers
   */
  public async loadProviders(): Promise<void> {
    try {
      const providers = await window.electronAPI.ai.getProviders();
      const defaultProvider = await window.electronAPI.ai.getDefaultProvider();

      // Clear existing options
      this.providerSelector.innerHTML = '<option value="auto">Auto</option>';

      // Add provider options
      providers.forEach((provider) => {
        const option = document.createElement('option');
        option.value = provider.id;
        option.textContent = provider.name;
        if (provider.id === defaultProvider) {
          option.selected = true;
        }
        this.providerSelector.appendChild(option);
      });
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  }

  /**
   * Get current browser state
   */
  public getState(): BrowserState {
    return { ...this.currentState };
  }

  /**
   * Get navigation history
   */
  public getHistory(): NavigationEntry[] {
    return [...this.navigationHistory];
  }
}
