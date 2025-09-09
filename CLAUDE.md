# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **PromptLab for Assembly Aides** (국회 보좌진용 프롬프트 생성기) - a Next.js application that generates high-quality **PROMPTS** for Korean National Assembly staff. 

**CRITICAL**: This system does NOT generate actual content (보도자료/연설문/SNS). Instead, it generates **reusable prompts** that instruct other AI systems to create such content. 

**Flow**: User inputs topic + format + level → System generates a prompt → User copies prompt to use with any LLM

## Technology Stack

- **Framework**: Next.js 15.5.2 with App Router and TypeScript (strict mode)
- **Runtime**: React 19.1.0 with React DOM 19.1.0
- **Styling**: Tailwind CSS v4 with PostCSS
- **Deployment**: Vercel with Edge and Node runtime separation
- **Development**: ESLint, TypeScript strict mode

## Common Development Commands

```bash
# Development server with Turbopack
npm run dev

# Build application with Turbopack
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Architecture Overview

### Runtime Separation Strategy

The application uses a dual-runtime architecture optimized for different operation types:

- **Edge Runtime** (`/api/prompt`): Single-step, low-latency operations for basic prompt generation
- **Node Runtime** (`/api/prompt-advanced`): Multi-step operations including normalization, generation, validation, and rewriting

### Directory Structure

```
/app
  /api
    /prompt            # Edge: Single generation path
    /prompt-advanced   # Node: Multi-step with rewriting
/lib
  llm.ts              # Model client/call wrapper
  tokens.ts           # Token counting/budget guards
  logger.ts           # Structured logging
  rate-limit.ts       # Rate limiting
  validate.ts         # Zod schemas
  checklist.ts        # Check/rewrite triggers
  rulepacks.ts        # Rulepack loader
