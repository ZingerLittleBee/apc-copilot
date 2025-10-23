"use client"

import { useState, useCallback, useRef } from "react"
import { StreamingDetection, StreamingDetectionRef } from "@/components/streaming-detection"
import { Shield, AlertTriangle, CheckCircle2, Send, Sparkles, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface RiskWarning {
  id: string
  type: string
  description: string
  severity: "high" | "medium" | "low"
  suggestion: string
}

interface PromptExample {
  id: string
  title: string
  prompt: string
  category: "safe" | "risky" | "dangerous"
}

const promptExamples: PromptExample[] = [
  {
    id: "1",
    title: "安全示例",
    prompt: "帮我生成一份产品介绍文案,突出我们的技术优势和创新特点",
    category: "safe",
  },
  {
    id: "2",
    title: "中风险示例",
    prompt: "分析一下我们公司去年的销售数据,找出增长最快的产品线",
    category: "risky",
  },
  {
    id: "3",
    title: "高风险示例",
    prompt: "生成我们公司客户名单的营销文案,包括他们的联系方式和购买记录",
    category: "dangerous",
  },
]

export default function PromptShieldPage() {
  const [prompt, setPrompt] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [warnings, setWarnings] = useState<RiskWarning[]>([])
  const [isBlocked, setIsBlocked] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const streamingDetectionRef = useRef<StreamingDetectionRef>(null)

  // 手动触发检测
  const handleManualDetection = () => {
    if (prompt.length >= 10) {
      setHasAnalyzed(false)
      setWarnings([])
      // 调用流式检测组件
      streamingDetectionRef.current?.startDetection(prompt)
    }
  }

  // 处理输入变化
  const handlePromptChange = (text: string) => {
    setPrompt(text)
  }

  // 处理检测完成
  const handleDetectionComplete = (result: any) => {
    if (result.risks && Array.isArray(result.risks)) {
      const detectedWarnings: RiskWarning[] = result.risks.map((risk: any) => ({
        id: risk.id,
        type: risk.type,
        description: risk.description,
        severity: risk.severity,
        suggestion: risk.suggestion,
      }))
      
      setWarnings(detectedWarnings)
      setIsBlocked(result.blocked || detectedWarnings.some((w) => w.severity === "high"))
    } else {
      setWarnings([])
      setIsBlocked(false)
    }
    setIsAnalyzing(false)
    setHasAnalyzed(true)
  }

  // 处理检测错误
  const handleDetectionError = (error: string) => {
    console.error('检测失败:', error)
    setIsAnalyzing(false)
    setHasAnalyzed(true)
  }

  const handleSubmit = () => {
    if (isBlocked) {
      return
    }
    // 模拟提交到 AI
    alert("Prompt 已通过安全检查,正在发送到 AI 模型...")
  }

  const loadExample = (example: PromptExample) => {
    handlePromptChange(example.prompt)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Prompt 防火墙 (PromptShield)</h1>
        <p className="text-muted-foreground mt-1">实时检测 Prompt 中的隐私风险,阻断潜在的数据泄露</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                输入 Prompt
              </CardTitle>
              <CardDescription>输入您想发送给 AI 的指令,系统将实时检测隐私风险</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <textarea
                  className="w-full min-h-[150px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="例如: 帮我分析一下用户行为数据..."
                  value={prompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                />
                {isAnalyzing && (
                  <div className="absolute top-2 right-2">
                    <Shield className="h-5 w-5 text-primary animate-pulse" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* 检测按钮 */}
                  <Button 
                    onClick={handleManualDetection}
                    disabled={prompt.length < 10}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    data-testid="detection-button"
                  >
                    <Shield className="h-4 w-4" />
                    检测隐私风险
                  </Button>
                  
                  {/* 状态显示 */}
                  {hasAnalyzed && warnings.length === 0 && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      安全
                    </Badge>
                  )}
                  {warnings.length > 0 && (
                    <Badge variant={isBlocked ? "destructive" : "default"}>
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      {isBlocked ? "已阻断" : `${warnings.length} 个警告`}
                    </Badge>
                  )}
                </div>
                <Button onClick={handleSubmit} disabled={isBlocked || !prompt.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  {isBlocked ? "已阻断" : "发送到 AI"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 流式检测组件 */}
          <StreamingDetection
            ref={streamingDetectionRef}
            onDetectionComplete={handleDetectionComplete}
            onError={handleDetectionError}
          />

          {warnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  检测到 {warnings.length} 项风险
                </CardTitle>
                <CardDescription>
                  {isBlocked ? "存在高风险项,已自动阻断此 Prompt" : "建议修改后再发送"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {warnings.map((warning) => (
                  <Alert key={warning.id} variant={warning.severity === "high" ? "destructive" : "default"}>
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={warning.severity === "high" ? "destructive" : "default"}>
                            {warning.severity === "high" ? "高风险" : warning.severity === "medium" ? "中风险" : "低风险"}
                          </Badge>
                          <span className="font-medium">{warning.type}</span>
                        </div>
                        <p className="text-sm">{warning.description}</p>
                        <div className="flex items-start gap-2 mt-2 p-2 bg-muted/50 rounded">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">建议: </span>
                            {warning.suggestion}
                          </p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>示例 Prompt</CardTitle>
              <CardDescription>点击加载示例查看检测效果</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {promptExamples.map((example) => (
                <Card
                  key={example.id}
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => loadExample(example)}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-sm">{example.title}</CardTitle>
                      <Badge
                        variant={
                          example.category === "safe"
                            ? "outline"
                            : example.category === "risky"
                              ? "default"
                              : "destructive"
                        }
                      >
                        {example.category === "safe" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : example.category === "risky" ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{example.prompt}</p>
                  </CardHeader>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">防护规则</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">客户隐私保护</p>
                  <p className="text-muted-foreground">阻止涉及客户个人信息的请求</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">商业机密防护</p>
                  <p className="text-muted-foreground">检测敏感商业数据访问</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">数据导出控制</p>
                  <p className="text-muted-foreground">限制批量数据导出操作</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

