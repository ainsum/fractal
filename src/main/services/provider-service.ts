/**
 * Provider Service for managing AI providers and their configuration
 */

import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { AI_PROVIDERS, ERROR_CODES } from '../../shared/constants';
import { logger } from '../../shared/logger';
import { AIError, type AIProvider, type EnvironmentVariables } from '../../shared/types';

export class ProviderService {
  private providers: Map<string, AIProvider> = new Map();
  private environment: EnvironmentVariables;

  constructor() {
    logger.info('Initializing Provider Service', {
      component: 'ProviderService',
      method: 'constructor',
    });
    this.environment = this.loadEnvironmentVariables();
    this.initializeProviders();
    logger.info('Provider Service initialized successfully', {
      component: 'ProviderService',
      method: 'constructor',
      providersCount: this.providers.size,
    });
  }

  /**
   * Load environment variables for API keys
   */
  private loadEnvironmentVariables(): EnvironmentVariables {
    logger.debug('Loading environment variables', {
      component: 'ProviderService',
      method: 'loadEnvironmentVariables',
    });

    const env = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      NODE_ENV: (process.env.NODE_ENV as EnvironmentVariables['NODE_ENV']) || 'development',
    };

    logger.debug('Environment variables loaded', {
      component: 'ProviderService',
      method: 'loadEnvironmentVariables',
      hasOpenAI: !!env.OPENAI_API_KEY,
      hasAnthropic: !!env.ANTHROPIC_API_KEY,
      hasGoogle: !!env.GOOGLE_API_KEY,
      nodeEnv: env.NODE_ENV,
    });

    return env;
  }

  /**
   * Initialize AI providers with API keys
   */
  private initializeProviders(): void {
    logger.debug('Initializing AI providers', {
      component: 'ProviderService',
      method: 'initializeProviders',
    });

    // Initialize OpenAI
    if (this.environment.OPENAI_API_KEY) {
      logger.debug('Initializing OpenAI provider', {
        component: 'ProviderService',
        method: 'initializeProviders',
        provider: 'openai',
      });
      this.providers.set('openai', {
        id: 'openai',
        name: AI_PROVIDERS.openai.name,
        apiKey: this.environment.OPENAI_API_KEY,
        model: AI_PROVIDERS.openai.defaultModel,
        enabled: true,
      });
    } else {
      logger.warn('OpenAI API key not found', {
        component: 'ProviderService',
        method: 'initializeProviders',
        provider: 'openai',
      });
    }

    // Initialize Anthropic
    if (this.environment.ANTHROPIC_API_KEY) {
      logger.debug('Initializing Anthropic provider', {
        component: 'ProviderService',
        method: 'initializeProviders',
        provider: 'anthropic',
      });
      this.providers.set('anthropic', {
        id: 'anthropic',
        name: AI_PROVIDERS.anthropic.name,
        apiKey: this.environment.ANTHROPIC_API_KEY,
        model: AI_PROVIDERS.anthropic.defaultModel,
        enabled: true,
      });
    } else {
      logger.warn('Anthropic API key not found', {
        component: 'ProviderService',
        method: 'initializeProviders',
        provider: 'anthropic',
      });
    }

    // Initialize Google
    if (this.environment.GOOGLE_API_KEY) {
      logger.debug('Initializing Google provider', {
        component: 'ProviderService',
        method: 'initializeProviders',
        provider: 'google',
      });
      this.providers.set('google', {
        id: 'google',
        name: AI_PROVIDERS.google.name,
        apiKey: this.environment.GOOGLE_API_KEY,
        model: AI_PROVIDERS.google.defaultModel,
        enabled: true,
      });
    } else {
      logger.warn('Google API key not found', {
        component: 'ProviderService',
        method: 'initializeProviders',
        provider: 'google',
      });
    }

    if (this.providers.size === 0) {
      logger.error('No AI providers configured. Please set up API keys.', {
        component: 'ProviderService',
        method: 'initializeProviders',
      });
    } else {
      logger.info(`Initialized ${this.providers.size} AI provider(s)`, {
        component: 'ProviderService',
        method: 'initializeProviders',
        providers: Array.from(this.providers.keys()),
      });
    }
  }

  /**
   * Get available providers
   */
  public getProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get a specific provider by ID
   */
  public getProvider(providerId: string): AIProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Get default provider
   */
  public getDefaultProvider(): string {
    const providers = this.getProviders();
    if (providers.length === 0) {
      throw new AIError('No providers available', ERROR_CODES.API_KEY_MISSING);
    }
    return providers[0].id;
  }

  /**
   * Check if any providers are available
   */
  public hasProviders(): boolean {
    return this.providers.size > 0;
  }

  /**
   * Get provider status
   */
  public getProviderStatus(): { [key: string]: { configured: boolean; hasApiKey: boolean } } {
    const status: { [key: string]: { configured: boolean; hasApiKey: boolean } } = {};

    for (const [id, provider] of this.providers) {
      status[id] = {
        configured: true,
        hasApiKey: !!provider.apiKey,
      };
    }

    return status;
  }

  /**
   * Get model for specific provider
   */
  public getModelForProvider(provider: string, defaultModel: string): any {
    switch (provider) {
      case 'openai':
        return openai(defaultModel);
      case 'anthropic':
        return anthropic(defaultModel);
      case 'google':
        return google(defaultModel);
      default:
        throw new AIError(
          `Unsupported provider: ${provider}`,
          ERROR_CODES.AI_PROVIDER_ERROR,
          provider
        );
    }
  }

  /**
   * Validate provider exists and has API key
   */
  public validateProvider(providerId: string): AIProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new AIError(
        `Provider ${providerId} not found`,
        ERROR_CODES.AI_PROVIDER_ERROR,
        providerId
      );
    }
    if (!provider.apiKey) {
      throw new AIError(
        `API key not configured for provider ${providerId}`,
        ERROR_CODES.API_KEY_MISSING,
        providerId
      );
    }
    return provider;
  }
}