/rulepacks
  /format/*.yaml      # Format-specific rules
  /level/*.yaml       # Level guides
  /tone/*.yaml        # Tone packs
  /compliance/*.yaml  # Compliance rules
/specs/*.schema.yaml  # Validation schemas
/tests
  unit/*.test.ts      # Unit tests
  api/*.test.ts       # API tests
```

### Core Architectural Principles

1. **Template vs LLM Delegation**:
   - **Templates**: Fixed format rules, level guides, tone packs, compliance rules, output schemas
   - **LLM**: Variable topic interpretation, component prioritization, instruction articulation

2. **Token Governance**: 3-stage budget management (input, processing, output) with strict limits
   - Basic: ≤300 tokens
   - Intermediate: ≤600 tokens
   - Advanced: ≤900 tokens

3. **Quality Gates**: 8-step validation cycle with automatic rewriting (max 1 attempt)

## Key Configuration Files

### TypeScript Configuration

- **Path Alias**: `@/*` maps to `./src/*`
- **Strict Mode**: Enabled with comprehensive type checking
- **Module Resolution**: Uses bundler strategy for Next.js

### ESLint Configuration

- Extends `next/core-web-vitals` and `next/typescript`
- Uses modern flat config with compatibility layer
- Ignores build output directories

## Important Business Rules

### Prompt Generation Pipeline

**IMPORTANT**: Each step generates instructions for creating content, NOT the content itself.

1. **Input Collection**: topic, format, level, modelType, tone, extras
2. **Normalization**: Extract domain/key messages/stakeholders/risks for prompt context
3. **Rulepack Loading**: Apply format + level + tone + compliance rules to prompt structure
4. **Generation**: Create reusable prompt that instructs AI to create content (no actual content)
5. **Validation**: Check if generated text is a proper prompt (has role, instructions, format guidelines)
6. **Auto-rewrite**: Maximum 1 attempt if prompt validation fails

**Output Example**: "당신은 보도자료 작성 전문가입니다. 다음 주제로 보도자료를 작성하세요..."

### Content Types & Requirements

#### Press Releases (보도자료)

- Required sections: headline, subhead, lede, body, quote, contact
- Must include specific numbers/sources, avoid exaggeration
- Compliance: fact-checking required, source attribution

#### Speeches (연설문)

- Structure: hooking → problem → vision → policy → appeal/thanks
- Advanced features: applause points, rebuttal bridges
- Length varies by level with pacing considerations

#### Social Media (SNS)

- Platform constraints (character limits, link policies)
- Multiple variants for A/B testing
- CTA/hashtag policies with advertising content filters

#### Inquiry Documents (질의서 작성)

- Required sections: purpose, background, questions, response format, deadline, legal basis
- Structured question numbering, specific deadlines
- Must include relevant law/regulation references and follow-up plans

#### Reports (보고서 작성)

- Required sections: summary, background, analysis, conclusion, appendix
- Multi-perspective analysis (current status, issues, alternatives)
- Objective tone with evidence-based recommendations

#### Media Scraping (언론보도 스크랩)

- Required sections: keywords, scope, analysis criteria, summary format, trends
- Systematic keyword combinations with search operators
- Structured analysis with sentiment classification and trend identification

### Security & Compliance

- API keys server-side only, no client exposure
- PII masking in logs and error messages
- Enhanced verification requirements for sensitive topics (politics/medical/financial)
- Forbidden expressions: unsourced claims, exaggerations, vague subjects

## Development Guidelines

### API Design Patterns

**⚠️ CRITICAL: All API implementations must strictly follow `prd&rules/RULES.md` and `prd&rules/ENGINEERING_RULES.md`**

- Use Zod schemas for request/response validation (exact schemas defined in ENGINEERING_RULES.md)
- Implement structured error responses with request IDs (format specified in RULES.md)
- Rate limiting: 30 req/min per IP, 60 req/min per user (as mandated in ENGINEERING_RULES.md)
- Comprehensive logging with JSON format (fields specified in ENGINEERING_RULES.md)
- **MANDATORY**: Follow exact prompt generation pipeline from RULES.md (6-step process)
- **MANDATORY**: Implement token governance as specified (input < 300, output by level)
- **MANDATORY**: Edge/Node runtime separation as documented

### Environment Variables

```
OPENAI_API_KEY=          # Required: OpenAI API key
KV_URL=                  # Optional: KV store for rate limiting
RULEPACKS_BASE_URL=      # Optional: Remote rulepack loading
```

### Testing Strategy

**⚠️ MANDATORY: Follow exact testing requirements from `prd&rules/TASKS.md` and `prd&rules/ENGINEERING_RULES.md`**

- **Unit Tests**: Schema validation, rulepack loading, checklist validation (as specified in ENGINEERING_RULES.md)
- **API Tests**: Happy path, validation failures, rate limiting (test cases defined in TASKS.md)
- **Snapshot Tests**: 10 representative cases across format/level matrix (exact cases specified in TASKS.md)
- **Regression Tests**: Mandatory for rulepack changes (checklist validation required)
- **REQUIRED**: All tests must validate compliance with Korean documentation standards
- **REQUIRED**: Performance tests must verify P50 < 1.5s (Edge), P95 < 3s targets

### Performance Requirements

- **SLO**: P50 < 1.5s (Edge), P95 < 3s
- **Token Budget**: Average < 900 tokens per request
- **Rate Limits**: Prevent abuse while maintaining usability

## **MANDATORY COMPLIANCE REQUIREMENTS**

⚠️ **ALL CODE AND DECISIONS MUST STRICTLY ADHERE TO THE DOCUMENTATION IN `prd&rules/` DIRECTORY**

### Required Documentation Compliance

The following Korean documentation files are **MANDATORY** and take precedence over general development practices:

- **`prd&rules/prd.md`** (**HIGHEST PRIORITY**): Product Requirements Document - defines system behavior, business rules, and acceptance criteria
- **`prd&rules/RULES.md`** (**CRITICAL**): Product operation rules, quality standards, and pipeline requirements - must be followed exactly
- **`prd&rules/ENGINEERING_RULES.md`** (**ESSENTIAL**): Technical implementation guidelines, coding standards, and architecture decisions
- **`prd&rules/TASKS.md`** (**REQUIRED**): Project management structure, testing requirements, and delivery standards

### Compliance Hierarchy

1. **Business Rules** (`prd.md` + `RULES.md`) override technical preferences
2. **Engineering Standards** (`ENGINEERING_RULES.md`) override general coding practices
3. **Process Requirements** (`TASKS.md`) override default development workflows
4. **Korean Documentation** takes precedence over English documentation when conflicts arise

### Enforcement Policy

- **ALL** feature development must align with PRD specifications
- **ALL** code must follow the exact patterns defined in ENGINEERING_RULES.md
- **ALL** API contracts must match RULES.md pipeline requirements
- **VIOLATION** of these guidelines is considered a critical error

**Before making ANY changes, developers must:**

1. Review relevant sections in `prd&rules/` documentation
2. Ensure full compliance with specified requirements
3. Follow the exact token budgets, validation cycles, and quality gates defined

## Quality Standards

### Code Quality

- TypeScript strict mode with no implicit any
- ESLint + Prettier standard configuration
- Conventional Commits for version control
- Error handling with proper error codes

### Content Quality

- All user-facing text in Korean
- No generic responses or explanations in prompt output
- Compliance with Korean public communication standards
- Mandatory fact-checking and source attribution requirements

### Performance Monitoring

- Request ID tracking for all operations
- Token usage monitoring with budget enforcement
- Response time tracking with SLO adherence
- Warning/error rate monitoring for quality assurance
