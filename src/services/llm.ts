/**
 * Main LLM Service that orchestrates AI provider interactions
 * Uses smaller focused services for better separation of concerns
 */

import { generateText } from 'ai';
import { AI_TOKEN_LIMITS, ERROR_CODES } from '../shared/constants';
import { logger } from '../shared/logger';
import { AIError, type AIRequest, type AIResponse } from '../shared/types';
import { CacheService } from './cache';
import { PromptService } from './prompt';
import { ProviderService } from './provider';
import { StreamingService } from './streaming';

export class LLMService {
  private providerService: ProviderService;
  private cacheService: CacheService;
  private promptService: PromptService;
  private streamingService: StreamingService;

  constructor() {
    logger.info('Initializing LLM Service', { component: 'LLMService', method: 'constructor' });

    this.providerService = new ProviderService();
    this.cacheService = new CacheService();
    this.promptService = new PromptService();
    this.streamingService = new StreamingService(this.providerService);

    logger.info('LLM Service initialized successfully', {
      component: 'LLMService',
      method: 'constructor',
    });
  }

  /**
   * Get available providers
   */
  public getProviders() {
    return this.providerService.getProviders();
  }

  /**
   * Get default provider
   */
  public getDefaultProvider(): string {
    return this.providerService.getDefaultProvider();
  }

  /**
   * Check if any providers are available
   */
  public hasProviders(): boolean {
    return this.providerService.hasProviders();
  }

  /**
   * Get provider status
   */
  public getProviderStatus() {
    return this.providerService.getProviderStatus();
  }

  /**
   * Generate website content using AI
   */
  public async generateWebsite(request: AIRequest): Promise<AIResponse> {
    const { url, provider = this.getDefaultProvider(), options = {} } = request;
    const requestId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info('Starting website generation', {
      component: 'LLMService',
      method: 'generateWebsite',
      url,
      provider,
      requestId,
    });

    // Check cache first
    const cacheKey = this.cacheService.generateCacheKey(url, provider, options);
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Validate provider
    const aiProvider = this.providerService.validateProvider(provider);

    logger.aiRequest(provider, aiProvider.model, url, {
      component: 'LLMService',
      method: 'generateWebsite',
      requestId,
    });

    // Generate prompt based on URL
    const prompt = this.promptService.generatePrompt(url);
    logger.debug('Generated prompt', {
      component: 'LLMService',
      method: 'generateWebsite',
      promptLength: prompt.length,
      requestId,
    });

    try {
      const startTime = Date.now();

      logger.debug('Calling AI provider', {
        component: 'LLMService',
        method: 'generateWebsite',
        provider,
        requestId,
      });

      const result = await generateText({
        model: this.providerService.getModelForProvider(provider, aiProvider.model),
        prompt,
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || AI_TOKEN_LIMITS.DEFAULT_MAX_TOKENS,
      });

      const responseTime = Date.now() - startTime;
      logger.aiResponse(provider, result.usage?.totalTokens, responseTime, {
        component: 'LLMService',
        method: 'generateWebsite',
        requestId,
      });

      const response: AIResponse = {
        content: result.text,
        provider: aiProvider.id,
        model: aiProvider.model,
        timestamp: Date.now(),
        metadata: {
          tokensUsed: result.usage?.totalTokens,
          responseTime,
        },
      };

      logger.debug('Generated content', {
        component: 'LLMService',
        method: 'generateWebsite',
        contentLength: result.text.length,
        requestId,
      });

      // Cache the response
      this.cacheService.set(cacheKey, response);

      logger.info('Website generation completed successfully', {
        component: 'LLMService',
        method: 'generateWebsite',
        url,
        provider,
        requestId,
      });

      return response;
    } catch (error) {
      logger.errorWithDetails(error instanceof Error ? error : new Error('Unknown error'), {
        component: 'LLMService',
        method: 'generateWebsite',
        url,
        provider,
        requestId,
      });
      throw new AIError(
        `Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.CONTENT_GENERATION_FAILED,
        provider
      );
    }
  }

  /**
   * Stream website content generation
   */
  public async *streamWebsite(request: AIRequest) {
    const { url, provider = this.getDefaultProvider(), options = {} } = request;

    // Generate prompt based on URL
    const prompt = this.promptService.generatePrompt(url);

    // Delegate to streaming service
    yield* this.streamingService.streamWebsite(url, provider, prompt, options);
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cacheService.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return this.cacheService.getStats();
  }

  /**
   * Get available website templates
   */
  public getAvailableTemplates() {
    return this.promptService.getAvailableTemplates();
  }

  /**
   * Get template by type
   */
  public getTemplateByType(type: string) {
    return this.promptService.getTemplateByType(type);
  }
}
