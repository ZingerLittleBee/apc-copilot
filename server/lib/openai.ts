/**
 * 统一API服务模块
 * 整合OpenAI、代码检测、数据库等所有后端服务
 */

import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// ==================== 配置和初始化 ====================

/**
 * 获取OpenAI客户端
 */
function getOpenAIClient() {
  const apiKey = process.env['ARK_API_KEY'];
  
  if (!apiKey) {
    throw new Error('请配置 ARK_API_KEY 环境变量');
  }
  
  return new OpenAI({
    apiKey,
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  });
}

// ==================== 类型定义 ====================

// 通用API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 聊天完成相关类型
export interface ChatCompletionOptions {
  messages: ChatCompletionMessageParam[];
  model?: string;
  reasoning_effort?: 'low' | 'medium' | 'high';
  stream?: boolean;
}

export interface ChatCompletionResponse {
  reasoning_content?: string;
  content: string;
}

export interface StreamingResponse {
  reasoning_content?: string;
  content: string;
  done: boolean;
}

// 代码检测相关类型
export interface CodeDetectionResult {
  id: string;
  type: string;
  content: string;
  severity: "high" | "medium" | "low";
  lineNumber?: number;
  codeSnippet?: string;
}

export interface CodeDetectionOptions {
  fileContent: string;
  fileName: string;
  fileType: string;
}


// ==================== OpenAI 服务 ====================

/**
 * 非流式聊天完成
 */
export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<ApiResponse<ChatCompletionResponse>> {
  try {
    const {
      messages,
      model = 'doubao-seed-1-6-251015',
      reasoning_effort = 'medium',
    } = options;

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      messages,
      model,
      reasoning_effort,
    });

    return {
      success: true,
      data: {
        reasoning_content: (completion.choices[0]?.message as any)?.reasoning_content || '',
        content: completion.choices[0]?.message?.content || '',
      }
    };
  } catch (error) {
    console.error('OpenAI聊天完成失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '聊天完成失败'
    };
  }
}

/**
 * 流式聊天完成
 */
export async function createStreamingChatCompletion(
  options: ChatCompletionOptions,
  onChunk: (chunk: StreamingResponse) => void
): Promise<ApiResponse<void>> {
  try {
    const {
      messages,
      model = 'doubao-seed-1-6-251015',
      reasoning_effort = 'medium',
    } = options;

    const client = getOpenAIClient();
    const stream = await client.chat.completions.create({
      messages,
      model,
      reasoning_effort,
      stream: true,
    });

    for await (const part of stream) {
      const chunk: StreamingResponse = {
        reasoning_content: (part.choices[0]?.delta as any)?.reasoning_content || '',
        content: part.choices[0]?.delta?.content || '',
        done: part.choices[0]?.finish_reason === 'stop',
      };
      
      onChunk(chunk);
    }

    return { success: true };
  } catch (error) {
    console.error('OpenAI流式聊天完成失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '流式聊天完成失败'
    };
  }
}

/**
 * 创建包含图像和文本的消息
 */
export function createImageTextMessage(
  imageUrl: string,
  text: string
): ChatCompletionMessageParam {
  return {
    role: 'user',
    content: [
      {
        type: 'image_url',
        image_url: {
          url: imageUrl,
        },
      },
      {
        type: 'text',
        text,
      },
    ],
  };
}

/**
 * 创建纯文本消息
 */
export function createTextMessage(
  text: string,
  role: 'user' | 'assistant' | 'system' = 'user'
): ChatCompletionMessageParam {
  return {
    role,
    content: text,
  };
}

// ==================== 代码检测服务 ====================

/**
 * 检测代码中的敏感信息
 */
export async function detectCodeSensitiveInfo(
  options: CodeDetectionOptions
): Promise<ApiResponse<CodeDetectionResult[]>> {
  try {
    const { fileContent, fileName, fileType } = options;

    // 构建检测提示词
    const prompt = buildDetectionPrompt(fileContent, fileName, fileType);

    // 调用OpenAI进行检测
    const chatResponse = await createChatCompletion({
      messages: [createTextMessage(prompt)],
      model: 'doubao-seed-1-6-251015',
      reasoning_effort: 'high',
    });

    if (!chatResponse.success || !chatResponse.data) {
      return {
        success: false,
        error: chatResponse.error || '代码检测失败'
      };
    }

    // 解析检测结果
    const results = parseDetectionResponse(chatResponse.data.content);
    
    return {
      success: true,
      data: results
    };
  } catch (error) {
    console.error('代码检测失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '代码检测失败，请重试'
    };
  }
}

