import { 
  type Format, 
  type ValidationLevel,
  type RequestMetadata,
  TokenLimitsSchema
} from '@/types/rulepack';

// Token usage tracking
interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number; // in USD
}

// Token guard configuration
interface TokenGuardConfig {
  limits: {
    basic: number;
    intermediate: number;
    advanced: number;
  };
  pricing: {
    gpt4oMini: {
      input: number;  // per 1M tokens
      output: number; // per 1M tokens
    };
  };
  warningThreshold: number; // percentage
  logAllRequests: boolean;
}

// Token guard result
interface TokenGuardResult {
  allowed: boolean;
  usage: TokenUsage;
  limit: number;
  remaining: number;
  warnings: string[];
  suggestions: string[];
}

export class TokenGuard {
  private config: TokenGuardConfig;

  constructor() {
    this.config = {
      limits: TokenLimitsSchema.parse({
        basic: parseInt(process.env.NEXT_PUBLIC_TOKEN_LIMIT_BASIC || '300'),
        intermediate: parseInt(process.env.NEXT_PUBLIC_TOKEN_LIMIT_INTERMEDIATE || '600'),
        advanced: parseInt(process.env.NEXT_PUBLIC_TOKEN_LIMIT_ADVANCED || '900'),
      }),
      pricing: {
        gpt4oMini: {
          input: 0.00015,  // $0.15 per 1M tokens
          output: 0.0006,  // $0.60 per 1M tokens
        },
      },
      warningThreshold: 0.8, // 80%
      logAllRequests: process.env.NODE_ENV === 'development',
    };
  }

  /**
   * Check if request is within token limits
   */
  async checkTokenLimits(
    systemPrompt: string,
    userPrompt: string,
    format: Format,
    level: ValidationLevel,
    metadata: RequestMetadata
  ): Promise<TokenGuardResult> {
    const startTime = Date.now();

    // Estimate input tokens
    const promptTokens = this.estimateTokens(systemPrompt + userPrompt);
    const limit = this.config.limits[level];
    
    // Reserve tokens for completion (20% for prompt generation, 80% for prompt content)
    const reservedTokens = Math.floor(limit * 0.2);
    const maxPromptTokens = limit - reservedTokens;

    // Check if prompt exceeds limit
    const allowed = promptTokens <= maxPromptTokens;
    const remaining = Math.max(0, maxPromptTokens - promptTokens);

    // Estimate completion tokens
    const estimatedCompletionTokens = this.estimateCompletionTokens(format, level);
    const totalEstimatedTokens = promptTokens + estimatedCompletionTokens;

    // Calculate estimated cost
    const estimatedCost = this.calculateCost(promptTokens, estimatedCompletionTokens);

    const usage: TokenUsage = {
      promptTokens,
      completionTokens: estimatedCompletionTokens,
      totalTokens: totalEstimatedTokens,
      estimatedCost,
    };

    // Generate warnings and suggestions
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!allowed) {
      warnings.push(`프롬프트 토큰이 ${level} 레벨 한도를 초과했습니다 (${promptTokens}/${maxPromptTokens})`);
      suggestions.push('주제를 더 간결하게 작성해보세요');
      suggestions.push('배경 정보를 줄여보세요');
      
      if (level !== 'basic') {
        const lowerLevel = level === 'advanced' ? 'intermediate' : 'basic';
        suggestions.push(`${lowerLevel} 레벨로 변경해보세요`);
      }
    } else if (promptTokens > maxPromptTokens * this.config.warningThreshold) {
      warnings.push(`토큰 사용량이 높습니다 (${promptTokens}/${maxPromptTokens})`);
      suggestions.push('더 나은 성능을 위해 내용을 줄여보세요');
    }

    if (totalEstimatedTokens > limit * 0.9) {
      warnings.push(`예상 총 토큰이 한도에 가깝습니다 (${totalEstimatedTokens}/${limit})`);
    }

    // Log request
    await this.logTokenUsage({
      requestId: metadata.requestId,
      format,
      level,
      usage,
      limit,
      allowed,
      warnings: warnings.length,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });

