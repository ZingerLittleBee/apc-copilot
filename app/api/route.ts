/**
 * 统一API路由处理器
 * 处理所有API请求的统一入口
 */

import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/server/lib/openai";
import { handleCodeDetection } from "@/server/api/handlers/code-detection";
import { handlePromptDetection } from "@/server/api/handlers/prompt-detection";
import { handleDocumentDetection } from "@/server/api/handlers/document-detection";

// API路由配置
const API_ROUTES = {
  "code-detection": handleCodeDetection,
  "document-detection": handleDocumentDetection,
  "prompt-detection": handlePromptDetection,
} as const;

type ApiRoute = keyof typeof API_ROUTES;

/**
 * 主API处理器
 */
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const apiType = url.searchParams.get("type") as ApiRoute;
    const operation = url.searchParams.get("operation") || "default";

    // 根据API类型路由到对应的处理器
    if (apiType && apiType in API_ROUTES) {
      return await API_ROUTES[apiType](request, operation);
    }

    return NextResponse.json(
      { error: "未知的API类型", success: false },
      { status: 404 }
    );
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * 处理OPTIONS请求（CORS预检）
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
