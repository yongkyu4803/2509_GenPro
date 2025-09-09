import { ChecklistLoader } from './checklist-loader';
import { ContentValidator } from './validation';
import { 
  type Format, 
  type ValidationLevel, 
  type PromptRequest,
  type AnyRulepack 
} from '@/types/rulepack';

export interface SystemPromptConfig {
  rulepack: AnyRulepack;
  format: Format;
  level: ValidationLevel;
  tone: string;
  mode?: string; // Optional mode for rulepack modes
  additionalRequirements?: string[];
  strictMode?: boolean;
}

export class PromptGenerator {
  /**
   * Generate system prompt that instructs LLM to create topic-customized prompts
   */
  static generateSystemPrompt(config: SystemPromptConfig): string {
    const { rulepack, format, level, mode, additionalRequirements = [], strictMode = false } = config;

    const tokenLimit = this.getTokenLimitForLevel(level);
    const formatName = this.getFormatDisplayName(format);
    const levelName = this.getLevelDisplayName(level);
    
    // Get required sections based on mode (if available) or fallback to default
    const requiredSections = this.getRequiredSectionsForMode(rulepack, mode);
    
    const sections = [
      `당신은 한국 국회 보좌진용 프롬프트 생성 전문가입니다.`,
      `사용자가 제시한 주제와 조건을 분석하여, 해당 주제에 특화된 ${formatName} 작성용 프롬프트를 생성하세요.`,
      '',
      `📋 ${formatName} 기본 구조:`,
      `${requiredSections.map(s => `• ${this.getSectionDisplayName(s)}`).join('\n')}`,
      '',
      `✅ 작성 원칙:`,
      `${rulepack.dos.map(d => `• ${d}`).join('\n')}`,
      '',
      `❌ 금지사항:`,
      `${rulepack.donts.map(d => `• ${d}`).join('\n')}`,
      '',
      `🎯 프롬프트 생성 지침:`,
      `1. 주제를 분석하여 해당 분야의 특성을 파악하세요`,
      `2. 주제에 맞는 전문적 역할을 정의하세요 (예: "디지털정책 전문가", "환경정책 분석가")`,
      `3. 해당 분야에서 중요한 구체적 질문들을 포함하세요`,
      `4. 주제 관련 전문 용어나 고려사항을 명시하세요`,
      `5. ${levelName} 수준에 맞는 작성 가이드를 제시하세요`,
      `6. ${tokenLimit}토큰 이내 작성 지침을 포함하세요`,
    ];

    if (rulepack.complianceRules && rulepack.complianceRules.length > 0) {
      sections.push(``, `🔒 준수사항:`);
      rulepack.complianceRules.forEach(rule => {
        sections.push(`• ${this.getComplianceRuleDescription(rule)}`);
      });
    }

    if (additionalRequirements.length > 0) {
      sections.push(``, `🎯 특별 요구사항:`);
      additionalRequirements.forEach(req => {
        sections.push(`• ${req}`);
      });
    }

    if (strictMode) {
      sections.push(``, `⚠️ 엄격 모드: 출처 명시와 사실 검증을 강조하는 지침을 반드시 포함하세요.`);
    }

    sections.push('');
    sections.push('생성할 프롬프트는 다른 AI가 바로 복사해서 사용할 수 있는 완성된 형태여야 합니다.');
    sections.push('프롬프트 생성 과정이나 설명은 포함하지 말고, 순수한 프롬프트 텍스트만 출력하세요.');

    return sections.join('\n');
  }

