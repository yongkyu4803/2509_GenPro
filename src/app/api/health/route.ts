import { NextResponse } from "next/server";

// Dynamic imports to prevent build-time issues
async function getRulepackLoader() {
  const { RulepackLoader } = await import("@/lib/rulepack-loader");
  return RulepackLoader;
}

async function getChecklistLoader() {
  const { ChecklistLoader } = await import("@/lib/checklist-loader");
  return ChecklistLoader;
}

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
    const RulepackLoader = await getRulepackLoader();
    const ChecklistLoader = await getChecklistLoader();

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
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
