import { NextRequest, NextResponse } from "next/server";

// Dynamic imports to prevent build-time issues
async function getRulepackLoader() {
  const { RulepackLoader } = await import("@/lib/rulepack-loader");
  return RulepackLoader;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const version = searchParams.get("version") || "v1";

    const RulepackLoader = await getRulepackLoader();

    // If no format specified, return all available formats
    if (!format) {
      const formats = RulepackLoader.getAvailableFormats();
      return NextResponse.json({
        success: true,
        data: {
          availableFormats: formats,
          supportedVersions: ["v1"],
        },
      });
    }

    // Validate format
    if (!RulepackLoader.isFormatSupported(format)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported format: ${format}`,
          availableFormats: RulepackLoader.getAvailableFormats(),
        },
        { status: 400 }
      );
    }

    // Load specific rulepack
    const validFormat = format as Parameters<
      typeof RulepackLoader.loadFormatPack
    >[0];
    const rulepack = await RulepackLoader.loadFormatPack(validFormat, version);

    return NextResponse.json({
      success: true,
      data: rulepack,
    });
  } catch (error) {
    console.error("Error in rulepack API:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formats, version = "v1" } = body;

    if (!Array.isArray(formats)) {
      return NextResponse.json(
        {
          success: false,
          error: "formats must be an array",
        },
        { status: 400 }
      );
    }

    const RulepackLoader = await getRulepackLoader();

    // Validate all formats
    const invalidFormats = formats.filter(
      (format) => !RulepackLoader.isFormatSupported(format)
    );

    if (invalidFormats.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported formats: ${invalidFormats.join(", ")}`,
          availableFormats: RulepackLoader.getAvailableFormats(),
        },
        { status: 400 }
      );
    }

    // Load multiple rulepacks
    const rulepacks: Record<string, unknown> = {};

    for (const format of formats) {
      try {
        rulepacks[format] = await RulepackLoader.loadFormatPack(
          format,
          version
        );
      } catch (error) {
        console.error(`Failed to load rulepack ${format}:`, error);
        rulepacks[format] = {
          error: error instanceof Error ? error.message : "Load failed",
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: rulepacks,
    });
  } catch (error) {
    console.error("Error in rulepack bulk API:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