  /**
   * Generate completed prompt that users can copy and use directly
   */
  static generateCompletedPrompt(config: {
    rulepack: AnyRulepack;
    format: Format;
    level: ValidationLevel;
    topic: string;
    context?: string;
    // tone parameter omitted (unused)
    additionalRequirements?: string[];
    strictMode?: boolean;
  }): string {
    const { rulepack, format, topic, context, additionalRequirements = [], strictMode = false } = config;
    
    const tokenLimit = this.getTokenLimitForLevel(config.level);
    const formatName = this.getFormatDisplayName(format);
    
    // 완성된 프롬프트 생성
    const sections = [
      `당신은 전문적인 ${formatName} 작성 전문가입니다.`,
      `다음 주제와 조건에 맞춰 높은 품질의 ${formatName}을(를) 작성해주세요.`,
      '',
      `📋 필수 구성 요소:`,
      `${rulepack.requiredSections.map(s => `• ${this.getSectionDisplayName(s)}`).join('\n')}`,
      '',
      `✅ 작성 원칙:`,
      `${rulepack.dos.map(d => `• ${d}`).join('\n')}`,
      '',
      `❌ 금지사항:`,
      `${rulepack.donts.map(d => `• ${d}`).join('\n')}`,
      '',
      `📝 작성 가이드:`,
      `• 전문적이고 공식적인 어조 유지`,
      `• ${tokenLimit}토큰 이내 분량으로 작성`,
      `• 한국어로 작성`,
      `• 한국 공공 커뮤니케이션 표준 준수`,
      `• 구체적이고 실무적인 내용 포함`
    ];

    if (rulepack.complianceRules && rulepack.complianceRules.length > 0) {
      sections.push(``, `🔒 준수사항:`);
      rulepack.complianceRules.forEach(rule => {
        sections.push(`• ${this.getComplianceRuleDescription(rule)}`);
      });
    }

    if (additionalRequirements.length > 0) {
      sections.push(``, `🎯 추가 요구사항:`);
      additionalRequirements.forEach(req => {
        sections.push(`• ${req}`);
      });
    }

    if (strictMode) {
      sections.push(``, `⚠️ 모든 주장에 대해 출처와 근거를 명시하고 사실 검증을 철저히 하세요.`);
    }

    // 주제와 배경 정보 추가
    sections.push('', `📌 주제: ${topic}`);
    
    if (context) {
      sections.push(`📄 배경상황: ${context}`);
    }

    sections.push('');
    sections.push(`위 조건에 맞춰 작성해주세요.`);
    
    return sections.join('\n');
  }

  /**
   * Generate user prompt that provides topic and context for analysis
   */
  static generateUserPrompt(request: PromptRequest): string {
    const formatName = this.getFormatDisplayName(request.format);
    const levelName = this.getLevelDisplayName(request.level);
    
    const sections = [
      `다음 조건으로 ${formatName} 작성용 맞춤형 프롬프트를 생성해주세요:`,
      '',
      `📌 주제: ${request.topic}`,
      `📊 수준: ${levelName}`,
    ];

    if (request.context) {
      sections.push(`📄 배경상황: ${request.context}`);
    }

    if (request.additionalRequirements && request.additionalRequirements.length > 0) {
      sections.push(``, `🎯 추가 요구사항:`);
      request.additionalRequirements.forEach(req => {
        sections.push(`• ${req}`);
      });
    }

    sections.push('');
    sections.push('위 주제를 분석하여 해당 분야에 특화된 구체적이고 실용적인 프롬프트를 생성하세요.');
    sections.push('주제의 특성, 관련 전문 용어, 해당 분야에서 중요한 고려사항들을 반영해주세요.');
    
    return sections.join('\n');
  }

  /**
   * Validate topic-customized prompt quality - ensures it's specialized and ready-to-use
   */
  static async validatePrompt(
    promptText: string,
    format: Format,
    level: ValidationLevel,
    // version parameter omitted (unused)
  ): Promise<{
    validation: {
      isValid: boolean;
      warnings: string[];
      errors: string[];
    };
    checklist: {
      format: Format;
      level: ValidationLevel;
      passed: string[];
      failed: string[];
      score: number;
      totalChecks: number;
      passedChecks: number;
    };
    overallScore: number;
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];
    const passed: string[] = [];
    const failed: string[] = [];

