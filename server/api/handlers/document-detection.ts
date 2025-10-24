/**
 * 文档检测处理器
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  detectDocumentSensitiveInfo,
  isDocumentFile,
  detectFileType,
  handleApiError,
  validateRequiredParams 
} from '../../lib/openai';

/**
 * 处理文档检测请求
 */
export async function handleDocumentDetection(request: NextRequest, operation: string) {
  try {
    const body = await request.json();
    const { fileContent, fileName } = body;

    // 验证必需参数
    const validationError = validateRequiredParams(body, ['fileContent', 'fileName']);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, success: false },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!isDocumentFile(fileName)) {
      return NextResponse.json(
        { error: '不支持的文件类型，请上传文档文件', success: false },
        { status: 400 }
      );
    }

    // 检测文件类型
    const fileType = detectFileType(fileName);

    // 执行检测
    const detectionResult = await detectDocumentSensitiveInfo({
      fileContent,
      fileName,
      fileType,
    });

    if (!detectionResult.success) {
      return NextResponse.json(
        { error: detectionResult.error, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      results: detectionResult.data,
      fileName,
      fileType,
    });

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}