import { NextResponse } from "next/server";
import { RulepackLoader } from "@/lib/rulepack-loader";
import { ChecklistLoader } from "@/lib/checklist-loader";

export async function GET() {
  const startTime = Date.now();
  const health: {
    status: string;
    timestamp: string;
    version: string;
    environment: string;
    checks: Record<string, unknown>;
    performance: Record<string, unknown>;
    cache: Record<string, unknown>;
  } = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    checks: {},
    performance: {},
    cache: {},
  };

  try {
    // Test rulepack loading
    const rulepackStart = Date.now();
    await RulepackLoader.loadFormatPack("press_release");
    const rulepackTime = Date.now() - rulepackStart;

    health.checks.rulepack = {
      status: "healthy",
      responseTime: `${rulepackTime}ms`,
    };

    // Test checklist loading
    const checklistStart = Date.now();
    await ChecklistLoader.loadChecklist("press_release", "intermediate");
    const checklistTime = Date.now() - checklistStart;

    health.checks.checklist = {
      status: "healthy",
      responseTime: `${checklistTime}ms`,
    };

    // Get cache statistics
    health.cache = {
      rulepack: RulepackLoader.getCacheStats(),
      checklist: ChecklistLoader.getCacheStats(),
    };

    // Overall performance
    health.performance = {
      totalResponseTime: `${Date.now() - startTime}ms`,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };
  } catch (error) {
    health.status = "unhealthy";
    health.checks.error = {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };

    return NextResponse.json(health, { status: 500 });
  }

  return NextResponse.json(health);
}
