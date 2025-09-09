import {
  type Format,
  type ValidationLevel,
  type ValidationResult,
  type TokenLimits,
  TokenLimitsSchema,
} from "@/types/rulepack";
import { RulepackLoader } from "./rulepack-loader";

export class ContentValidator {
  private static tokenLimits: TokenLimits = TokenLimitsSchema.parse({
    basic: parseInt(process.env.NEXT_PUBLIC_TOKEN_LIMIT_BASIC || "300"),
    intermediate: parseInt(
      process.env.NEXT_PUBLIC_TOKEN_LIMIT_INTERMEDIATE || "600"
    ),
    advanced: parseInt(process.env.NEXT_PUBLIC_TOKEN_LIMIT_ADVANCED || "900"),
  });

  /**
   * Validate content against rulepack requirements
   */
  static async validateContent(
    content: string,
    format: Format,
    level: ValidationLevel,
    version: string = "v1"
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Load the rulepack
      const rulepack = await RulepackLoader.loadFormatPack(format, version);

      // Count tokens (simple approximation)
      const tokenCount = this.estimateTokens(content);

      // Check token limits
      const tokenLimit = this.tokenLimits[level];
      if (tokenCount > tokenLimit) {
        errors.push(
          `Content exceeds ${level} token limit (${tokenCount}/${tokenLimit})`
        );
      }

      // Check required sections
      const missingSections = this.checkRequiredSections(
        content,
        rulepack.requiredSections
      );
      if (missingSections.length > 0) {
        errors.push(`Missing required sections: ${missingSections.join(", ")}`);
      }

      // Check compliance rules
      const complianceIssues = await this.checkComplianceRules(
        content,
        rulepack.complianceRules
      );
      errors.push(...complianceIssues);

      // Check structure hints
      const structureWarnings = this.checkStructureHints(
        content,
        rulepack.structureHints
      );
      warnings.push(...structureWarnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          format,
          level,
          tokenCount,
          rulepackVersion: version,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [
          `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
        warnings: [],
        metadata: {
          format,
          level,
          tokenCount: 0,
          rulepackVersion: version,
        },
      };
    }
  }

  /**
   * Simple token estimation (approximation)
   */
  private static estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for Korean text
    // More sophisticated tokenization would use actual tokenizer
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if content includes required sections
   */
  private static checkRequiredSections(
    content: string,
    requiredSections: string[]
  ): string[] {
    const contentLower = content.toLowerCase();
    const missingSections: string[] = [];

    for (const section of requiredSections) {
      // Simple keyword-based detection
      // In production, this should use more sophisticated parsing
      const sectionKeywords = this.getSectionKeywords(section);
      const hasSection = sectionKeywords.some((keyword) =>
        contentLower.includes(keyword.toLowerCase())
      );

      if (!hasSection) {
        missingSections.push(section);
      }
    }

    return missingSections;
  }

  /**
   * Get keywords that indicate presence of a section
   */
  private static getSectionKeywords(section: string): string[] {
    const keywordMap: Record<string, string[]> = {
      headline: ["제목", "헤드라인", "표제"],
      lead: ["리드", "서론", "개요"],
      body: ["본문", "내용", "상세"],
      quote: ["인용", "발언", "말씀"],
      background: ["배경", "경위", "현황"],
      contact: ["연락처", "문의", "담당"],
      opening: ["인사", "개회", "시작"],
      introduction: ["소개", "도입", "서론"],
      main_points: ["주요", "핵심", "요점"],
      conclusion: ["결론", "마무리", "정리"],
      closing: ["마감", "종료", "감사"],
      hook: ["훅", "도입부", "시작"],
      main_content: ["주요내용", "본문", "핵심"],
      call_to_action: ["행동촉구", "참여", "요청"],
      hashtags: ["해시태그", "#"],
      summary: ["요약", "개요", "정리"],
      analysis: ["분석", "검토", "평가"],
      appendix: ["부록", "첨부", "참고"],
    };

    return keywordMap[section] || [section];
  }

  /**
   * Check compliance rules
   */
  private static async checkComplianceRules(
    content: string,
    complianceRules: string[]
  ): Promise<string[]> {
    const issues: string[] = [];

    for (const rule of complianceRules) {
      const issue = await this.checkComplianceRule(content, rule);
      if (issue) {
        issues.push(issue);
      }
    }

    return issues;
  }

  /**
   * Check individual compliance rule
   */
  private static async checkComplianceRule(
    content: string,
    rule: string
  ): Promise<string | null> {
    switch (rule) {
      case "facts_required":
        if (!this.hasFactualContent(content)) {
          return "객관적 사실 기반 내용이 부족합니다";
        }
        break;

      case "source_required":
        if (!this.hasSources(content)) {
          return "출처나 근거가 명시되지 않았습니다";
        }
        break;

      case "objective_tone":
        if (!this.hasObjectiveTone(content)) {
          return "객관적 어조가 유지되지 않았습니다";
        }
        break;

      case "no_exaggeration":
        if (this.hasExaggeration(content)) {
          return "과장된 표현이 포함되어 있습니다";
        }
        break;

      case "evidence_based":
        if (!this.hasEvidence(content)) {
          return "충분한 근거나 증거가 제시되지 않았습니다";
        }
        break;

      case "accuracy_required":
        // This would require fact-checking APIs in production
        break;

      case "official_tone":
        if (!this.hasOfficialTone(content)) {
          return "공식적인 어조가 유지되지 않았습니다";
        }
        break;

      case "character_limit":
        // Already handled in token validation
        break;

      default:
        // Unknown rule
        break;
    }

    return null;
  }

  /**
   * Check structure hints and generate warnings
   */
  private static checkStructureHints(
    content: string,
    structureHints: Record<string, unknown>
  ): string[] {
    const warnings: string[] = [];

    for (const [section, hints] of Object.entries(structureHints)) {
      if (typeof hints === 'object' && hints !== null && 'maxLines' in hints && hints.maxLines) {
        const sectionContent = this.extractSectionContent(content, section);
        if (sectionContent) {
          const lineCount = sectionContent.split("\n").length;
          if (lineCount > Number(hints.maxLines)) {
            warnings.push(
              `${section} 섹션이 권장 줄 수(${hints.maxLines})를 초과했습니다`
            );
          }
        }
      }

      if (typeof hints === 'object' && hints !== null && 'maxCharacters' in hints && hints.maxCharacters) {
        const sectionContent = this.extractSectionContent(content, section);
        if (sectionContent && sectionContent.length > Number(hints.maxCharacters)) {
          warnings.push(
            `${section} 섹션이 권장 글자 수(${hints.maxCharacters})를 초과했습니다`
          );
        }
      }

      if (typeof hints === 'object' && hints !== null && 'maxCount' in hints && hints.maxCount && section === "hashtags") {
        const hashtagCount = (content.match(/#\w+/g) || []).length;
        if (hashtagCount > Number(hints.maxCount)) {
          warnings.push(
            `해시태그가 권장 개수(${hints.maxCount})를 초과했습니다`
          );
        }
      }
    }

    return warnings;
  }

  // Helper methods for compliance rule checking
  private static hasFactualContent(content: string): boolean {
    // Simple heuristic - look for dates, numbers, specific references
    return /\d{4}년|\d+%|\d+명|\d+건|통계|자료|조사|연구/.test(content);
  }

  private static hasSources(content: string): boolean {
    // Look for source indicators
    return /출처|자료|참고|근거|기준|법령|조례|규정/.test(content);
  }

  private static hasObjectiveTone(content: string): boolean {
    // Check for subjective language (simple heuristic)
    const subjectiveWords = /아마도|추측|생각|느낌|개인적|주관적/;
    return !subjectiveWords.test(content);
  }

  private static hasExaggeration(content: string): boolean {
    // Look for exaggerated language
    const exaggeratedWords =
      /매우|극도로|엄청|대단히|놀랍게|획기적|혁신적|최고|최대|최소/;
    return exaggeratedWords.test(content);
  }

  private static hasEvidence(content: string): boolean {
    // Look for evidence indicators
    return /증명|입증|확인|검증|사례|예시|데이터|결과|분석/.test(content);
  }

  private static hasOfficialTone(content: string): boolean {
    // Check for informal language
    const informalWords = /ㅋ|ㅎ|~|!!|요즘|막|진짜|완전/;
    return !informalWords.test(content);
  }

  private static extractSectionContent(
    content: string,
    section: string
  ): string | null {
    // Simple section extraction - in production this would be more sophisticated
    const lines = content.split("\n");
    const sectionKeywords = this.getSectionKeywords(section);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && sectionKeywords.some((keyword) => line.includes(keyword))) {
        // Found section, extract until next section or end
        let sectionContent = "";
        for (let j = i; j < lines.length; j++) {
          const currentLine = lines[j];
          if (
            j > i &&
            currentLine &&
            (currentLine.startsWith("#") || currentLine.includes("##"))
          ) {
            break; // Next section found
          }
          sectionContent += (currentLine || "") + "\n";
        }
        return sectionContent.trim();
      }
    }

    return null;
  }
}
