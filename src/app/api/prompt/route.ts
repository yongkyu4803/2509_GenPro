import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { ZodError } from 'zod';

import { 
  UserInputSchema, 
  type UserInput,
  type PromptResponse,
  type ErrorResponse,
  ErrorResponseSchema
} from '@/types/rulepack';

import { getRulepack } from '@/lib/rulepack-loader';
import { getLLMClient } from '@/lib/llm-client';
import { getTokenGuard } from '@/lib/token-guard';
import { getRateLimiter, RequestIdentifier, createRateLimitHeaders } from '@/lib/rate-limiter';
import PromptGenerator from '@/lib/prompt-generator';

// Runtime configuration for Node.js (required for file system access)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const requestId = uuidv4();
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Initialize components
  const rateLimiter = getRateLimiter();
  const tokenGuard = getTokenGuard();
  const llmClient = getLLMClient();

  // Extract request metadata
  const ip = RequestIdentifier.getIP(request.headers);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const sessionId = RequestIdentifier.getUserId(request.headers);

  console.log(`[${requestId}] API request started`, {
    ip: ip.slice(0, -2) + 'XX', // Mask last 2 digits for privacy
    userAgent: userAgent.slice(0, 50),
    timestamp,
  });

  try {
    // 1. Rate limiting check
    const rateLimitChecks = [
      { identifier: ip, configName: 'default' },
      { identifier: ip, configName: 'burst' },
    ];

    if (sessionId) {
      rateLimitChecks.push({ identifier: sessionId, configName: 'default' });
    }

    const rateLimitResult = await rateLimiter.checkMultipleLimits(rateLimitChecks);
    
    if (!rateLimitResult.allowed) {
      const errorResponse: ErrorResponse = ErrorResponseSchema.parse({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          timestamp,
          requestId,
        },
      });

      console.log(`[${requestId}] Rate limit exceeded`, {
        ip: ip.slice(0, -2) + 'XX',
        limit: rateLimitResult.mostRestrictive.limit,
        remaining: rateLimitResult.mostRestrictive.remaining,
        retryAfter: rateLimitResult.mostRestrictive.retryAfter,
      });

      const headers = createRateLimitHeaders(rateLimitResult.mostRestrictive);
      return NextResponse.json(errorResponse, { 
        status: 429, 
        headers: headers,
      });
    }

    // 2. Parse and validate request body
    let userInput: UserInput;
    try {
      const body = await request.json();
      userInput = UserInputSchema.parse(body);
    } catch (error) {
      const errorResponse: ErrorResponse = ErrorResponseSchema.parse({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: error instanceof ZodError 
            ? `입력 검증 실패: ${error.issues.map((e) => e.message).join(', ')}`
            : '잘못된 요청 형식입니다.',
          details: error instanceof ZodError ? { errors: error.issues } : undefined,
          timestamp,
          requestId,
        },
      });

      console.log(`[${requestId}] Input validation failed`, { error });
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 3. Load rulepack
    const rulepack = await getRulepack(userInput.format);
    if (!rulepack) {
      const errorResponse: ErrorResponse = ErrorResponseSchema.parse({
        success: false,
        error: {
          code: 'RULEPACK_NOT_FOUND',
          message: `지원하지 않는 형식입니다: ${userInput.format}`,
          timestamp,
          requestId,
        },
      });

      console.log(`[${requestId}] Rulepack not found`, { format: userInput.format });
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 4. Generate system and user prompts
    const systemPrompt = PromptGenerator.generateSystemPrompt({
      rulepack,
      format: userInput.format,
      level: userInput.level,
      tone: userInput.tone || 'public_official_v1',
      ...(userInput.mode ? { mode: userInput.mode } : {}),
      additionalRequirements: userInput.additionalRequirements || [],
      strictMode: userInput.options?.strictMode || false,
    });

    const userPrompt = PromptGenerator.generateUserPrompt({
      format: userInput.format,
      level: userInput.level,
      topic: userInput.topic,
      ...(userInput.context ? { context: userInput.context } : {}),
      ...(userInput.tone ? { tone: userInput.tone } : {}),
      ...(userInput.mode ? { mode: userInput.mode } : {}),
      ...(userInput.additionalRequirements && userInput.additionalRequirements.length
        ? { additionalRequirements: userInput.additionalRequirements }
        : {}),
      options: userInput.options,
    });

    // 5. Token guard check
    const tokenResult = await tokenGuard.checkTokenLimits(
      systemPrompt,
      userPrompt,
      userInput.format,
      userInput.level,
      {
        requestId,
        timestamp,
        ip,
        userAgent,
        sessionId: sessionId || undefined,
      }
    );

    if (!tokenResult.allowed) {
      const errorResponse: ErrorResponse = ErrorResponseSchema.parse({
        success: false,
        error: {
          code: 'TOKEN_LIMIT_EXCEEDED',
          message: `토큰 한도를 초과했습니다. ${tokenResult.suggestions.join(' ')}`,
          details: {
            tokenCount: tokenResult.usage.promptTokens,
            limit: tokenResult.limit,
            suggestions: tokenResult.suggestions,
          },
          timestamp,
          requestId,
        },
      });

      console.log(`[${requestId}] Token limit exceeded`, {
        usage: tokenResult.usage.promptTokens,
        limit: tokenResult.limit,
      });

      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 6. Generate customized prompt using LLM
    console.log(`[${requestId}] Generating topic-customized prompt via LLM:`, {
      topic: userInput.topic,
      format: userInput.format,
      level: userInput.level,
    });
    
    const llmResponse = await llmClient.generateContent({
      systemPrompt,
      userPrompt,
      format: userInput.format,
      level: userInput.level,
      requestId,
      metadata: {
        requestId,
        timestamp,
        ip,
        userAgent,
        sessionId: sessionId || undefined,
      },
    });

    // 7. Validate generated prompt (if warnings enabled)
    let validationResults;
    if (userInput.options?.includeWarnings !== false) {
      validationResults = await PromptGenerator.validatePrompt(
        llmResponse.content,
        userInput.format,
        userInput.level
      );
    }

    // 8. Log actual token usage
    await tokenGuard.logActualUsage(
      requestId,
      llmResponse.usage,
      llmResponse.responseTime
    );

    // 9. Prepare response
    const processingTime = Date.now() - startTime;
    
    const response: PromptResponse = {
      success: true,
      data: {
        prompt: llmResponse.content,
        metadata: {
          format: userInput.format,
          level: userInput.level,
          tokenCount: llmResponse.usage.promptTokens,
          estimatedOutputTokens: llmResponse.usage.completionTokens,
          rulepackId: rulepack.id,
          toneUsed: userInput.tone || 'public_official_v1',
          generatedAt: timestamp,
          processingTime,
          requestId,
        },
        validation: validationResults ? {
          passed: validationResults.validation.isValid && validationResults.checklist.score >= 80,
          score: validationResults.overallScore,
          checklist: validationResults.checklist.passed.map(item => ({
            category: 'general',
            items: [{
              description: item,
              passed: true,
              severity: 'info' as const,
            }],
          })),
          warnings: [
            ...validationResults.validation.warnings,
            ...(validationResults.checklist.score < 80 ? ['일부 체크리스트 항목이 통과하지 못했습니다.'] : []),
          ],
          suggestions: validationResults.validation.errors.length > 0 
            ? ['내용을 검토하고 수정해보세요.'] 
            : undefined,
        } : {
          passed: true,
          score: 100,
          checklist: [],
        },
        rulepack: {
          id: rulepack.id,
          version: 'v1',
          requiredSections: rulepack.requiredSections,
          complianceRules: rulepack.complianceRules,
        },
      },
    };

    console.log(`[${requestId}] Topic-customized prompt generated successfully`, {
      topic: userInput.topic,
      format: userInput.format,
      level: userInput.level,
      tokenUsage: llmResponse.usage.totalTokens,
      processingTime,
      promptValidationScore: validationResults?.overallScore || 100,
    });

    // Add rate limit headers to successful responses
    const headers = createRateLimitHeaders(rateLimitResult.mostRestrictive);
    return NextResponse.json(response, { headers });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error(`[${requestId}] Request failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorResponse: ErrorResponse = ErrorResponseSchema.parse({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        details: process.env.NODE_ENV === 'development' ? {
          error: error instanceof Error ? error.message : 'Unknown error',
        } : undefined,
        timestamp,
        requestId,
      },
    });

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      message: 'National Assembly Prompt Generator API - Generates PROMPTS for content creation, not content itself',
      purpose: 'Creates reusable prompts that can be used with any LLM to generate actual content',
      version: '1.0.0',
      endpoints: {
        prompt: 'POST /api/prompt - Generate prompts for content creation',
        rulepack: 'GET /api/rulepack - Get format rulepack information',
        validate: 'POST /api/validate - Validate generated prompts',
        checklist: 'GET /api/checklist - Get validation checklist',
        health: 'GET /api/health - Health check',
      },
      formats: ['press_release', 'speech', 'sns', 'inquiry', 'report', 'media_scraping'],
      levels: ['basic', 'intermediate', 'advanced'],
      usage: 'Input: topic + format + level → Output: Ready-to-use prompt for other AI systems',
    },
  });
}
