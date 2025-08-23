/**
 * Application constants and configuration
 */

import type { AIModel, AnthropicModel, GoogleModel, OpenAIModel } from './types';

// Application Info
export const APP_NAME = 'Fractal';
export const APP_VERSION = '0.0.1';
export const APP_DESCRIPTION =
  'AI-powered web browser that generates website content using Large Language Models';

// Default Configuration
export const DEFAULT_CONFIG = {
  maxHistoryEntries: 100,
  enableStreaming: true,
  theme: 'system' as const,
  defaultProvider: 'openai',
  security: {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
} as const;

// AI Provider Configuration
export const AI_PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI GPT-4',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-0125',
      'o1',
      'o3',
      'o3-mini',
    ] as const,
    defaultModel: 'gpt-4o' as const,
    envKey: 'OPENAI_API_KEY',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-haiku-20240307',
      'claude-3-5-sonnet-latest',
      'claude-3-opus-latest',
      'claude-3-5-haiku-latest',
      'claude-3-5-sonnet-20240620',
      'claude-3-5-haiku-20241022',
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514',
      'claude-3-7-sonnet-20250219',
    ] as const,
    defaultModel: 'claude-sonnet-4-20250514' as const,
    envKey: 'ANTHROPIC_API_KEY',
  },
  google: {
    id: 'google',
    name: 'Google Gemini',
    models: [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-pro',
      'gemini-pro-vision',
    ] as const,
    defaultModel: 'gemini-1.5-flash' as const,
    envKey: 'GOOGLE_API_KEY',
  },
} as const;

// Website Templates (for reference only - no hardcoded prompts)
export const WEBSITE_TEMPLATES = [
  {
    type: 'search' as const,
    name: 'Search Engine',
    description: 'Google-like search interface',
  },
  {
    type: 'social' as const,
    name: 'Social Media',
    description: 'Social networking platform',
  },
  {
    type: 'news' as const,
    name: 'News Website',
    description: 'News and media outlet',
  },
  {
    type: 'ecommerce' as const,
    name: 'E-commerce Store',
    description: 'Online shopping platform',
  },
  {
    type: 'blog' as const,
    name: 'Blog Platform',
    description: 'Personal or corporate blog',
  },
  {
    type: 'corporate' as const,
    name: 'Corporate Website',
    description: 'Business or organization site',
  },
  {
    type: 'wiki' as const,
    name: 'Wiki/Encyclopedia',
    description: 'Wikipedia and wiki-style sites',
  },
] as const;

// IPC Channel Names
export const IPC_CHANNELS = {
  GENERATE_WEBSITE: 'generate-website',
  STREAM_WEBSITE: 'stream-website',
  NAVIGATE: 'navigate',
  GO_BACK: 'go-back',
  GO_FORWARD: 'go-forward',
  REFRESH: 'refresh',
  GET_HISTORY: 'get-history',
  CLEAR_HISTORY: 'clear-history',
  GET_CONFIG: 'get-config',
  UPDATE_CONFIG: 'update-config',
} as const;

// Error Codes
export const ERROR_CODES = {
  INVALID_URL: 'INVALID_URL',
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  API_KEY_MISSING: 'API_KEY_MISSING',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CONTENT_GENERATION_FAILED: 'CONTENT_GENERATION_FAILED',
  NAVIGATION_ERROR: 'NAVIGATION_ERROR',
} as const;

// UI Constants
export const UI_CONSTANTS = {
  MIN_WINDOW_WIDTH: 800,
  MIN_WINDOW_HEIGHT: 600,
  DEFAULT_WINDOW_WIDTH: 1200,
  DEFAULT_WINDOW_HEIGHT: 800,
  ADDRESS_BAR_HEIGHT: 40,
  NAVIGATION_BAR_HEIGHT: 50,
  STATUS_BAR_HEIGHT: 25,
} as const;

// Development Constants
export const DEV_CONSTANTS = {
  HOT_RELOAD_PORT: 5173,
  DEV_TOOLS: process.env.NODE_ENV === 'development' && process.env.ENABLE_DEVTOOLS !== 'false',
  LOG_LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
} as const;

// Security Constants
export const SECURITY_CONSTANTS = {
  CSP_POLICY:
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http: blob: *; font-src 'self' data: https: http:; connect-src 'self' https: http:; media-src 'self' data: https: http:; object-src 'none';",
  ALLOWED_PROTOCOLS: ['http:', 'https:'],
  MAX_URL_LENGTH: 2048,
} as const;

// Performance Constants
export const PERFORMANCE_CONSTANTS = {
  MAX_CACHE_SIZE: 100,
  CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours
  STREAM_CHUNK_DELAY: 50, // ms
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
} as const;

// AI Token Limits
export const AI_TOKEN_LIMITS = {
  DEFAULT_MAX_TOKENS: 4000,
  STREAMING_MAX_TOKENS: 60000, // Safe limit for Claude Sonnet 4 (max 64000)
  PROGRESS_DENOMINATOR: 60000, // For progress calculation
} as const;

// Type assertions to ensure constants match our type definitions
type AssertOpenAIModels = (typeof AI_PROVIDERS.openai.models)[number] extends OpenAIModel
  ? true
  : never;
type AssertAnthropicModels = (typeof AI_PROVIDERS.anthropic.models)[number] extends AnthropicModel
  ? true
  : never;
type AssertGoogleModels = (typeof AI_PROVIDERS.google.models)[number] extends GoogleModel
  ? true
  : never;
type AssertDefaultModels = typeof AI_PROVIDERS.openai.defaultModel extends OpenAIModel
  ? true
  : never | typeof AI_PROVIDERS.anthropic.defaultModel extends AnthropicModel
    ? true
    : never | typeof AI_PROVIDERS.google.defaultModel extends GoogleModel
      ? true
      : never;

// These will cause compilation errors if the constants don't match our types
const _typeCheck: AssertOpenAIModels = true;
const _typeCheck2: AssertAnthropicModels = true;
const _typeCheck3: AssertGoogleModels = true;
const _typeCheck4: AssertDefaultModels = true;
