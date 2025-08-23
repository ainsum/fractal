/**
 * Shared type definitions for the Fractal application
 */

// AI SDK Provider Types
// Type-safe model names based on AI SDK documentation
export type OpenAIModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-0125'
  | 'o1'
  | 'o3'
  | 'o3-mini';

export type AnthropicModel =
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-haiku-20240307'
  | 'claude-3-5-sonnet-latest'
  | 'claude-3-opus-latest'
  | 'claude-3-5-haiku-latest'
  | 'claude-3-5-sonnet-20240620'
  | 'claude-3-5-haiku-20241022'
  | 'claude-opus-4-20250514'
  | 'claude-sonnet-4-20250514'
  | 'claude-3-7-sonnet-20250219';

export type GoogleModel =
  | 'gemini-1.5-flash'
  | 'gemini-1.5-pro'
  | 'gemini-2.0-flash'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite'
  | 'gemini-pro'
  | 'gemini-pro-vision';

export type AIModel = OpenAIModel | AnthropicModel | GoogleModel;

export interface AIProvider {
  id: string;
  name: string;
  apiKey: string;
  model: AIModel;
  enabled: boolean;
}

export interface AIRequest {
  url: string;
  provider: string;
  model?: AIModel;
  options?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  };
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  timestamp: number;
  metadata?: {
    tokensUsed?: number;
    inputTokens?: number;
    outputTokens?: number;
    responseTime?: number;
  };
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
  metadata?: {
    tokensUsed?: number;
    inputTokens?: number;
    outputTokens?: number;
    responseTime?: number;
    tokenSpeed?: number; // tokens per second - calculated in real-time during streaming
  };
}

// Navigation Types
export interface NavigationEntry {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  content?: string;
  provider?: string;
}

export interface NavigationHistory {
  entries: NavigationEntry[];
  currentIndex: number;
  maxEntries: number;
}

export interface BrowserState {
  currentUrl: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  title: string;
  error?: string;
}

// IPC Message Types
export interface IPCRequest {
  id: string;
  type: string;
  payload: any;
}

export interface IPCResponse {
  id: string;
  type: string;
  payload: any;
  error?: string;
}

export interface GenerateWebsiteRequest extends IPCRequest {
  type: 'generate-website';
  payload: {
    url: string;
    provider?: string;
    options?: AIRequest['options'];
  };
}

export interface GenerateWebsiteResponse extends IPCResponse {
  type: 'generate-website-response';
  payload: {
    content: string;
    provider: string;
    model: string;
    metadata?: AIResponse['metadata'];
  };
}

export interface StreamWebsiteRequest extends IPCRequest {
  type: 'stream-website';
  payload: {
    url: string;
    provider?: string;
    options?: AIRequest['options'];
  };
}

export interface StreamWebsiteChunk extends IPCResponse {
  type: 'stream-website-chunk';
  payload: {
    content: string;
    done: boolean;
    metadata?: AIStreamChunk['metadata'];
  };
}

// App Configuration Types
export interface AppConfig {
  providers: AIProvider[];
  defaultProvider: string;
  maxHistoryEntries: number;
  enableStreaming: boolean;
  theme: 'light' | 'dark' | 'system';
  security: {
    contextIsolation: boolean;
    nodeIntegration: boolean;
    sandbox: boolean;
  };
}

// Error Types
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export class NavigationError extends Error {
  constructor(
    message: string,
    public url: string,
    public code: string
  ) {
    super(message);
    this.name = 'NavigationError';
  }
}

// Environment Variables Type
export interface EnvironmentVariables {
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

// Website Generation Types
export interface WebsiteTemplate {
  type: 'search' | 'social' | 'news' | 'ecommerce' | 'blog' | 'corporate' | 'wiki' | 'other';
  name: string;
  description: string;
}

export interface GeneratedWebsite {
  html: string;
  css: string;
  javascript: string;
  metadata: {
    title: string;
    description: string;
    keywords: string[];
    author?: string;
  };
}
