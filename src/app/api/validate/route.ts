import { NextRequest, NextResponse } from "next/server";

// Dynamic imports to prevent build-time issues
async function getValidation() {
  const { ContentValidator } = await import("@/lib/validation");
  return ContentValidator;
}

async function getChecklistLoader() {
  const { ChecklistLoader } = await import("@/lib/checklist-loader");
  return ChecklistLoader;
}

async function getSchemas() {
  const { FormatEnum, ValidationLevelEnum } = await import("@/types/rulepack");
  return { FormatEnum, ValidationLevelEnum };
}

interface ValidateRequestBody {
  content: string;
  format: string;
  level: string;
  version?: string;
  includeChecklist?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidateRequestBody = await request.json();
    const {
      content,
      format,
      level,
      version = "v1",
      includeChecklist = false,
    } = body;

    // Validate required fields
    if (!content || !format || !level) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: content, format, level",
        },
        { status: 400 }
      );
    }

    const { FormatEnum, ValidationLevelEnum } = await getSchemas();

    // Validate format and level
    const formatResult = FormatEnum.safeParse(format);
    const levelResult = ValidationLevelEnum.safeParse(level);

    if (!formatResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid format: ${format}`,
          availableFormats: FormatEnum.options,
        },
        { status: 400 }
      );
    }

    if (!levelResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid level: ${level}`,
          availableLevels: ValidationLevelEnum.options,
        },
        { status: 400 }
      );
    }

    const ContentValidator = await getValidation();

    // Perform content validation
    const validationResult = await ContentValidator.validateContent(
      content,
      formatResult.data,
      levelResult.data,
      version
    );

    // Optionally include checklist validation
    let checklistResult = null;
    if (includeChecklist) {
      try {
        const ChecklistLoader = await getChecklistLoader();
        checklistResult = await ChecklistLoader.validateAgainstChecklist(
          content,
          formatResult.data,
          levelResult.data,
          version
        );
      } catch (error) {
        console.warn("Checklist validation failed:", error);
        // Don't fail the entire request if checklist validation fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        validation: validationResult,
        checklist: checklistResult,
      },
    });
  } catch (error) {
    console.error("Error in validation API:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Validation failed",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { FormatEnum, ValidationLevelEnum } = await getSchemas();
  
  return NextResponse.json({
    success: true,
    data: {
      supportedFormats: FormatEnum.options,
      supportedLevels: ValidationLevelEnum.options,
      supportedVersions: ["v1"],
      endpoints: {
        validate: "POST /api/validate",
        rulepack: "GET /api/rulepack",
        checklist: "GET /api/checklist",
      },
    },
  });
}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
