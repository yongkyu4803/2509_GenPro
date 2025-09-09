import { z } from "zod";

// Mode schema for new mode-based rulepacks
export const ModeSchema = z.object({
  description: z.string(),
  requiredSections: z.array(z.string()),
});

// Base rulepack schema with optional modes support
export const RulepackSchema = z.object({
  id: z.string(),
  type: z.literal("formatPack"),
  requiredSections: z.array(z.string()),
  toneDefault: z.string(),
  dos: z.array(z.string()),
  donts: z.array(z.string()),
  structureHints: z.record(z.string(), z.any()),
  complianceRules: z.array(z.string()),
  // New optional modes field
  modes: z.record(z.string(), ModeSchema).optional(),
});

// Format-specific schemas
export const FormatPackSchema = RulepackSchema.extend({
  type: z.literal("formatPack"),
});

// Union type for all rulepack types (just use FormatPackSchema since there's only one type)
export const AnyRulepackSchema = FormatPackSchema;

// TypeScript types
export type Mode = z.infer<typeof ModeSchema>;
export type Rulepack = z.infer<typeof RulepackSchema>;
export type FormatPack = z.infer<typeof FormatPackSchema>;
export type AnyRulepack = z.infer<typeof AnyRulepackSchema>;

// Format enumeration
export const FormatEnum = z.enum([
  "press_release",
  "speech",
  "sns",
  "inquiry",
  "report",
  "media_scraping",
]);

export type Format = z.infer<typeof FormatEnum>;

// Validation level enumeration
export const ValidationLevelEnum = z.enum([
  "basic",
  "intermediate",
  "advanced",
]);
export type ValidationLevel = z.infer<typeof ValidationLevelEnum>;

// Token limits configuration
export const TokenLimitsSchema = z.object({
  basic: z.number().default(300),
  intermediate: z.number().default(600),
  advanced: z.number().default(900),
});

export type TokenLimits = z.infer<typeof TokenLimitsSchema>;

// Structure hints types
export interface StructureHint {
  maxLines?: number;
  maxCharacters?: number;
  keyPoints?: string;
  format?: string;
  description?: string;
  requirements?: string[];
  structure?: string;
  perspectives?: string[];
  actionItems?: string;
  timeline?: string;
  includes?: string[];
  purpose?: string;
  examples?: string[];
  maxCount?: number;
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    format: Format;
    level: ValidationLevel;
    tokenCount: number;
    rulepackVersion: string;
  };
}

// User input schema (from frontend)
export const UserInputSchema = z.object({
  topic: z.string().min(1, "주제를 입력해주세요").max(200, "주제는 200자 이내로 입력해주세요"),
  format: FormatEnum,
  level: ValidationLevelEnum,
  context: z.string().max(500, "배경정보는 500자 이내로 입력해주세요").optional(),
  tone: z.string().optional().default("public_official_v1"),
  mode: z.string().optional(), // For rulepacks that support modes
  additionalRequirements: z.array(z.string().max(100)).max(5, "추가 요구사항은 최대 5개까지 가능합니다").optional(),
  options: z.object({
    includeWarnings: z.boolean().default(true),
    strictMode: z.boolean().default(false),
    customTone: z.string().max(50).optional(),
  }).optional(),
});

export type UserInput = z.infer<typeof UserInputSchema>;

// Internal prompt request schema (for API processing)
export const PromptRequestSchema = z.object({
  format: FormatEnum,
  level: ValidationLevelEnum,
  topic: z.string().min(1, "Topic is required"),
  context: z.string().optional(),
  tone: z.string().optional(),
  mode: z.string().optional(), // For mode-based rulepacks
  additionalRequirements: z.array(z.string()).optional(),
  options: z.object({
    includeWarnings: z.boolean().default(true),
    strictMode: z.boolean().default(false),
    customTone: z.string().optional(),
  }).optional(),
});

export type PromptRequest = z.infer<typeof PromptRequestSchema>;

// Prompt generation response schema
export const PromptResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    prompt: z.string(),
    metadata: z.object({
      format: FormatEnum,
      level: ValidationLevelEnum,
      tokenCount: z.number(),
      estimatedOutputTokens: z.number(),
      rulepackId: z.string(),
      toneUsed: z.string(),
      generatedAt: z.string(),
      processingTime: z.number(), // milliseconds
      requestId: z.string(),
    }),
    validation: z.object({
      passed: z.boolean(),
      score: z.number().min(0).max(100), // percentage
      checklist: z.array(z.object({
        category: z.string(),
        items: z.array(z.object({
          description: z.string(),
          passed: z.boolean(),
          severity: z.enum(["error", "warning", "info"]),
        })),
      })),
      warnings: z.array(z.string()).optional(),
      suggestions: z.array(z.string()).optional(),
    }),
    rulepack: z.object({
      id: z.string(),
      version: z.string(),
      requiredSections: z.array(z.string()),
      complianceRules: z.array(z.string()),
    }),
  }),
});

export type PromptResponse = z.infer<typeof PromptResponseSchema>;

// Error response schema
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
    timestamp: z.string(),
    requestId: z.string().optional(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// API response union type
export const APIResponseSchema = z.union([PromptResponseSchema, ErrorResponseSchema]);
export type APIResponse = z.infer<typeof APIResponseSchema>;

// Rate limiting schema
export const RateLimitSchema = z.object({
  limit: z.number(),
  remaining: z.number(),
  reset: z.number(), // timestamp
  retryAfter: z.number().optional(), // seconds
});

export type RateLimit = z.infer<typeof RateLimitSchema>;

// Request metadata schema
export const RequestMetadataSchema = z.object({
  requestId: z.string(),
  timestamp: z.string(),
  userAgent: z.string().optional(),
  ip: z.string().optional(),
  sessionId: z.string().optional(),
  processingTime: z.number().optional(),
});

export type RequestMetadata = z.infer<typeof RequestMetadataSchema>;
