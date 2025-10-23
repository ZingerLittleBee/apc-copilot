/**
 * Prompt检测处理器
 * 使用OpenAI流式聊天完成进行实时隐私风险检测
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createStreamingChatCompletion,
  createTextMessage,
  handleApiError,
  validateRequiredParams 
} from '../../lib/openai';

/**
 * 处理Prompt检测请求
 */
export async function handlePromptDetection(request: NextRequest, operation: string) {
  try {
    const body = await request.json();
    const { prompt } = body;

    // 验证必需参数
    const validationError = validateRequiredParams(body, ['prompt']);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, success: false },
        { status: 400 }
      );
    }

    // 构建系统提示词
    const systemPrompt = buildSystemPrompt();
    
    // 构建用户提示词
    const userPrompt = buildUserPrompt(prompt);

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          // 调用流式聊天完成
          const result = await createStreamingChatCompletion(
            {
              messages: [
                createTextMessage(systemPrompt, 'system'),
                createTextMessage(userPrompt, 'user')
              ],
              model: 'doubao-seed-1-6-251015',
              reasoning_effort: 'high',
            },
            (chunk) => {
              // 发送流式数据
              const data = JSON.stringify({
                type: 'chunk',
                content: chunk.content,
                reasoning: chunk.reasoning_content,
                done: chunk.done
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          );

          if (!result.success) {
            const errorData = JSON.stringify({
              type: 'error',
              error: result.error
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          }

          // 发送结束信号
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : '检测失败'
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * 构建系统提示词
 */
function buildSystemPrompt(): string {
  return `你是一个专业的隐私风险检测助手。你的任务是分析用户输入的Prompt，检测其中可能存在的隐私和安全风险。

请重点关注以下风险类型：

1. **客户隐私泄露风险**
   - 客户个人信息（姓名、电话、邮箱、身份证号等）
   - 客户名单、联系方式
   - 客户购买记录、消费习惯
   - 客户地址、位置信息

2. **商业机密风险**
   - 销售数据、财务数据
   - 商业计划、战略信息
   - 内部流程、运营数据
   - 合作伙伴信息

3. **敏感数据访问风险**
   - 数据库访问请求
   - 系统管理权限
   - 批量数据导出
   - 用户账号信息

4. **合规性风险**
   - 违反数据保护法规
   - 未经授权的数据使用
   - 数据跨境传输
   - 数据保留期限

请按照以下JSON格式返回检测结果：
{
  "risks": [
    {
      "id": "唯一标识符",
      "type": "风险类型",
      "description": "风险描述",
      "severity": "high|medium|low",
      "suggestion": "建议措施",
      "confidence": 0.0-1.0
    }
  ],
  "overallRisk": "high|medium|low",
  "blocked": true|false,
  "reasoning": "检测推理过程"
}

如果没有检测到风险，返回空的risks数组，overallRisk为"low"，blocked为false。`;
}

/**
 * 构建用户提示词
 */
function buildUserPrompt(prompt: string): string {
  return `请分析以下用户输入的Prompt，检测其中的隐私和安全风险：

用户Prompt：
"${prompt}"

请仔细分析这个Prompt是否涉及：
1. 客户隐私信息
2. 商业机密数据
3. 敏感系统访问
4. 合规性问题

请提供详细的风险评估和建议。`;
}

/**
 * 解析检测结果
 */
function parseDetectionResult(response: string): any {
  try {
    // 尝试提取JSON部分
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('未找到有效的JSON响应');
      return {
        risks: [],
        overallRisk: 'low',
        blocked: false,
        reasoning: response
      };
    }

    const jsonStr = jsonMatch[0];
    const result = JSON.parse(jsonStr);

    // 验证结果格式
    return {
      risks: result.risks || [],
      overallRisk: result.overallRisk || 'low',
      blocked: result.blocked || false,
      reasoning: result.reasoning || response
    };
  } catch (error) {
    console.error('解析检测结果失败:', error);
    return {
      risks: [],
      overallRisk: 'low',
      blocked: false,
      reasoning: response
    };
  }
}