/**
 * 构建检测提示词
 */
function buildDetectionPrompt(fileContent: string, fileName: string, fileType: string): string {
  return `请分析以下${fileType}代码文件，检测其中的敏感信息。请重点关注：

1. API密钥和访问令牌（如AWS、Google、Azure等云服务密钥）
2. 数据库连接字符串和密码
3. 内网IP地址和私有URL
4. 硬编码的用户名和密码
5. 加密密钥和证书
6. 第三方服务的API密钥
7. 个人身份信息（邮箱、手机号等）
8. 财务信息（银行卡号、支付信息等）

文件名称：${fileName}
文件类型：${fileType}

代码内容：
\`\`\`${fileType}
${fileContent}
\`\`\`

请按照以下JSON格式返回检测结果，每个检测项包含：
- id: 唯一标识符
- type: 风险类型（如"API密钥"、"数据库密码"等）
- content: 具体描述
- severity: 风险等级（high/medium/low）
- lineNumber: 行号（如果可确定）
- codeSnippet: 相关代码片段

返回格式示例：
[
  {
    "id": "1",
    "type": "API密钥",
    "content": "检测到AWS API Key: AKIA...",
    "severity": "high",
    "lineNumber": 15,
    "codeSnippet": "const awsKey = 'AKIA...'"
  }
]

如果没有检测到敏感信息，返回空数组 []。`;
}

/**
 * 解析检测响应
 */
function parseDetectionResponse(response: string): CodeDetectionResult[] {
  try {
    // 尝试提取JSON部分
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('未找到有效的JSON响应');
      return [];
    }

    const jsonStr = jsonMatch[0];
    const results = JSON.parse(jsonStr);

    // 验证结果格式
    if (!Array.isArray(results)) {
      return [];
    }

    return results.map((item, index) => ({
      id: item.id || `detection-${index}`,
      type: item.type || '未知类型',
      content: item.content || '检测到敏感信息',
      severity: item.severity || 'medium',
      lineNumber: item.lineNumber,
      codeSnippet: item.codeSnippet,
    }));
  } catch (error) {
    console.error('解析检测结果失败:', error);
    // 如果解析失败，尝试手动提取信息
    return extractManualDetection(response);
  }
}

/**
 * 手动提取检测信息（备用方案）
 */
function extractManualDetection(response: string): CodeDetectionResult[] {
  const results: CodeDetectionResult[] = [];
  const lines = response.split('\n');
  let currentId = 1;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 检测API密钥
    if (trimmedLine.includes('API') && trimmedLine.includes('密钥')) {
      results.push({
        id: `manual-${currentId++}`,
        type: 'API密钥',
        content: trimmedLine,
        severity: 'high',
      });
    }
    // 检测密码
    else if (trimmedLine.includes('密码') || trimmedLine.includes('password')) {
      results.push({
        id: `manual-${currentId++}`,
        type: '密码',
        content: trimmedLine,
        severity: 'high',
      });
    }
    // 检测IP地址
    else if (trimmedLine.includes('IP') || trimmedLine.includes('内网')) {
      results.push({
        id: `manual-${currentId++}`,
        type: '内网地址',
        content: trimmedLine,
        severity: 'medium',
      });
    }
  }

  return results;
}

/**
 * 检测文件类型
 */
export function detectFileType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const typeMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'javascript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'sh': 'bash',
    'bash': 'bash',
    'ps1': 'powershell',
    'sql': 'sql',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'ini': 'ini',
    'cfg': 'config',
    'conf': 'config',
    'env': 'environment',
    'properties': 'properties',
  };

  return typeMap[extension || ''] || 'text';
}

/**
 * 验证文件是否为代码文件
 */
export function isCodeFile(fileName: string): boolean {
  const codeExtensions = [
    'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs',
    'swift', 'kt', 'scala', 'sh', 'bash', 'ps1', 'sql', 'json', 'xml', 'yaml', 'yml',
    'toml', 'ini', 'cfg', 'conf', 'env', 'properties'
  ];
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  return codeExtensions.includes(extension || '');
}


// ==================== 通用工具函数 ====================

/**
 * 处理API错误
 */
export function handleApiError(error: unknown): ApiResponse {
  console.error('API错误:', error);
  
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message
    };
  }
  
  return {
    success: false,
    error: '未知错误'
  };
}

/**
 * 验证必需参数
 */
export function validateRequiredParams(
  params: Record<string, any>,
  requiredFields: string[]
): string | null {
  for (const field of requiredFields) {
    if (!params[field]) {
      return `缺少必需参数: ${field}`;
    }
  }
  return null;
}
