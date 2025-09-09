import { readFile } from "fs/promises";
import { join } from "path";
import yaml from "js-yaml";
import {
  AnyRulepackSchema,
  type AnyRulepack,
  type Format,
  FormatEnum,
} from "@/types/rulepack";

export class RulepackLoader {
  private static cache = new Map<string, AnyRulepack>();
  private static readonly RULEPACK_DIR = join(process.cwd(), "rulepacks/format");

  /**
   * Load a rulepack by format and version
   */
  static async loadFormatPack(
    format: Format,
    version: string = "v1"
  ): Promise<AnyRulepack> {
    const cacheKey = `${format}_${version}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const filePath = join(
        this.RULEPACK_DIR,
        `${format}_${version}.yaml`
      );
      const fileContent = await readFile(filePath, "utf-8");
      const rawData = yaml.load(fileContent);

      // Validate the loaded data
      const rulepack = AnyRulepackSchema.parse(rawData);

      // Cache the validated rulepack
      this.cache.set(cacheKey, rulepack);

      return rulepack;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to load rulepack ${format}_${version}: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Load all format rulepacks for a given version
   */
  static async loadAllFormatPacks(
    version: string = "v1"
  ): Promise<Map<Format, AnyRulepack>> {
    const formats = FormatEnum.options;
    const rulepacks = new Map<Format, AnyRulepack>();

    const loadPromises = formats.map(async (format) => {
      try {
        const rulepack = await this.loadFormatPack(format, version);
        rulepacks.set(format, rulepack);
      } catch (error) {
        console.error(`Failed to load rulepack for format ${format}:`, error);
        throw error;
      }
    });

    await Promise.all(loadPromises);
    return rulepacks;
  }

  /**
   * Validate rulepack structure
   */
  static validateRulepack(data: unknown): AnyRulepack {
    return AnyRulepackSchema.parse(data);
  }

  /**
   * Get available formats
   */
  static getAvailableFormats(): Format[] {
    return FormatEnum.options;
  }

  /**
   * Check if a format is supported
   */
  static isFormatSupported(format: string): format is Format {
    return FormatEnum.safeParse(format).success;
  }

  /**
   * Clear cache (useful for testing or when rulepacks are updated)
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

  /**
   * Preload all rulepacks (useful for performance optimization)
   */
  static async preloadAll(version: string = "v1"): Promise<void> {
    await this.loadAllFormatPacks(version);
  }
}

/**
 * Utility function to get rulepack safely with error handling
 */
export async function getRulepack(
  format: Format,
  version: string = "v1"
): Promise<AnyRulepack | null> {
  try {
    return await RulepackLoader.loadFormatPack(format, version);
  } catch (error) {
    console.error(`Error loading rulepack for ${format}:`, error);
    return null;
  }
}

/**
 * Utility function to get structure hints for a specific format
 */
export async function getStructureHints(
  format: Format,
  version: string = "v1"
): Promise<Record<string, unknown> | null> {
  const rulepack = await getRulepack(format, version);
  return rulepack?.structureHints || null;
}

/**
 * Utility function to get compliance rules for a specific format
 */
export async function getComplianceRules(
  format: Format,
  version: string = "v1"
): Promise<string[] | null> {
  const rulepack = await getRulepack(format, version);
  return rulepack?.complianceRules || null;
}

/**
 * Utility function to get dos and donts for a specific format
 */
export async function getGuidelines(
  format: Format,
  version: string = "v1"
): Promise<{ dos: string[]; donts: string[] } | null> {
  const rulepack = await getRulepack(format, version);
  if (!rulepack) return null;

  return {
    dos: rulepack.dos,
    donts: rulepack.donts,
  };
}

/**
 * Utility function to get required sections for a format, considering mode
 */
export async function getRequiredSections(
  format: Format,
  mode?: string,
  version: string = "v1"
): Promise<string[] | null> {
  const rulepack = await getRulepack(format, version);
  if (!rulepack) return null;

  // If modes exist and a specific mode is requested, use mode-specific sections
  if (rulepack.modes && mode && rulepack.modes[mode]) {
    return rulepack.modes[mode].requiredSections;
  }

  // Fallback to default required sections
  return rulepack.requiredSections;
}

/**
 * Utility function to get available modes for a format
 */
export async function getAvailableModes(
  format: Format,
  version: string = "v1"
): Promise<Record<string, { description: string; requiredSections: string[] }> | null> {
  const rulepack = await getRulepack(format, version);
  if (!rulepack) return null;

  return rulepack.modes || null;
}

/**
 * Utility function to get the default mode for a format (first mode if available)
 */
export async function getDefaultMode(
  format: Format,
  version: string = "v1"
): Promise<string | null> {
  const rulepack = await getRulepack(format, version);
  if (!rulepack || !rulepack.modes) return null;

  const modeKeys = Object.keys(rulepack.modes);
  return modeKeys.length > 0 ? modeKeys[0] : null;
}

/**
 * Utility function to validate if a mode is valid for a format
 */
export async function isValidMode(
  format: Format,
  mode: string,
  version: string = "v1"
): Promise<boolean> {
  const availableModes = await getAvailableModes(format, version);
  return availableModes ? mode in availableModes : false;
}