    // 1. Check for topic-specific role definition
    if (promptText.includes('당신은') && (promptText.includes('전문가') || promptText.includes('작성자'))) {
      passed.push('역할 정의 포함');
    } else {
      errors.push('프롬프트에 명확한 역할 정의가 없습니다.');
      failed.push('역할 정의 포함');
    }

    // 2. Check for meta-instructions (should NOT be present)
    const metaInstructions = [
      '프롬프트를 생성',
      '프롬프트를 출력', 
      '위 모든 항목을 반영한',
      '작성용 프롬프트를',
      '출력하십시오',
      '생성해주세요',
      '만들어주세요',
      '프롬프트 생성 과정'
    ];
    
    const foundMetaInstructions = metaInstructions.filter(meta => 
      promptText.toLowerCase().includes(meta.toLowerCase())
    );
    
    if (foundMetaInstructions.length === 0) {
      passed.push('메타 지시문 없음');
    } else {
      errors.push(`메타 지시문 발견: ${foundMetaInstructions.join(', ')}`);
      failed.push('메타 지시문 없음');
    }

    // 3. Check for topic customization (not generic)
    const genericPhrases = ['일반적인', '보편적인', '표준적인', '평범한'];
    const hasGenericPhrase = genericPhrases.some(phrase => promptText.includes(phrase));
    const hasSpecificTerms = promptText.length > 500; // More detailed prompts tend to be customized
    
    if (!hasGenericPhrase && hasSpecificTerms) {
      passed.push('주제 특화 맞춤형');
    } else {
      warnings.push('주제에 특화된 맞춤형 내용이 부족해 보입니다.');
      failed.push('주제 특화 맞춤형');
    }

    // 4. Check format specification
    const formatName = this.getFormatDisplayName(format);
    if (promptText.includes(formatName)) {
      passed.push('형식 명시');
    } else {
      warnings.push(`${formatName} 형식이 명시되지 않았습니다.`);
      failed.push('형식 명시');
    }

    // 5. Check for structure guidelines
    if (promptText.includes('구조') || promptText.includes('구성') || promptText.includes('섹션') || promptText.includes('형식')) {
      passed.push('구조 가이드라인');
    } else {
      warnings.push('구조나 구성에 대한 가이드라인이 부족합니다.');
      failed.push('구조 가이드라인');
    }

    // 6. Check for specific instructions or constraints
    if (promptText.includes('작성 원칙') || promptText.includes('지침') || promptText.includes('요구사항') || promptText.includes('주의사항')) {
      passed.push('작성 지침 포함');
    } else {
      warnings.push('구체적인 작성 지침이나 요구사항이 부족합니다.');
      failed.push('작성 지침 포함');
    }

    // 7. Check for actionable final instruction
    if (promptText.includes('작성해') || promptText.includes('만들어') || promptText.includes('생성해')) {
      passed.push('실행 가능한 지시');
    } else {
      warnings.push('명확한 실행 지시가 없습니다.');
      failed.push('실행 가능한 지시');
    }

    const totalChecks = 7;
    const passedChecks = passed.length;
    const score = Math.round((passedChecks / totalChecks) * 100);
    const isValid = errors.length === 0;
    const overallScore = isValid ? score : Math.min(score, 60);

