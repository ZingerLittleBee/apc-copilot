"use client"

import { useState } from "react"
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

  // 模拟实时检测
  const analyzePrompt = (text: string) => {
    setPrompt(text)
    if (text.length < 10) {
      setWarnings([])
      setIsBlocked(false)
      setHasAnalyzed(false)
      return
    }

    setIsAnalyzing(true)
    setHasAnalyzed(false)

    setTimeout(() => {
      const detectedWarnings: RiskWarning[] = []

      // 检测客户隐私
      if (text.includes("客户") || text.includes("名单") || text.includes("联系方式")) {
        detectedWarnings.push({
          id: "1",
          type: "客户隐私泄露",
          description: "检测到可能涉及客户个人信息的请求",
          severity: "high",
          suggestion: "建议使用匿名化或脱敏后的数据进行分析",
        })
      }

      // 检测商业机密
      if (text.includes("销售数据") || text.includes("财务") || text.includes("商业计划")) {
        detectedWarnings.push({
          id: "2",
          type: "商业机密风险",
          description: "检测到可能涉及公司商业机密的内容",
          severity: "medium",
          suggestion: "建议在安全环境中处理敏感商业数据",
        })
      }

      // 检测敏感操作
      if (text.includes("购买记录") || text.includes("交易") || text.includes("账号")) {
        detectedWarnings.push({
          id: "3",
          type: "敏感数据访问",
          description: "检测到对敏感数据的访问请求",
          severity: "high",
          suggestion: "需要额外的权限验证和审计日志",
        })
      }

      // 检测数据导出
      if (text.includes("导出") || text.includes("下载") || text.includes("生成列表")) {
        detectedWarnings.push({
          id: "4",
          type: "数据导出风险",
          description: "检测到批量数据导出意图",
          severity: "medium",
          suggestion: "建议限制导出数据量并记录操作日志",
        })
      }

      setWarnings(detectedWarnings)
      setIsBlocked(detectedWarnings.some((w) => w.severity === "high"))
      setIsAnalyzing(false)
      setHasAnalyzed(true)
    }, 800)
  }

  const handleSubmit = () => {
    if (isBlocked) {
      return
    }
    // 模拟提交到 AI
    alert("Prompt 已通过安全检查,正在发送到 AI 模型...")
  }

  const loadExample = (example: PromptExample) => {
    analyzePrompt(example.prompt)
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
                  onChange={(e) => analyzePrompt(e.target.value)}
                />
                {isAnalyzing && (
                  <div className="absolute top-2 right-2">
                    <Shield className="h-5 w-5 text-primary animate-pulse" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
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

