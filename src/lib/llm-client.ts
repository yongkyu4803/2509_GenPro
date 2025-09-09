import OpenAI from 'openai';
import { 
  type Format, 
  type ValidationLevel,
  type RequestMetadata
} from '@/types/rulepack';

// LLM Configuration
interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  timeout: number; // milliseconds
}

// LLM Request
interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  format: Format;
  level: ValidationLevel;
  requestId: string;
  metadata?: RequestMetadata;
}

// LLM Response
interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    reasoningTokens?: number; // GPT-5 specific reasoning tokens
  };
  model: string;
  finishReason: string;
  responseTime: number; // milliseconds
}

// Error types
export class LLMError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class LLMTimeoutError extends LLMError {
  constructor(timeout: number) {
    super(`LLM request timed out after ${timeout}ms`, 'TIMEOUT');
  }
}

export class LLMRateLimitError extends LLMError {
  constructor(retryAfter?: number) {
    super('LLM rate limit exceeded', 'RATE_LIMIT', { retryAfter });
  }
}

export class LLMTokenLimitError extends LLMError {
  constructor(requested: number, limit: number) {
    super(`Token limit exceeded: ${requested} > ${limit}`, 'TOKEN_LIMIT', {
      requested,
      limit,
    });
  }
}

export class LLMClient {
  private openai: OpenAI;
  private config: LLMConfig;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.config = {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '2000'),
      topP: parseFloat(process.env.LLM_TOP_P || '1'),
      frequencyPenalty: parseFloat(process.env.LLM_FREQUENCY_PENALTY || '0'),
      presencePenalty: parseFloat(process.env.LLM_PRESENCE_PENALTY || '0'),
      timeout: parseInt(process.env.LLM_TIMEOUT || '60000'), // 60 seconds
    };
  }

  /**
   * Generate content using OpenAI API
   */
  async generateContent(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      // Validate token limits
      this.validateTokenLimits(request);

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new LLMTimeoutError(this.config.timeout));
        }, this.config.timeout);
      });

      // Create OpenAI request with model-specific parameters
      const requestParams: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: request.systemPrompt,
          },
          {
            role: 'user',
            content: request.userPrompt,
          },
        ],
        stream: false,
      };

      // Add model-specific parameters
      if (this.config.model.includes('gpt-5')) {
        // GPT-5 only supports temperature: 1 (default), other parameters not supported
        requestParams.temperature = 1;
      } else {
        // GPT-4 and earlier support all parameters
        requestParams.temperature = this.config.temperature;
        requestParams.top_p = this.config.topP;
        requestParams.frequency_penalty = this.config.frequencyPenalty;
        requestParams.presence_penalty = this.config.presencePenalty;
      }

      // Add model-specific token parameter
      if (this.config.model.includes('gpt-5')) {
        // GPT-5 uses max_completion_tokens instead of max_tokens
        // New allocation: Input 700 + Reasoning 2000 + Output 800 = Total 2800 completion tokens
        requestParams.max_completion_tokens = 2800; // 2000 reasoning + 800 output
        requestParams.reasoning_effort = 'minimal'; // Minimal reasoning to maximize actual content
        // Remove verbosity parameter as it might be causing issues
      } else {
        // GPT-4 and earlier use max_tokens
        requestParams.max_tokens = this.getMaxTokensForLevel(request.level);
      }

      // Log the actual request parameters for debugging
      console.log(
        `[${request.requestId}] OpenAI Request Params:`,
        JSON.stringify(
          {
            model: requestParams.model,
            reasoning_effort: (requestParams as any).reasoning_effort,
            max_tokens: (requestParams as any).max_tokens,
            max_completion_tokens: (requestParams as any).max_completion_tokens,
            temperature: (requestParams as any).temperature,
          },
          null,
          2
        )
      );

      const openaiPromise = this.openai.chat.completions.create(requestParams);

      // Race between API call and timeout
      const completion = await Promise.race([openaiPromise, timeoutPromise]);

      const responseTime = Date.now() - startTime;

      // Log the complete OpenAI response for debugging
      console.log(`[${request.requestId}] Full OpenAI Response:`, JSON.stringify({
        choices: completion.choices,
        usage: completion.usage,
        model: completion.model,
        finish_reasons: completion.choices?.map(c => c.finish_reason)
      }, null, 2));

      // Extract response data
      const choice = completion.choices[0];
      if (!choice) {
        throw new LLMError('No completion choices returned', 'NO_CHOICES');
      }

      const content = choice.message?.content;
      console.log(`[${request.requestId}] Choice Content:`, content);
      console.log(`[${request.requestId}] Choice Finish Reason:`, choice.finish_reason);
      
      if (!content) {
        throw new LLMError(`No content in completion response. Finish reason: ${choice.finish_reason}`, 'NO_CONTENT');
      }

      return {
        content,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
          // Handle GPT-5 reasoning tokens if available
          reasoningTokens: completion.usage?.completion_tokens_details?.reasoning_tokens || 0,
        },
        model: completion.model,
        finishReason: choice.finish_reason || 'unknown',
        responseTime,
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Handle specific OpenAI errors
      if (error instanceof OpenAI.APIError) {
        // Log detailed error information for debugging
        console.error(`[${request.requestId}] OpenAI API Error:`, {
          status: error.status,
          message: error.message,
          type: error.type,
          code: error.code
        });

        if (error.status === 429) {
          const retryAfter = error.headers?.['retry-after'] 
            ? parseInt(error.headers['retry-after']) 
            : undefined;
          throw new LLMRateLimitError(retryAfter);
        }

        if (error.status === 400 && error.message.includes('tokens')) {
          throw new LLMTokenLimitError(0, this.config.maxTokens);
        }

        // Handle invalid model error more specifically
        if (error.status === 400 && (error.message.includes('model') || error.message.includes('invalid'))) {
          throw new LLMError(
            `OpenAI API error: ${error.message} - Model '${this.config.model}' may not be available`,
            'INVALID_MODEL',
            {
              status: error.status,
              type: error.type,
              model: this.config.model,
              responseTime,
            }
          );
        }

        throw new LLMError(
          `OpenAI API error: ${error.message}`,
          `OPENAI_${error.status || 'UNKNOWN'}`,
          {
            status: error.status,
            type: error.type,
            responseTime,
          }
        );
      }

      // Handle timeout errors
      if (error instanceof LLMTimeoutError) {
        throw error;
      }

      // Handle other errors
      throw new LLMError(
        `LLM request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REQUEST_FAILED',
        { responseTime }
      );
    }
  }

  /**
   * Validate token limits based on level
   */
  private validateTokenLimits(request: LLMRequest): void {
    // New GPT-5 allocation: fixed 700 tokens for input
    const maxInputTokens = 700;
    const estimatedPromptTokens = this.estimateTokens(
      request.systemPrompt + request.userPrompt
    );

    if (estimatedPromptTokens > maxInputTokens) {
      throw new LLMTokenLimitError(estimatedPromptTokens, maxInputTokens);
    }
  }

  /**
   * Get max tokens for validation level
   */
  private getMaxTokensForLevel(level: ValidationLevel): number {
    const tokenLimits = {
      basic: parseInt(process.env.NEXT_PUBLIC_TOKEN_LIMIT_BASIC || '300'),
      intermediate: parseInt(process.env.NEXT_PUBLIC_TOKEN_LIMIT_INTERMEDIATE || '600'),
      advanced: parseInt(process.env.NEXT_PUBLIC_TOKEN_LIMIT_ADVANCED || '900'),
    };

    return tokenLimits[level] || 600;
  }

  /**
   * Estimate token count (approximation for Korean text)
   */
  private estimateTokens(text: string): number {
    // Korean text: approximately 1 token per 2-3 characters
    // English text: approximately 1 token per 4 characters
    // Mixed text: use conservative estimate
    return Math.ceil(text.length / 2.5);
  }

  /**
   * Get current configuration
   */
  getConfig(): LLMConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Test connectivity and API key
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.openai.models.list();
      return response.data.length > 0;
    } catch (error) {
      console.error('LLM connection test failed:', error);
      return false;
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.openai.models.list();
      return response.data
        .filter(model => model.id.includes('gpt'))
        .map(model => model.id)
        .sort();
    } catch (error) {
      console.error('Failed to get available models:', error);
      return ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'];
    }
  }
}

// Singleton instance
let llmClientInstance: LLMClient | null = null;

export function getLLMClient(): LLMClient {
  if (!llmClientInstance) {
    llmClientInstance = new LLMClient();
  }
  return llmClientInstance;
}

// Export for testing
export function resetLLMClient(): void {
  llmClientInstance = null;
}