    return {
      validation: {
        isValid,
        warnings,
        errors,
      },
      checklist: {
        format,
        level,
        passed,
        failed,
        score,
        totalChecks,
        passedChecks,
      },
      overallScore,
    };
  }

  /**
   * Validate generated content against rulepack and checklist (legacy method)
   */
  static async validateContent(
    content: string,
    format: Format,
    level: ValidationLevel,
    version: string = 'v1'
  ): Promise<{
    validation: Awaited<ReturnType<typeof ContentValidator.validateContent>>;
    checklist: Awaited<ReturnType<typeof ChecklistLoader.validateAgainstChecklist>>;
    overallScore: number;
  }> {
    // Run validation (always available)
    const validation = await ContentValidator.validateContent(content, format, level, version);

    // Try checklist validation (may not be available for all levels)
    let checklist;
    try {
      checklist = await ChecklistLoader.validateAgainstChecklist(content, format, level, version);
    } catch {
      // Create fallback checklist result if file doesn't exist
      checklist = {
        passed: [],
        failed: [],
        total: 0,
        score: 80, // Default neutral score
      };
    }

    // Calculate overall score
    const validationScore = validation.isValid ? 100 : 50;
    const checklistScore = checklist.score;
    const overallScore = Math.round((validationScore + checklistScore) / 2);

    return {
      validation,
      checklist,
      overallScore,
    };
  }

  // Helper methods for display names
  private static getFormatDisplayName(format: Format): string {
    const displayNames = {
      press_release: '보도자료',
      speech: '연설문',
      sns: 'SNS 게시글',
      inquiry: '자료제출',
      report: '보고서',
      media_scraping: '이슈 분석',
    };
    return displayNames[format] || format;
  }

  private static getLevelDisplayName(level: ValidationLevel): string {
    const displayNames = {
      basic: '기본',
      intermediate: '중급',
      advanced: '고급',
    };
    return displayNames[level] || level;
  }

  private static getSectionDisplayName(section: string): string {
    const displayNames: Record<string, string> = {
      headline: '제목',
      lead: '리드 문단',
      body: '본문',
      quote: '인용문',
      background: '배경 정보',
      contact: '연락처',
      opening: '오프닝',
      introduction: '도입부',
      main_points: '주요 포인트',
      conclusion: '결론',
      closing: '마무리',
      hook: '훅',
      main_content: '메인 콘텐츠',
      call_to_action: '행동 유도',
      hashtags: '해시태그',
      summary: '요약',
      analysis: '분석',
      appendix: '부록',
    };
    return displayNames[section] || section;
  }

  private static getComplianceRuleDescription(rule: string): string {
    const descriptions: Record<string, string> = {
      facts_required: '객관적 사실 기반 작성 필수',
      source_required: '출처 및 근거 명시 필수',
      objective_tone: '객관적 어조 유지',
      no_exaggeration: '과장된 표현 금지',
      evidence_based: '증거 기반 내용 작성',
      accuracy_required: '정확성 검증 필수',
      official_tone: '공식적 어조 유지',
      character_limit: '글자 수 제한 준수',
      platform_optimized: '플랫폼 최적화',
      engaging_content: '흥미로운 내용 구성',
      accurate_information: '정확한 정보 제공',
      appropriate_hashtags: '적절한 해시태그 사용',
      audience_appropriate: '청중에 적합한 내용',
      clear_message: '명확한 메시지 전달',
      logical_flow: '논리적 구성',
      respectful_tone: '존중하는 어조',
      complete_information: '완전한 정보 제공',
      clear_structure: '명확한 구조',
      contact_included: '연락처 정보 포함',
    };
    return descriptions[rule] || rule;
  }

  private static getTokenLimitForLevel(level: ValidationLevel): number {
    const limits = {
      basic: parseInt(process.env.NEXT_PUBLIC_TOKEN_LIMIT_BASIC || '300'),
      intermediate: parseInt(process.env.NEXT_PUBLIC_TOKEN_LIMIT_INTERMEDIATE || '600'),
      advanced: parseInt(process.env.NEXT_PUBLIC_TOKEN_LIMIT_ADVANCED || '900'),
    };
    return limits[level];
  }

  private static getRequiredSectionsForMode(rulepack: AnyRulepack, mode?: string): string[] {
    // If modes exist and a specific mode is requested, use mode-specific sections
    if (rulepack.modes && mode && rulepack.modes[mode]) {
      return rulepack.modes[mode].requiredSections;
    }
    
    // Fallback to default required sections
    return rulepack.requiredSections;
  }
}

export default PromptGenerator;
