import { NextRequest, NextResponse } from "next/server";
import { ChecklistLoader } from "@/lib/checklist-loader";
import { FormatEnum, ValidationLevelEnum } from "@/types/rulepack";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const level = searchParams.get("level");
    const version = searchParams.get("version") || "v1";
    const category = searchParams.get("category");
    const flat = searchParams.get("flat") === "true";

    // If no parameters, return available options
    if (!format || !level) {
      return NextResponse.json({
        success: true,
        data: {
          supportedFormats: FormatEnum.options,
          supportedLevels: ValidationLevelEnum.options,
          supportedVersions: ["v1"],
          usage: {
            structured:
              "/api/checklist?format=press_release&level=intermediate",
            flat: "/api/checklist?format=press_release&level=intermediate&flat=true",
            category:
              "/api/checklist?format=press_release&level=intermediate&category=구조",
          },
        },
      });
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

    // Load checklist based on parameters
    let checklistData;

    if (category) {
      // Get specific category
      checklistData = await ChecklistLoader.getChecklistByCategory(
        formatResult.data,
        levelResult.data,
        category,
        version
      );
    } else if (flat) {
      // Get flat list
      checklistData = await ChecklistLoader.getFlatChecklist(
        formatResult.data,
        levelResult.data,
        version
      );
    } else {
      // Get structured checklist
      checklistData = await ChecklistLoader.loadChecklist(
        formatResult.data,
        levelResult.data,
        version
      );
    }

    // Get metadata
    const metadata = await ChecklistLoader.getChecklistMetadata(
      formatResult.data,
      levelResult.data,
      version
    );

    return NextResponse.json({
      success: true,
      data: {
        checklist: checklistData,
        metadata,
      },
    });
  } catch (error) {
    console.error("Error in checklist API:", error);

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
    const { content, format, level, version = "v1" } = body;

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

    if (!formatResult.success || !levelResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid format or level",
          availableFormats: FormatEnum.options,
          availableLevels: ValidationLevelEnum.options,
        },
        { status: 400 }
      );
    }

    // Validate content against checklist
    const result = await ChecklistLoader.validateAgainstChecklist(
      content,
      formatResult.data,
      levelResult.data,
      version
    );

    // Get checklist metadata
    const metadata = await ChecklistLoader.getChecklistMetadata(
      formatResult.data,
      levelResult.data,
      version
    );

    return NextResponse.json({
      success: true,
      data: {
        validation: result,
        metadata,
      },
    });
  } catch (error) {
    console.error("Error in checklist validation API:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Validation failed",
      },
      { status: 500 }
    );
  }
}
export const runtime = "nodejs";
