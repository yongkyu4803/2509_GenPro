import { NextRequest, NextResponse } from "next/server";
import { ContentValidator } from "@/lib/validation";
import { ChecklistLoader } from "@/lib/checklist-loader";
import { FormatEnum, ValidationLevelEnum } from "@/types/rulepack";

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
