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
    const { prompt, industrySettings } = body;

    // 验证必需参数
    const validationError = validateRequiredParams(body, ['prompt']);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, success: false },
        { status: 400 }
      );
    }

    // 构建系统提示词
    const systemPrompt = buildSystemPrompt(industrySettings);
    
    // 构建用户提示词
    const userPrompt = buildUserPrompt(prompt, industrySettings);

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
function buildSystemPrompt(industrySettings?: any): string {
  let basePrompt = `你是一个专业的隐私风险检测助手。你的任务是分析用户输入的Prompt，检测其中可能存在的隐私和安全风险。

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
   - 数据保留期限`;

  // 添加行业特定检测规则
  if (industrySettings?.industry) {
    basePrompt += `\n\n**行业特定检测规则 (${getIndustryName(industrySettings.industry)}):**`;
    
    switch (industrySettings.industry) {
      case 'finance':
        basePrompt += `\n- 重点关注金融数据保护 (PCI DSS, SOX合规)
- 检测银行账户、信用卡、投资信息
- 关注反洗钱(AML)和反恐怖主义融资(CTF)相关数据`;
        break;
      case 'healthcare':
        basePrompt += `\n- 重点关注医疗隐私保护 (HIPAA合规)
- 检测患者健康信息、医疗记录、基因数据
- 关注临床试验数据和医疗设备信息`;
        break;
      case 'education':
        basePrompt += `\n- 重点关注教育隐私保护 (FERPA, COPPA合规)
- 检测学生信息、成绩记录、行为数据
- 关注未成年人数据保护`;
        break;
      case 'retail':
        basePrompt += `\n- 重点关注零售数据保护 (PCI DSS合规)
- 检测客户购买记录、支付信息、地址数据
- 关注消费者行为分析和个性化推荐数据`;
        break;
      case 'technology':
        basePrompt += `\n- 重点关注技术数据保护 (SOC 2, ISO 27001合规)
- 检测用户数据、算法模型、源代码
- 关注API密钥、云服务配置、系统日志`;
        break;
    }

    if (industrySettings.customCompliance) {
      basePrompt += `\n- 自定义合规要求: ${industrySettings.customCompliance}`;
    }

    if (industrySettings.riskTolerance) {
      const toleranceText: Record<string, string> = {
        'low': '严格检测模式 - 对任何潜在风险都发出警告',
        'medium': '平衡检测模式 - 重点关注中高风险项目',
        'high': '宽松检测模式 - 仅对高风险项目发出警告'
      };
      basePrompt += `\n- 风险偏好: ${toleranceText[industrySettings.riskTolerance] || '平衡检测模式'}`;
    }
  }

  basePrompt += `\n\n请按照以下JSON格式返回检测结果：
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

  return basePrompt;
}

/**
 * 获取行业名称
 */
function getIndustryName(industryId: string): string {
  const industryMap: Record<string, string> = {
    'finance': '金融服务',
    'healthcare': '医疗健康',
    'education': '教育培训',
    'manufacturing': '制造业',
    'retail': '零售电商',
    'technology': '科技互联网',
    'government': '政府机构',
    'consulting': '咨询服务'
  };
  return industryMap[industryId] || '通用';
}

/**
 * 构建用户提示词
 */
function buildUserPrompt(prompt: string, industrySettings?: any): string {
  let userPrompt = `请分析以下用户输入的Prompt，检测其中的隐私和安全风险：

用户Prompt：
"${prompt}"`;

  if (industrySettings?.industry) {
    userPrompt += `\n\n请特别关注${getIndustryName(industrySettings.industry)}行业的合规要求。`;
  }

  userPrompt += `\n\n请仔细分析这个Prompt是否涉及：
1. 客户隐私信息
2. 商业机密数据
3. 敏感系统访问
4. 合规性问题

请提供详细的风险评估和建议。`;

  return userPrompt;
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
