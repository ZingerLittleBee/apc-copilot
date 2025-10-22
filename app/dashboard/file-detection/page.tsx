"use client"

import { useState } from "react"
import { Upload, FileText, Image as ImageIcon, Code, Shield, CheckCircle2, AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type FileType = "image" | "document" | "code"
type DetectionStatus = "idle" | "uploading" | "detecting" | "completed"

interface RiskItem {
  id: string
  type: string
  content: string
  severity: "high" | "medium" | "low"
  position?: { x: number; y: number; width: number; height: number }
}

export default function FileDetectionPage() {
  const [status, setStatus] = useState<DetectionStatus>("idle")
  const [fileType, setFileType] = useState<FileType | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [progress, setProgress] = useState(0)
  const [risks, setRisks] = useState<RiskItem[]>([])
  const [showComparison, setShowComparison] = useState(false)

  // 模拟文件上传和检测
  const handleFileUpload = (type: FileType) => {
    setFileType(type)
    setFileName(type === "image" ? "company-photo.jpg" : type === "document" ? "contract.pdf" : "api-config.js")
    setStatus("uploading")
    setProgress(0)

    // 模拟上传进度
    const uploadInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(uploadInterval)
          setStatus("detecting")
          simulateDetection(type)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  // 模拟 AI 检测过程
  const simulateDetection = (type: FileType) => {
    setTimeout(() => {
      const mockRisks: Record<FileType, RiskItem[]> = {
        image: [
          { id: "1", type: "人脸信息", content: "检测到 3 张未授权人脸", severity: "high", position: { x: 20, y: 30, width: 30, height: 40 } },
          { id: "2", type: "身份证号", content: "检测到身份证号码", severity: "high", position: { x: 60, y: 70, width: 35, height: 10 } },
          { id: "3", type: "公司 Logo", content: "检测到未授权品牌标识", severity: "medium", position: { x: 10, y: 10, width: 15, height: 15 } },
        ],
        document: [
          { id: "1", type: "客户信息", content: "检测到 15 条客户姓名和联系方式", severity: "high" },
          { id: "2", type: "银行账号", content: "检测到 3 个银行账号", severity: "high" },
          { id: "3", type: "合同金额", content: "检测到商业敏感金额信息", severity: "medium" },
          { id: "4", type: "签名", content: "检测到手写签名", severity: "medium" },
        ],
        code: [
          { id: "1", type: "API 密钥", content: "检测到 AWS API Key", severity: "high" },
          { id: "2", type: "数据库密码", content: "检测到数据库连接密码", severity: "high" },
          { id: "3", type: "内网 IP", content: "检测到内网 IP 地址", severity: "medium" },
          { id: "4", type: "用户数据", content: "检测到测试用户真实邮箱", severity: "low" },
        ],
      }

      setRisks(mockRisks[type])
      setStatus("completed")
    }, 2000)
  }

  // 执行脱敏
  const handleDesensitize = () => {
    setShowComparison(true)
  }

  // 重置
  const handleReset = () => {
    setStatus("idle")
    setFileType(null)
    setFileName("")
    setProgress(0)
    setRisks([])
    setShowComparison(false)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">文件检测与脱敏</h1>
          <p className="text-muted-foreground mt-1">上传文件进行隐私信息检测和自动脱敏处理</p>
        </div>
        {status !== "idle" && (
          <Button variant="outline" onClick={handleReset}>
            <X className="mr-2 h-4 w-4" />
            重新开始
          </Button>
        )}
      </div>

      {status === "idle" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => handleFileUpload("image")}>
            <CardHeader>
              <ImageIcon className="h-12 w-12 text-primary mb-2" />
              <CardTitle>图像文件</CardTitle>
              <CardDescription>检测图片中的人脸、身份证、车牌等敏感信息</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                上传图像
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => handleFileUpload("document")}>
            <CardHeader>
              <FileText className="h-12 w-12 text-primary mb-2" />
              <CardTitle>文档文件</CardTitle>
              <CardDescription>检测 PDF、Word 中的客户信息、合同条款等</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                上传文档
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => handleFileUpload("code")}>
            <CardHeader>
              <Code className="h-12 w-12 text-primary mb-2" />
              <CardTitle>代码文件</CardTitle>
              <CardDescription>检测代码中的 API 密钥、密码、内网地址等</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                上传代码
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {(status === "uploading" || status === "detecting") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary animate-pulse" />
              {status === "uploading" ? "正在上传文件..." : "AI 正在检测隐私信息..."}
            </CardTitle>
            <CardDescription>{fileName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={status === "uploading" ? progress : 100} />
            <p className="text-sm text-muted-foreground">
              {status === "uploading" ? `上传进度: ${progress}%` : "正在使用 AI 模型分析文件内容..."}
            </p>
          </CardContent>
        </Card>
      )}

      {status === "completed" && !showComparison && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                检测结果
              </CardTitle>
              <CardDescription>发现 {risks.length} 项隐私风险</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {risks.map((risk) => (
                <Alert key={risk.id} variant={risk.severity === "high" ? "destructive" : "default"}>
                  <AlertDescription className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={risk.severity === "high" ? "destructive" : risk.severity === "medium" ? "default" : "outline"}>
                          {risk.severity === "high" ? "高风险" : risk.severity === "medium" ? "中风险" : "低风险"}
                        </Badge>
                        <span className="font-medium">{risk.type}</span>
                      </div>
                      <p className="text-sm">{risk.content}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>文件预览</CardTitle>
              <CardDescription>风险区域已标注</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  {fileType === "image" ? "图像预览" : fileType === "document" ? "文档预览" : "代码预览"}
                </div>
                {fileType === "image" && risks.map((risk) => (
                  risk.position && (
                    <div
                      key={risk.id}
                      className="absolute border-2 border-destructive bg-destructive/10"
                      style={{
                        left: `${risk.position.x}%`,
                        top: `${risk.position.y}%`,
                        width: `${risk.position.width}%`,
                        height: `${risk.position.height}%`,
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-destructive text-white text-xs px-2 py-1 rounded">
                        {risk.type}
                      </div>
                    </div>
                  )
                ))}
              </div>
              <Button className="w-full mt-4" onClick={handleDesensitize}>
                <Shield className="mr-2 h-4 w-4" />
                执行自动脱敏
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showComparison && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              脱敏完成
            </CardTitle>
            <CardDescription>所有隐私信息已安全处理</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="before">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="before">脱敏前</TabsTrigger>
                <TabsTrigger value="after">脱敏后</TabsTrigger>
              </TabsList>
              <TabsContent value="before" className="space-y-4">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    原始文件（含敏感信息）
                  </div>
                </div>
                <div className="grid gap-2">
                  {risks.map((risk) => (
                    <div key={risk.id} className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-muted-foreground">{risk.type}:</span>
                      <span>{risk.content}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="after" className="space-y-4">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-green-600">
                    ✓ 已脱敏文件（安全）
                  </div>
                </div>
                <div className="grid gap-2">
                  {risks.map((risk) => (
                    <div key={risk.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">{risk.type}:</span>
                      <span className="text-green-600">已脱敏处理</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

