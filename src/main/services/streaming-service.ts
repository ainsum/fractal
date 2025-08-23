/**
 * Streaming Service for handling AI streaming responses
 */

import { streamText } from 'ai';
import { AI_TOKEN_LIMITS, ERROR_CODES } from '../../shared/constants';
import { logger } from '../../shared/logger';
import { AIError, type AIStreamChunk } from '../../shared/types';
import type { ProviderService } from './provider-service';

export class StreamingService {
  constructor(private providerService: ProviderService) {
    logger.info('Initializing Streaming Service', {
      component: 'StreamingService',
      method: 'constructor',
    });
  }

  /**
   * Stream website content generation
   */
  public async *streamWebsite(
    url: string,
    provider: string,
    prompt: string,
    options: { temperature?: number; maxTokens?: number } = {}
  ): AsyncGenerator<AIStreamChunk> {
    const requestId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info('Starting website streaming', {
      component: 'StreamingService',
      method: 'streamWebsite',
      url,
      provider,
      requestId,
    });

    // Check if any providers are available
    if (!this.providerService.hasProviders()) {
      logger.error('No AI providers configured', {
        component: 'StreamingService',
        method: 'streamWebsite',
        requestId,
      });
      throw new AIError(
        'No AI providers configured. Please set up API keys.',
        ERROR_CODES.API_KEY_MISSING
      );
    }

    // Validate provider
    const aiProvider = this.providerService.validateProvider(provider);

    logger.aiRequest(provider, aiProvider.model, url, {
      component: 'StreamingService',
      method: 'streamWebsite',
      requestId,
    });

    logger.debug('Generated prompt for streaming', {
      component: 'StreamingService',
      method: 'streamWebsite',
      promptLength: prompt.length,
      requestId,
    });

    try {
      const startTime = Date.now();
      let totalTokens = 0;
      let inputTokens = 0;
      let outputTokens = 0;
      let chunkCount = 0;
      let hasReceivedContent = false;
      let lastChunkTime = startTime;
      let lastOutputTokens = 0;
      let totalSpeedMeasurements = 0;
      let cumulativeSpeed = 0;

      logger.debug('Starting AI stream', {
        component: 'StreamingService',
        method: 'streamWebsite',
        provider,
        requestId,
      });

      const stream = streamText({
        model: this.providerService.getModelForProvider(provider, aiProvider.model),
        prompt,
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || AI_TOKEN_LIMITS.STREAMING_MAX_TOKENS,
      });

      // Debug: Log available stream properties
      logger.debug('Stream object properties:', {
        component: 'StreamingService',
        method: 'streamWebsite',
        properties: Object.keys(stream),
        requestId,
      });

      // Estimate input tokens from prompt (rough estimate: 1 token = 4 characters)
      inputTokens = Math.ceil(prompt.length / 4);

      // Try different stream types to see which one actually has data
      try {
        for await (const chunk of stream.fullStream) {
          chunkCount++;

          // Debug: Log the actual chunk structure
          logger.debug('Raw fullStream chunk received', {
            component: 'StreamingService',
            method: 'streamWebsite',
            chunkType: typeof chunk,
            chunkCount,
            requestId,
          });

          // Handle different chunk types from fullStream
          let textDelta = '';
          if (chunk.type === 'text-delta') {
            textDelta = chunk.text;
          } else if (chunk.type === 'finish') {
            // Check if we have usage information in the finish chunk
            if (chunk.totalUsage) {
              inputTokens = chunk.totalUsage.inputTokens || inputTokens;
              outputTokens = chunk.totalUsage.outputTokens || outputTokens;
              totalTokens = chunk.totalUsage.totalTokens || inputTokens + outputTokens;
              logger.debug('Updated token counts from finish chunk', {
                component: 'StreamingService',
                method: 'streamWebsite',
                inputTokens,
                outputTokens,
                totalTokens,
                requestId,
              });
            }
            logger.debug('Stream finished', {
              component: 'StreamingService',
              method: 'streamWebsite',
              requestId,
              usage: chunk.totalUsage,
            });
            break;
          } else if (chunk.type === 'error') {
            logger.error('Stream error received', {
              component: 'StreamingService',
              method: 'streamWebsite',
              requestId,
              error: chunk,
            });
            throw new AIError(
              'An error occurred while generating content.',
              ERROR_CODES.CONTENT_GENERATION_FAILED
            );
          } else {
            logger.debug(`Ignoring chunk type: ${chunk.type}`, {
              component: 'StreamingService',
              method: 'streamWebsite',
              requestId,
            });
            continue;
          }

          if (textDelta.length > 0) {
            hasReceivedContent = true;
            // Estimate output tokens from the text delta
            const deltaTokens = Math.ceil(textDelta.length / 4);
            outputTokens += deltaTokens;
            totalTokens = inputTokens + outputTokens;

            // Calculate token speed (tokens per second)
            const currentTime = Date.now();
            const timeSinceLastChunk = (currentTime - lastChunkTime) / 1000; // Convert to seconds
            const tokensSinceLastChunk = outputTokens - lastOutputTokens;
            const tokenSpeed =
              timeSinceLastChunk > 0 ? tokensSinceLastChunk / timeSinceLastChunk : 0;

            // Track average speed
            if (tokenSpeed > 0) {
              totalSpeedMeasurements++;
              cumulativeSpeed += tokenSpeed;
            }

            // Update tracking variables
            lastChunkTime = currentTime;
            lastOutputTokens = outputTokens;

            logger.streamChunk(textDelta.length, totalTokens, {
              component: 'StreamingService',
              method: 'streamWebsite',
              chunkCount,
              requestId,
            });

            yield {
              content: textDelta,
              done: false,
              metadata: {
                tokensUsed: totalTokens,
                inputTokens: inputTokens,
                outputTokens: outputTokens,
                responseTime: Date.now() - startTime,
                tokenSpeed: tokenSpeed,
              },
            };
          } else {
            // Log empty chunks at trace level to avoid spam
            logger.trace(`Empty chunk received (chunk ${chunkCount})`, {
              component: 'StreamingService',
              method: 'streamWebsite',
              chunkCount,
              requestId,
            });
          }
        }
      } catch (streamError) {
        logger.error('Error with fullStream, falling back to textStream', {
          component: 'StreamingService',
          method: 'streamWebsite',
          error: streamError,
          requestId,
        });

        // Fallback to textStream
        for await (const chunk of stream.textStream) {
          chunkCount++;
          const textDelta = chunk || '';

          if (textDelta.length > 0) {
            hasReceivedContent = true;
            const deltaTokens = Math.ceil(textDelta.length / 4);
            outputTokens += deltaTokens;
            totalTokens = inputTokens + outputTokens;

            // Calculate token speed (tokens per second)
            const currentTime = Date.now();
            const timeSinceLastChunk = (currentTime - lastChunkTime) / 1000; // Convert to seconds
            const tokensSinceLastChunk = outputTokens - lastOutputTokens;
            const tokenSpeed =
              timeSinceLastChunk > 0 ? tokensSinceLastChunk / timeSinceLastChunk : 0;

            // Track average speed
            if (tokenSpeed > 0) {
              totalSpeedMeasurements++;
              cumulativeSpeed += tokenSpeed;
            }

            // Update tracking variables
            lastChunkTime = currentTime;
            lastOutputTokens = outputTokens;

            logger.streamChunk(textDelta.length, totalTokens, {
              component: 'StreamingService',
              method: 'streamWebsite',
              chunkCount,
              requestId,
            });

            yield {
              content: textDelta,
              done: false,
              metadata: {
                tokensUsed: totalTokens,
                inputTokens: inputTokens,
                outputTokens: outputTokens,
                responseTime: Date.now() - startTime,
                tokenSpeed: tokenSpeed,
              },
            };
          }
        }
      }

      // Check if we received any content
      if (!hasReceivedContent) {
        logger.warn('No content received from AI provider', {
          component: 'StreamingService',
          method: 'streamWebsite',
          provider,
          totalChunks: chunkCount,
          requestId,
        });
      }

      // Calculate average token speed
      const averageTokenSpeed =
        totalSpeedMeasurements > 0 ? cumulativeSpeed / totalSpeedMeasurements : 0;

      // Final chunk
      logger.info('Streaming completed', {
        component: 'StreamingService',
        method: 'streamWebsite',
        totalChunks: chunkCount,
        totalTokens,
        hasContent: hasReceivedContent,
        responseTime: Date.now() - startTime,
        averageTokenSpeed: averageTokenSpeed.toFixed(2),
        requestId,
      });

      // Send final chunk with updated token information
      yield {
        content: '',
        done: true,
        metadata: {
          tokensUsed: totalTokens,
          inputTokens: inputTokens,
          outputTokens: outputTokens,
          responseTime: Date.now() - startTime,
          tokenSpeed: averageTokenSpeed, // Average speed for final chunk
        },
      };
    } catch (error) {
      logger.errorWithDetails(error instanceof Error ? error : new Error('Unknown error'), {
        component: 'StreamingService',
        method: 'streamWebsite',
        url,
        provider,
        requestId,
      });
      throw new AIError(
        `Failed to stream content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.CONTENT_GENERATION_FAILED,
        provider
      );
    }
  }
}
