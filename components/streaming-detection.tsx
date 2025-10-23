/**
 * AI思考过程显示组件
 * 当用户输入完prompt后，显示AI的思考检查过程
 */

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Shield, Brain, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StreamingDetectionProps {
  onDetectionComplete: (result: any) => void;
  onError: (error: string) => void;
}

interface DetectionResult {
  risks: Array<{
    id: string;
    type: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    suggestion: string;
  }>;
  overallRisk: 'high' | 'medium' | 'low';
  blocked: boolean;
  reasoning: string;
}

export const StreamingDetection = forwardRef<StreamingDetectionRef, StreamingDetectionProps>(
  ({ onDetectionComplete, onError }, ref) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [reasoningContent, setReasoningContent] = useState('');
    const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);

    // 开始检测
    const startDetection = async (prompt: string) => {
      if (!prompt || prompt.length < 10) {
        setDetectionResult(null);
        return;
      }

      setIsAnalyzing(true);
      setReasoningContent('');
      setDetectionResult(null);

      try {
        const response = await fetch('/api?type=prompt-detection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          throw new Error('检测失败');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('无法读取响应流');
        }

        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                // 处理完整响应
                try {
                  const result = JSON.parse(fullResponse);
                  const detectionResult: DetectionResult = {
                    risks: result.risks || [],
                    overallRisk: result.overallRisk || 'low',
                    blocked: result.blocked || false,
                    reasoning: result.reasoning || fullResponse
                  };

                  setDetectionResult(detectionResult);
                  onDetectionComplete(detectionResult);
                } catch (parseError) {
                  console.error('解析检测结果失败:', parseError);
                  onError('解析检测结果失败');
                }
                setIsAnalyzing(false);
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'chunk') {
                  fullResponse += parsed.content;

                  if (parsed.reasoning) {
                    setReasoningContent(prev => prev + parsed.reasoning);
                  }
                } else if (parsed.type === 'error') {
                  throw new Error(parsed.error);
                }
              } catch (parseError) {
                // 忽略解析错误，继续处理
              }
            }
          }
        }
      } catch (error) {
        console.error('检测失败:', error);
        onError(error instanceof Error ? error.message : '检测失败');
        setIsAnalyzing(false);
      }
    };

    // 重置状态
    const reset = () => {
      setReasoningContent('');
      setIsAnalyzing(false);
      setDetectionResult(null);
    };

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      startDetection,
      reset
    }));

    return (
      <div className="space-y-4">
        {/* AI思考过程显示 */}
        {isAnalyzing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600 animate-pulse" />
                AI正在思考...
                <Badge variant="secondary" className="animate-pulse">
                  分析中
                </Badge>
              </CardTitle>
              <CardDescription>
                AI正在分析您的输入内容，检测潜在的隐私和安全风险
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 思考过程显示 */}
              <div className="bg-blue-50 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-blue-800">思考过程</span>
                </div>
                <div className="text-sm text-blue-700 whitespace-pre-wrap min-h-[60px]">
                  {reasoningContent || '正在分析输入内容...'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

// 导出用于ref的方法
export interface StreamingDetectionRef {
  startDetection: (prompt: string) => Promise<void>;
  reset: () => void;
}

// 设置displayName用于调试
StreamingDetection.displayName = 'StreamingDetection';
