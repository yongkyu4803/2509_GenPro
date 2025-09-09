import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { RulepackLoader, getRulepack } from "../rulepack-loader";
import { FormatEnum } from "@/types/rulepack";

describe("RulepackLoader", () => {
  beforeEach(() => {
    RulepackLoader.clearCache();
  });

  afterEach(() => {
    RulepackLoader.clearCache();
  });

  describe("loadFormatPack", () => {
    it("should load a press release rulepack", async () => {
      const rulepack = await RulepackLoader.loadFormatPack("press_release");

      expect(rulepack).toBeDefined();
      expect(rulepack.id).toBe("press_release_v1");
      expect(rulepack.type).toBe("formatPack");
      expect(rulepack.requiredSections).toContain("headline");
      expect(rulepack.dos).toBeInstanceOf(Array);
      expect(rulepack.donts).toBeInstanceOf(Array);
    });

    it("should load a speech rulepack", async () => {
      const rulepack = await RulepackLoader.loadFormatPack("speech");

      expect(rulepack).toBeDefined();
      expect(rulepack.id).toBe("speech_v1");
      expect(rulepack.requiredSections).toContain("opening");
      expect(rulepack.requiredSections).toContain("conclusion");
    });

    it("should cache loaded rulepacks", async () => {
      const firstLoad = await RulepackLoader.loadFormatPack("sns");
      const secondLoad = await RulepackLoader.loadFormatPack("sns");

      expect(firstLoad).toBe(secondLoad); // Should be same object reference

      const stats = RulepackLoader.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.keys).toContain("sns_v1");
    });

    it("should throw error for non-existent rulepack", async () => {
      await expect(
        // @ts-expect-error Testing invalid format
        RulepackLoader.loadFormatPack("nonexistent")
      ).rejects.toThrow();
    });
  });

  describe("loadAllFormatPacks", () => {
    it("should load all format rulepacks", async () => {
      const rulepacks = await RulepackLoader.loadAllFormatPacks();

      expect(rulepacks.size).toBe(FormatEnum.options.length);

      // Check that all formats are loaded
      for (const format of FormatEnum.options) {
        expect(rulepacks.has(format)).toBe(true);
        const rulepack = rulepacks.get(format);
        expect(rulepack).toBeDefined();
        expect(rulepack!.type).toBe("formatPack");
      }
    });
  });

  describe("utility functions", () => {
    it("should check if format is supported", () => {
      expect(RulepackLoader.isFormatSupported("press_release")).toBe(true);
      expect(RulepackLoader.isFormatSupported("speech")).toBe(true);
      expect(RulepackLoader.isFormatSupported("invalid_format")).toBe(false);
    });

    it("should get available formats", () => {
      const formats = RulepackLoader.getAvailableFormats();
      expect(formats).toEqual(FormatEnum.options);
    });
  });

  describe("getRulepack utility", () => {
    it("should return rulepack for valid format", async () => {
      const rulepack = await getRulepack("inquiry");
      expect(rulepack).toBeDefined();
      expect(rulepack!.id).toBe("inquiry_v1");
    });

    it("should return null for invalid format", async () => {
      // @ts-expect-error Testing invalid format
      const rulepack = await getRulepack("invalid");
      expect(rulepack).toBeNull();
    });
  });

  describe("cache management", () => {
    it("should clear cache properly", async () => {
      await RulepackLoader.loadFormatPack("report");

      let stats = RulepackLoader.getCacheStats();
      expect(stats.size).toBe(1);

      RulepackLoader.clearCache();

      stats = RulepackLoader.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it("should preload all rulepacks", async () => {
      await RulepackLoader.preloadAll();

      const stats = RulepackLoader.getCacheStats();
      expect(stats.size).toBe(FormatEnum.options.length);
    });
  });
});
