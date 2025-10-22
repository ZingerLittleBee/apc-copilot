"use client"

import { useState } from "react"
import { Shield, AlertTriangle, CheckCircle2, Eye, Sparkles, RefreshCw, Image as ImageIcon, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ComplianceIssue {
  id: string
  type: "copyright" | "portrait" | "brand" | "content"
  title: string
  description: string
  severity: "high" | "medium" | "low"
  suggestion: string
  autoFix?: string
}

interface AIOutput {
  id: string
  type: "image" | "text"
  title: string
  content: string
  preview?: string
}

const mockOutputs: AIOutput[] = [
  {
    id: "1",
    type: "image",
    title: "产品营销海报",
    content: "AI 生成的产品宣传海报,包含人物形象和品牌元素",
    preview: "marketing-poster.jpg",
  },
  {
    id: "2",
    type: "text",
    title: "营销文案",
    content: "我们的产品采用了业界领先的技术,就像 Apple 的设计理念一样注重用户体验。我们的团队成员包括前 Google 工程师...",
  },
  {
    id: "3",
    type: "image",
    title: "社交媒体配图",
    content: "AI 生成的社交媒体配图,包含明星肖像",
    preview: "social-media.jpg",
  },
]

export default function OutputReviewPage() {
  const [selectedOutput, setSelectedOutput] = useState<AIOutput | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)
  const [issues, setIssues] = useState<ComplianceIssue[]>([])
  const [hasReviewed, setHasReviewed] = useState(false)
  const [showFixed, setShowFixed] = useState(false)

  const reviewOutput = (output: AIOutput) => {
    setSelectedOutput(output)
    setIsReviewing(true)
    setHasReviewed(false)
    setShowFixed(false)

    setTimeout(() => {
      const detectedIssues: ComplianceIssue[] = []

      if (output.id === "1") {
        detectedIssues.push(
          {
            id: "1",
            type: "portrait",
            title: "未授权肖像使用",
            description: "检测到 AI 生成的人物形象可能侵犯肖像权",
            severity: "high",
            suggestion: "建议使用已授权的模特图片或抽象化人物形象",
            autoFix: "已自动替换为授权素材库中的相似形象",
          },
          {
            id: "2",
            type: "brand",
            title: "品牌标识风险",
            description: "检测到与知名品牌相似的视觉元素",
            severity: "medium",
            suggestion: "建议修改设计元素以避免品牌混淆",
            autoFix: "已调整配色方案和图形元素",
          }
        )
      } else if (output.id === "2") {
        detectedIssues.push(
          {
            id: "1",
            type: "brand",
            title: "未授权品牌引用",
            description: "文案中提及 'Apple' 和 'Google' 等品牌名称",
            severity: "medium",
            suggestion: "建议使用通用描述替代具体品牌名称",
            autoFix: "已替换为 '行业领先企业' 等通用表述",
          },
          {
            id: "2",
            type: "content",
            title: "虚假宣传风险",
            description: "检测到可能构成虚假宣传的表述",
            severity: "high",
            suggestion: "建议使用可验证的事实性描述",
            autoFix: "已修改为客观描述并添加免责声明",
          }
        )
      } else if (output.id === "3") {
        detectedIssues.push(
          {
            id: "1",
            type: "portrait",
            title: "明星肖像侵权",
            description: "检测到疑似明星肖像,存在严重侵权风险",
            severity: "high",
            suggestion: "必须获得肖像权授权或完全移除",
            autoFix: "已替换为授权素材库中的模特形象",
          },
          {
            id: "2",
            type: "copyright",
            title: "版权素材检测",
            description: "背景图案与版权素材库中的作品相似度较高",
            severity: "medium",
            suggestion: "建议重新生成或使用免费素材",
            autoFix: "已替换为原创设计元素",
          }
        )
      }

      setIssues(detectedIssues)
      setIsReviewing(false)
      setHasReviewed(true)
    }, 1500)
  }

  const applyAutoFix = () => {
    setShowFixed(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">AI 输出内容审查</h1>
        <p className="text-muted-foreground mt-1">审查 AI 生成内容的版权、肖像权与品牌合规风险</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI 生成内容
            </CardTitle>
            <CardDescription>选择要审查的内容</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockOutputs.map((output) => (
              <Card
                key={output.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedOutput?.id === output.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => reviewOutput(output)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-start gap-3">
                    {output.type === "image" ? (
                      <ImageIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm mb-1">{output.title}</CardTitle>
                      <p className="text-xs text-muted-foreground line-clamp-2">{output.content}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {!selectedOutput && (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">选择左侧的 AI 生成内容开始审查</p>
              </CardContent>
            </Card>
          )}

          {selectedOutput && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {isReviewing ? (
                          <>
                            <Shield className="h-5 w-5 text-primary animate-pulse" />
                            正在审查内容...
                          </>
                        ) : (
                          <>
                            <Eye className="h-5 w-5 text-primary" />
                            {selectedOutput.title}
                          </>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {isReviewing ? "AI 正在检测版权、肖像权和品牌风险..." : selectedOutput.content}
                      </CardDescription>
                    </div>
                    {hasReviewed && (
                      <Badge variant={issues.length > 0 ? "destructive" : "outline"}>
                        {issues.length > 0 ? `${issues.length} 个问题` : "通过审查"}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!showFixed ? (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-muted-foreground mb-2">
                          {selectedOutput.type === "image" ? "AI 生成图像预览" : "AI 生成文本内容"}
                        </p>
                        {selectedOutput.type === "text" && (
                          <div className="max-w-md mx-auto p-4 bg-background rounded border text-sm text-left">
                            {selectedOutput.content}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-green-50 dark:bg-green-950 rounded-lg flex items-center justify-center border-2 border-green-600">
                      <div className="text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
                        <p className="text-green-600 font-medium">已修复的内容</p>
                        <p className="text-sm text-muted-foreground mt-1">所有合规问题已自动处理</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {hasReviewed && issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          检测到 {issues.length} 项合规问题
                        </CardTitle>
                        <CardDescription>建议修复后再发布</CardDescription>
                      </div>
                      {!showFixed && (
                        <Button onClick={applyAutoFix}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          自动修复
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue={showFixed ? "fixed" : "issues"}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="issues">问题详情</TabsTrigger>
                        <TabsTrigger value="fixed" disabled={!showFixed}>
                          修复方案
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="issues" className="space-y-3 mt-4">
                        {issues.map((issue) => (
                          <Alert key={issue.id} variant={issue.severity === "high" ? "destructive" : "default"}>
                            <AlertDescription>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      issue.type === "copyright"
                                        ? "default"
                                        : issue.type === "portrait"
                                          ? "destructive"
                                          : "outline"
                                    }
                                  >
                                    {issue.type === "copyright"
                                      ? "版权"
                                      : issue.type === "portrait"
                                        ? "肖像权"
                                        : issue.type === "brand"
                                          ? "品牌"
                                          : "内容"}
                                  </Badge>
                                  <Badge variant={issue.severity === "high" ? "destructive" : "default"}>
                                    {issue.severity === "high" ? "高风险" : issue.severity === "medium" ? "中风险" : "低风险"}
                                  </Badge>
                                  <span className="font-medium">{issue.title}</span>
                                </div>
                                <p className="text-sm">{issue.description}</p>
                                <div className="flex items-start gap-2 mt-2 p-2 bg-muted/50 rounded">
                                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">建议: </span>
                                    {issue.suggestion}
                                  </p>
                                </div>
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </TabsContent>
                      <TabsContent value="fixed" className="space-y-3 mt-4">
                        {issues.map((issue) => (
                          <Alert key={issue.id} variant="default" className="border-green-600">
                            <AlertDescription>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <span className="font-medium text-green-600">{issue.title} - 已修复</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{issue.autoFix}</p>
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                        <div className="flex items-center justify-center pt-4">
                          <Button className="w-full" size="lg">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            确认发布修复后的内容
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}

              {hasReviewed && issues.length === 0 && (
                <Alert variant="default" className="border-green-600">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-600">内容审查通过</p>
                        <p className="text-sm text-muted-foreground mt-1">未检测到版权、肖像权或品牌合规问题</p>
                      </div>
                      <Button>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        确认发布
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

