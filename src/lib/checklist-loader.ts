import { readFile } from "fs/promises";
import { join } from "path";
import { type Format, type ValidationLevel } from "@/types/rulepack";

export interface ChecklistItem {
  category: string;
  items: string[];
}

export interface ChecklistMetadata {
  title: string;
  version: string;
  format: Format;
  level: ValidationLevel;
  categories: string[];
}

export class ChecklistLoader {
  private static cache = new Map<string, ChecklistItem[]>();
  // Lazily resolve to avoid evaluation issues during build/edge analysis
  private static getChecklistDir(): string {
    return join(process.cwd(), "checklists");
  }

  /**
   * Load checklist for a specific format and level
   */
  static async loadChecklist(
    format: Format,
    level: ValidationLevel,
    version: string = "v1"
  ): Promise<ChecklistItem[]> {
    const cacheKey = `${format}_${level}_${version}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const filename = `${format}_${level}_${version}.md`;
      const filePath = join(this.getChecklistDir(), filename);
      const fileContent = await readFile(filePath, "utf-8");

      const checklist = this.parseMarkdownChecklist(fileContent);

      // Cache the parsed checklist
      this.cache.set(cacheKey, checklist);

      return checklist;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to load checklist ${format}_${level}_${version}: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Parse markdown checklist into structured format
   */
  private static parseMarkdownChecklist(content: string): ChecklistItem[] {
    const lines = content.split("\n");
    const checklist: ChecklistItem[] = [];
    let currentCategory = "";
    let currentItems: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines and main title
      if (!trimmedLine || trimmedLine.startsWith("# ")) {
        continue;
      }

      // Category headers (## or ###)
      if (trimmedLine.match(/^#{2,3}\s+/)) {
        // Save previous category if exists
        if (currentCategory && currentItems.length > 0) {
          checklist.push({
            category: currentCategory,
            items: [...currentItems],
          });
        }

        // Start new category
        currentCategory = trimmedLine.replace(/^#+\s+/, "");
        currentItems = [];
        continue;
      }

      // Checklist items (- [ ] format)
      if (trimmedLine.startsWith("- [ ]")) {
        const item = trimmedLine.replace(/^-\s+\[\s+\]\s+/, "");
        currentItems.push(item);
        continue;
      }
    }

    // Add last category
    if (currentCategory && currentItems.length > 0) {
      checklist.push({
        category: currentCategory,
        items: currentItems,
      });
    }

    return checklist;
  }

  /**
   * Get checklist metadata
   */
  static async getChecklistMetadata(
    format: Format,
    level: ValidationLevel,
    version: string = "v1"
  ): Promise<ChecklistMetadata> {
    const checklist = await this.loadChecklist(format, level, version);

    return {
      title: `${format} ${level} 검증 체크리스트 ${version}`,
      version,
      format,
      level,
      categories: checklist.map((item) => item.category),
    };
  }

  /**
   * Get all checklist items as flat array
   */
  static async getFlatChecklist(
    format: Format,
    level: ValidationLevel,
    version: string = "v1"
  ): Promise<string[]> {
    const checklist = await this.loadChecklist(format, level, version);

    return checklist.reduce((acc: string[], category) => {
      return acc.concat(category.items);
    }, []);
  }

  /**
   * Get checklist items by category
   */
  static async getChecklistByCategory(
    format: Format,
    level: ValidationLevel,
    category: string,
    version: string = "v1"
  ): Promise<string[]> {
    const checklist = await this.loadChecklist(format, level, version);

    const categoryData = checklist.find((item) =>
      item.category.toLowerCase().includes(category.toLowerCase())
    );

    return categoryData?.items || [];
  }

  /**
   * Validate content against checklist items
   */
  static async validateAgainstChecklist(
    content: string,
    format: Format,
    level: ValidationLevel,
    version: string = "v1"
  ): Promise<{
    passed: string[];
    failed: string[];
    total: number;
    score: number;
  }> {
    const checklist = await this.getFlatChecklist(format, level, version);
    const passed: string[] = [];
    const failed: string[] = [];

    // Simple heuristic validation
    // In production, this would use more sophisticated NLP techniques
    for (const item of checklist) {
      const isPassed = this.evaluateChecklistItem(content, item);
      if (isPassed) {
        passed.push(item);
      } else {
        failed.push(item);
      }
    }

    return {
      passed,
      failed,
      total: checklist.length,
      score: Math.round((passed.length / checklist.length) * 100),
    };
  }

  /**
   * Simple heuristic evaluation of checklist item
   */
  private static evaluateChecklistItem(content: string, item: string): boolean {
    const itemLower = item.toLowerCase();
    const contentLower = content.toLowerCase();

    // Extract key concepts from checklist item
    const concepts = this.extractConcepts(itemLower);

    // Check if content contains relevant concepts
    return concepts.some((concept) => contentLower.includes(concept));
  }

  /**
   * Extract key concepts from checklist item text
   */
  private static extractConcepts(item: string): string[] {
    const concepts: string[] = [];

    // Common patterns in Korean checklist items
    const patterns = [
      /(\w+)이\s+포함/,
      /(\w+)가\s+명시/,
      /(\w+)이\s+작성/,
      /(\w+)을\s+사용/,
      /(\w+)를\s+피함/,
      /(\w+)\s+요소/,
      /(\w+)\s+내용/,
      /(\w+)\s+정보/,
    ];

    for (const pattern of patterns) {
      const match = item.match(pattern);
      if (match && match[1]) {
        concepts.push(match[1]);
      }
    }

    // Extract quoted terms
    const quotedTerms = item.match(/"([^"]+)"/g);
    if (quotedTerms) {
      concepts.push(...quotedTerms.map((term) => term.replace(/"/g, "")));
    }

    // Extract parenthetical terms
    const parenthetical = item.match(/\(([^)]+)\)/g);
    if (parenthetical) {
      concepts.push(...parenthetical.map((term) => term.replace(/[()]/g, "")));
    }

    return concepts;
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
