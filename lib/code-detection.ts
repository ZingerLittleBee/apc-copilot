/**
 * 服务端代码检测工具
 * 使用 OpenAI 检测代码中的敏感信息
 */

import { createChatCompletion, createTextMessage } from './openai';

// 检测结果类型定义
export interface CodeDetectionResult {
  id: string;
  type: string;
  content: string;
  severity: "high" | "medium" | "low";
  lineNumber?: number;
  codeSnippet?: string;
}

// 检测配置
export interface CodeDetectionOptions {
  fileContent: string;
  fileName: string;
  fileType: string;
}

/**
 * 使用 OpenAI 检测代码中的敏感信息
 */
export async function detectCodeSensitiveInfo(
  options: CodeDetectionOptions
): Promise<CodeDetectionResult[]> {
  const { fileContent, fileName, fileType } = options;

  // 构建检测提示词
  const prompt = buildDetectionPrompt(fileContent, fileName, fileType);

  try {
    const response = await createChatCompletion({
      messages: [createTextMessage(prompt)],
      model: 'doubao-seed-1-6-251015',
      reasoning_effort: 'high',
    });

    // 解析 OpenAI 响应
    const results = parseDetectionResponse(response.content);
    return results;
  } catch (error) {
    console.error('代码检测失败:', error);
    throw new Error('代码检测失败，请重试');
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
 * 解析 OpenAI 响应
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