    return {
      allowed,
      usage,
      limit,
      remaining,
      warnings,
      suggestions,
    };
  }

  /**
   * Estimate token count for text
   */
  private estimateTokens(text: string): number {
    if (!text) return 0;
    
    // More accurate estimation for Korean + English mixed text
    const koreanChars = (text.match(/[\u3130-\u318F\uAC00-\uD7AF]/g) || []).length;
    const englishChars = text.length - koreanChars;
    
    // Korean: ~2.5 chars per token, English: ~4 chars per token
    const koreanTokens = Math.ceil(koreanChars / 2.5);
    const englishTokens = Math.ceil(englishChars / 4);
    
    return koreanTokens + englishTokens;
  }

  /**
   * Estimate completion tokens based on format and level
   */
  private estimateCompletionTokens(format: Format, level: ValidationLevel): number {
    const baseEstimates = {
      press_release: { basic: 150, intermediate: 250, advanced: 350 },
      speech: { basic: 200, intermediate: 300, advanced: 450 },
      sns: { basic: 50, intermediate: 100, advanced: 150 },
      inquiry: { basic: 180, intermediate: 280, advanced: 400 },
      report: { basic: 250, intermediate: 400, advanced: 550 },
      media_scraping: { basic: 120, intermediate: 200, advanced: 300 },
    };

    return baseEstimates[format]?.[level] || 200;
  }

  /**
   * Calculate estimated cost
   */
  private calculateCost(inputTokens: number, outputTokens: number): number {
    const { input, output } = this.config.pricing.gpt4oMini;
    
    const inputCost = (inputTokens / 1_000_000) * input;
    const outputCost = (outputTokens / 1_000_000) * output;
    
    return inputCost + outputCost;
  }

  /**
   * Log actual token usage after LLM response
   */
  async logActualUsage(
    requestId: string,
    actualUsage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    },
    responseTime: number
  ): Promise<void> {
    const actualCost = this.calculateCost(
      actualUsage.promptTokens, 
      actualUsage.completionTokens
    );

    await this.logTokenUsage({
      requestId,
      type: 'actual',
      usage: {
        ...actualUsage,
        estimatedCost: actualCost,
      },
      processingTime: responseTime,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log token usage for monitoring
   */
  private async logTokenUsage(logData: Record<string, unknown>): Promise<void> {
    if (this.config.logAllRequests) {
      console.log('[TokenGuard]', JSON.stringify(logData, null, 2));
    }

    // In production, this would send to logging service
    // await sendToLoggingService('token_usage', logData);
  }

  /**
   * Get current limits
   */
  getLimits(): { basic: number; intermediate: number; advanced: number } {
    return { ...this.config.limits };
  }

  /**
   * Get token statistics for format/level combination
   */
  async getTokenStats(
    format: Format, 
    level: ValidationLevel
  ): Promise<{
    averagePromptTokens: number;
    averageCompletionTokens: number;
    averageTotalTokens: number;
    averageCost: number;
    requestCount: number;
  }> {
    // In production, this would query actual usage data
    // For now, return estimated values
    const estimatedCompletion = this.estimateCompletionTokens(format, level);
    const averagePrompt = Math.floor(this.config.limits[level] * 0.3);
    
    return {
      averagePromptTokens: averagePrompt,
      averageCompletionTokens: estimatedCompletion,
      averageTotalTokens: averagePrompt + estimatedCompletion,
      averageCost: this.calculateCost(averagePrompt, estimatedCompletion),
      requestCount: 0, // Would be actual count from logs
    };
  }

  /**
   * Optimize prompt to fit within token limits
   */
  optimizePrompt(
    prompt: string, 
    targetTokens: number
  ): { optimizedPrompt: string; tokensSaved: number } {
    const originalTokens = this.estimateTokens(prompt);
    
    if (originalTokens <= targetTokens) {
      return { optimizedPrompt: prompt, tokensSaved: 0 };
    }

    // Simple optimization strategies
    let optimized = prompt;
    
    // Remove extra whitespace
    optimized = optimized.replace(/\s+/g, ' ').trim();
    
    // Truncate if still too long
    const targetRatio = targetTokens / originalTokens;
    if (this.estimateTokens(optimized) > targetTokens) {
      const targetLength = Math.floor(optimized.length * targetRatio * 0.9);
      optimized = optimized.substring(0, targetLength) + '...';
    }

    const finalTokens = this.estimateTokens(optimized);
    const tokensSaved = originalTokens - finalTokens;

    return { optimizedPrompt: optimized, tokensSaved };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<TokenGuardConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current configuration
   */
  getConfig(): TokenGuardConfig {
    return { ...this.config };
  }
}

// Singleton instance
let tokenGuardInstance: TokenGuard | null = null;

export function getTokenGuard(): TokenGuard {
  if (!tokenGuardInstance) {
    tokenGuardInstance = new TokenGuard();
  }
  return tokenGuardInstance;
}

// Export for testing
export function resetTokenGuard(): void {
  tokenGuardInstance = null;
}