"use client";

import { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Code,
  Shield,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { detectAndMapImage } from "@/request/image";
import ExcelViewerClient from "./_components/ExcelViewer";
import { PPTViewerClient } from "./_components/PPTViewer";
import { DocxViewer } from "./_components/DocxViewer";
import { extractPDFText } from "@/lib/getPdfText";
// 移除直接导入，改为使用API调用

// 代码检测结果类型定义
interface CodeDetectionResult {
  id: string;
  type: string;
  content: string;
  severity: "high" | "medium" | "low";
  lineNumber?: number;
  codeSnippet?: string;
}

type FileType = "image" | "document" | "code";
type DetectionStatus =
  | "idle"
  | "uploading"
  | "detecting"
  | "completed"
  | "error";

interface RiskItem {
  id: string;
  type: string;
  content: string;
  severity: "high" | "medium" | "low";
  position?: { x: number; y: number; width: number; height: number };
  lineNumber?: number;
  codeSnippet?: string;
}

// 计算图像在容器中的实际显示位置和尺寸
interface ImageDisplayInfo {
  displayWidth: number;
  displayHeight: number;
  offsetX: number;
  offsetY: number;
}

export default function FileDetectionPage() {
  const [status, setStatus] = useState<DetectionStatus>("idle");
  const [fileType, setFileType] = useState<FileType | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedCodeContent, setUploadedCodeContent] = useState<string | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageDisplayInfo, setImageDisplayInfo] =
    useState<ImageDisplayInfo | null>(null);

  // 文档
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [ext, setExt] = useState<string>("");
  console.log("ext", ext);

  // 计算图像在容器中的实际显示信息
  const calculateImageDisplayInfo = (): ImageDisplayInfo | null => {
    const img = imageRef.current;
    if (!img) return null;

    const containerWidth = img.parentElement?.clientWidth || 0;
    const containerHeight = img.parentElement?.clientHeight || 0;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    if (
      !naturalWidth ||
      !naturalHeight ||
      !containerWidth ||
      !containerHeight
    ) {
      return null;
    }

    // 计算图像的宽高比
    const imageAspectRatio = naturalWidth / naturalHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let displayWidth: number;
    let displayHeight: number;
    let offsetX: number;
    let offsetY: number;

    // object-contain 的逻辑:图像会缩放以完全适应容器,保持宽高比
    if (imageAspectRatio > containerAspectRatio) {
      // 图像更宽,以容器宽度为准
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspectRatio;
      offsetX = 0;
      offsetY = (containerHeight - displayHeight) / 2;
    } else {
      // 图像更高,以容器高度为准
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageAspectRatio;
      offsetX = (containerWidth - displayWidth) / 2;
      offsetY = 0;
    }

    return {
      displayWidth,
      displayHeight,
      offsetX,
      offsetY,
    };
  };

  // 当图像加载完成时计算显示信息
  const handleImageLoad = () => {
    const info = calculateImageDisplayInfo();
    setImageDisplayInfo(info);
  };

  // 监听窗口大小变化,重新计算显示信息
  // biome-ignore lint/correctness/useExhaustiveDependencies: static function
  useEffect(() => {
    if (!uploadedImage) return;

    const handleResize = () => {
      const info = calculateImageDisplayInfo();
      setImageDisplayInfo(info);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [uploadedImage]);

  // 处理图像文件选择
  const handleImageSelect = () => {
    imageInputRef.current?.click();
  };

  // 处理代码文件选择
  const handleCodeSelect = () => {
    codeInputRef.current?.click();
  };

  // 处理文档文件选择
  const handleDocumentSelect = () => {
    documentInputRef.current?.click();
  };

  // 处理图像文件变化
  const handleImageFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      setErrorMessage("请选择图像文件");
      setStatus("error");
      return;
    }

    setFileType("image");
    setFileName(file.name);
    setStatus("uploading");
    setProgress(0);
    setErrorMessage("");

    // 创建图像预览
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);

    // 模拟上传进度
    const uploadInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          setStatus("detecting");
          performRealImageDetection(file);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // 处理代码文件变化
  const handleCodeFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const codeExtensions = [
      "js",
      "ts",
      "jsx",
      "tsx",
      "py",
      "java",
      "cpp",
      "c",
      "cs",
      "php",
      "rb",
      "go",
      "rs",
      "swift",
      "kt",
      "scala",
      "sh",
      "bash",
      "ps1",
      "sql",
      "json",
      "xml",
      "yaml",
      "yml",
      "toml",
      "ini",
      "cfg",
      "conf",
      "env",
      "properties",
    ];

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !codeExtensions.includes(extension)) {
      setErrorMessage(
        "请选择代码文件（支持 .js, .py, .java, .cpp, .json 等格式）"
      );
      setStatus("error");
      return;
    }

    setFileType("code");
    setFileName(file.name);
    setStatus("uploading");
    setProgress(0);
    setErrorMessage("");

    // 读取文件内容
    try {
      const content = await readFileContent(file);
      setUploadedCodeContent(content);

      // 模拟上传进度
      const uploadInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(uploadInterval);
            setStatus("detecting");
            performRealCodeDetection(file);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    } catch (error) {
      setErrorMessage("读取文件失败");
      setStatus("error");
    }
  };

  // 处理文档文件变化
  const handleDocumentFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const type = "document";

    setFileType(type);
    setFileName(file.name);
    setStatus("uploading");
    setProgress(0);
    setErrorMessage("");

    const fileUrl = URL.createObjectURL(file);
    setPdfUrl(fileUrl);
    setExt(file.name.split(".").pop()?.toLowerCase() || "");

    // 模拟上传进度
    const uploadInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          setStatus("detecting");
          // simulateDetection(type);
          performRealDocumentDetection(file);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // 读取文件内容
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => {
        reject(new Error("读取文件失败"));
      };
      reader.readAsText(file, "UTF-8");
    });
  };

  // 执行真实的图像检测
  const performRealImageDetection = async (file: File) => {
    try {
      const results = await detectAndMapImage(file);

      // 将 MappedDetectionResult 转换为 RiskItem
      const riskItems: RiskItem[] = results.map((result) => ({
        id: result.id,
        type: result.type,
        content: result.content,
        severity: result.severity,
        position: result.position,
      }));

      setRisks(riskItems);
      setStatus("completed");
    } catch (error) {
      console.error("检测失败:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "检测失败,请重试"
      );
      setStatus("error");
    }
  };

  // 执行真实的代码检测（通过API）
  const performRealCodeDetection = async (file: File) => {
    try {
      // 读取文件内容
      const fileContent = await readFileContent(file);

      // 调用统一API进行检测
      const response = await fetch("/api/ai?type=code-detection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileContent,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "检测失败");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "检测失败");
      }

      // 将 CodeDetectionResult 转换为 RiskItem
      const riskItems: RiskItem[] = data.results.map(
        (result: CodeDetectionResult) => ({
          id: result.id,
          type: result.type,
          content: result.content,
          severity: result.severity,
          lineNumber: result.lineNumber,
          codeSnippet: result.codeSnippet,
        })
      );

      setRisks(riskItems);
      setStatus("completed");
    } catch (error) {
      console.error("代码检测失败:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "代码检测失败,请重试"
      );
      setStatus("error");
    }
  };

  // 执行真实的文档检测
  const performRealDocumentDetection = async (file: File) => {
    try {
      // 读取文件内容
      let fileContent = await readFileContent(file);

      if (file.type === "application/pdf") {
        // 读取 PDF 内容
        const pdfArrayBuffer = await file.arrayBuffer();
        fileContent = await extractPDFText(pdfArrayBuffer);
      }

      // 调用统一API进行检测
      const response = await fetch("/api/ai?type=document-detection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileContent,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "检测失败");
      }

      const data = await response.json();

      console.log("data", data);

      if (!data.success) {
        throw new Error(data.error || "检测失败");
      }

      // 将检测结果转换为 RiskItem
      const riskItems: RiskItem[] = data.results.map((result: any) => ({
        id: result.id,
        type: result.type,
        content: result.content,
        severity: result.severity,
        lineNumber: result.lineNumber,
        codeSnippet: result.codeSnippet,
      }));

      setRisks(riskItems);
      setStatus("completed");
    } catch (error) {
      console.error("文档检测失败:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "文档检测失败,请重试"
      );
      setStatus("error");
    }
  };

  // 处理文件上传
  const handleFileUpload = (type: FileType) => {
    if (type === "image") {
      handleImageSelect();
      return;
    }

    if (type === "code") {
      handleCodeSelect();
      return;
    }

    if (type === "document") {
      handleDocumentSelect();
      return;
    }
  };

  // 模拟 AI 检测过程（仅用于文档和代码）
  const simulateDetection = (type: FileType) => {
    setTimeout(() => {
      const mockRisks: Record<FileType, RiskItem[]> = {
        image: [],
        document: [
          {
            id: "1",
            type: "客户信息",
            content: "检测到 15 条客户姓名和联系方式",
            severity: "high",
          },
          {
            id: "2",
            type: "银行账号",
            content: "检测到 3 个银行账号",
            severity: "high",
          },
          {
            id: "3",
            type: "合同金额",
            content: "检测到商业敏感金额信息",
            severity: "medium",
          },
          {
            id: "4",
            type: "签名",
            content: "检测到手写签名",
            severity: "medium",
          },
        ],
        code: [
          {
            id: "1",
            type: "API 密钥",
            content: "检测到 AWS API Key",
            severity: "high",
          },
          {
            id: "2",
            type: "数据库密码",
            content: "检测到数据库连接密码",
            severity: "high",
          },
          {
            id: "3",
            type: "内网 IP",
            content: "检测到内网 IP 地址",
            severity: "medium",
          },
          {
            id: "4",
            type: "用户数据",
            content: "检测到测试用户真实邮箱",
            severity: "low",
          },
        ],
      };

      setRisks(mockRisks[type]);
      setStatus("completed");
    }, 2000);
  };

  // 执行脱敏
  const handleDesensitize = () => {
    setShowComparison(true);
  };

  // 重置
  const handleReset = () => {
    setStatus("idle");
    setFileType(null);
    setFileName("");
    setProgress(0);
    setRisks([]);
    setShowComparison(false);
    setErrorMessage("");
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage);
      setUploadedImage(null);
    }
    setUploadedCodeContent(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    if (codeInputRef.current) {
      codeInputRef.current.value = "";
    }
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
  };

  // 在组件卸载时清理
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* 隐藏的文件输入 */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />
      <input
        ref={codeInputRef}
        type="file"
        accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.sh,.bash,.ps1,.sql,.json,.xml,.yaml,.yml,.toml,.ini,.cfg,.conf,.env,.properties"
        className="hidden"
        onChange={handleCodeFileChange}
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.xlsx,.xls,.ppt,.pptx"
        className="hidden"
        onChange={handleDocumentFileChange}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">文件检测与脱敏</h1>
          <p className="text-muted-foreground mt-1">
            上传文件进行隐私信息检测和自动脱敏处理
          </p>
        </div>
        {status !== "idle" && (
          <Button variant="outline" onClick={handleReset}>
            <X className="mr-2 h-4 w-4" />
            重新开始
          </Button>
        )}
      </div>

      {/* 错误提示 */}
      {status === "error" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage || "操作失败,请重试"}
          </AlertDescription>
        </Alert>
      )}

      {status === "idle" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <ImageIcon className="h-12 w-12 text-primary mb-2" />
              <CardTitle>图像文件</CardTitle>
              <CardDescription>
                检测图片中的人脸、敏感内容等信息
                <br />
                （支持 JPG、PNG、GIF 等格式）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => handleFileUpload("image")}
              >
                <Upload className="mr-2 h-4 w-4" />
                上传图像
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <FileText className="h-12 w-12 text-primary mb-2" />
              <CardTitle>文档文件</CardTitle>
              <CardDescription>
                检测 PDF、Word 中的客户信息、合同条款等
                <br />
                （支持 PDF、Word、Excel、PPT 等格式）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => handleFileUpload("document")}
              >
                <Upload className="mr-2 h-4 w-4" />
                上传文档
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <Code className="h-12 w-12 text-primary mb-2" />
              <CardTitle>代码文件</CardTitle>
              <CardDescription>
                检测代码中的 API 密钥、密码、内网地址等
                <br />
                （支持 JS、Python、Java、C++ 等）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => handleFileUpload("code")}
              >
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
              {status === "uploading"
                ? "正在上传文件..."
                : "AI 正在检测隐私信息..."}
            </CardTitle>
            <CardDescription>{fileName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={status === "uploading" ? progress : 100} />
            <p className="text-sm text-muted-foreground">
              {status === "uploading"
                ? `上传进度: ${progress}%`
                : "正在使用 AI 模型分析文件内容..."}
            </p>
          </CardContent>
        </Card>
      )}

      {status === "completed" && !showComparison && (
        <div className="grid gap-4 md:grid-cols-3 h-full max-h-full">
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
                <Alert
                  key={risk.id}
                  variant={risk.severity === "high" ? "destructive" : "default"}
                >
                  <AlertDescription className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={
                            risk.severity === "high"
                              ? "destructive"
                              : risk.severity === "medium"
                              ? "default"
                              : "outline"
                          }
                        >
                          {risk.severity === "high"
                            ? "高风险"
                            : risk.severity === "medium"
                            ? "中风险"
                            : "低风险"}
                        </Badge>
                        <span className="font-medium">{risk.type}</span>
                        {risk.lineNumber && (
                          <Badge variant="outline" className="text-xs">
                            第 {risk.lineNumber} 行
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{risk.content}</p>
                      {risk.codeSnippet && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                          <code>{risk.codeSnippet}</code>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>文件预览</CardTitle>
              {fileType === "image" && (
                <CardDescription>风险区域已标注</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                {fileType === "image" && uploadedImage ? (
                  <>
                    <img
                      ref={imageRef}
                      src={uploadedImage}
                      alt="上传的图像"
                      className="w-full h-full object-contain"
                      onLoad={handleImageLoad}
                    />
                    {imageDisplayInfo &&
                      risks.map((risk) => {
                        if (!risk.position) return null;

                        // 将百分比位置转换为像素位置
                        const boxLeft =
                          (risk.position.x / 100) *
                          imageDisplayInfo.displayWidth;
                        const boxTop =
                          (risk.position.y / 100) *
                          imageDisplayInfo.displayHeight;
                        const boxWidth =
                          (risk.position.width / 100) *
                          imageDisplayInfo.displayWidth;
                        const boxHeight =
                          (risk.position.height / 100) *
                          imageDisplayInfo.displayHeight;

                        // 加上图像在容器中的偏移量
                        const finalLeft = imageDisplayInfo.offsetX + boxLeft;
                        const finalTop = imageDisplayInfo.offsetY + boxTop;

                        return (
                          <div
                            key={risk.id}
                            className="absolute border-2 border-destructive bg-destructive/10"
                            style={{
                              left: `${finalLeft}px`,
                              top: `${finalTop}px`,
                              width: `${boxWidth}px`,
                              height: `${boxHeight}px`,
                            }}
                          >
                            <div className="absolute -top-6 left-0 bg-destructive text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              {risk.type}
                            </div>
                          </div>
                        );
                      })}
                  </>
                ) : fileType === "code" && uploadedCodeContent ? (
                  <div className="w-full h-full overflow-auto p-4">
                    <pre className="text-sm">
                      {uploadedCodeContent.split("\n").map((line, index) => (
                        <div key={index} className="flex">
                          <span className="text-muted-foreground mr-4 w-8 text-right select-none">
                            {index + 1}
                          </span>
                          <span className="flex-1">{line}</span>
                        </div>
                      ))}
                    </pre>
                  </div>
                ) : fileType === "document" && pdfUrl ? (
                  <>
                    {pdfUrl && ext === "pdf" && (
                      <div className="w-full h-full overflow-auto p-4">
                        <object
                          data={pdfUrl}
                          type="application/pdf"
                          className="w-full h-full"
                        >
                          <p>您的浏览器不支持 PDF 预览</p>
                        </object>
                      </div>
                    )}
                    {/* 这是excel */}
                    {(ext === "xls" || ext === "xlsx") && (
                      <ExcelViewerClient fileUrl={pdfUrl} />
                    )}
                    {/* ppt */}
                    {(ext === "ppt" || ext === "pptx") && (
                      <PPTViewerClient fileUrl={pdfUrl} />
                    )}
                    {/* doc */}
                    {(ext === "doc" || ext === "docx") && (
                      <DocxViewer fileUrl={pdfUrl} />
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    {fileType === "image"
                      ? "图像预览"
                      : fileType === "document"
                      ? "文档预览"
                      : "代码预览"}
                  </div>
                )}
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
                  {fileType === "image" && uploadedImage ? (
                    <>
                      <img
                        src={uploadedImage}
                        alt="原始图像"
                        className="w-full h-full object-contain"
                        onLoad={handleImageLoad}
                      />
                      {imageDisplayInfo &&
                        risks.map((risk) => {
                          if (!risk.position) return null;

                          // 将百分比位置转换为像素位置
                          const boxLeft =
                            (risk.position.x / 100) *
                            imageDisplayInfo.displayWidth;
                          const boxTop =
                            (risk.position.y / 100) *
                            imageDisplayInfo.displayHeight;
                          const boxWidth =
                            (risk.position.width / 100) *
                            imageDisplayInfo.displayWidth;
                          const boxHeight =
                            (risk.position.height / 100) *
                            imageDisplayInfo.displayHeight;

                          // 加上图像在容器中的偏移量
                          const finalLeft = imageDisplayInfo.offsetX + boxLeft;
                          const finalTop = imageDisplayInfo.offsetY + boxTop;

                          return (
                            <div
                              key={risk.id}
                              className="absolute border-2 border-destructive bg-destructive/10"
                              style={{
                                left: `${finalLeft}px`,
                                top: `${finalTop}px`,
                                width: `${boxWidth}px`,
                                height: `${boxHeight}px`,
                              }}
                            />
                          );
                        })}
                    </>
                  ) : fileType === "code" && uploadedCodeContent ? (
                    <div className="w-full h-full overflow-auto p-4">
                      <pre className="text-sm">
                        {uploadedCodeContent.split("\n").map((line, index) => {
                          const hasRisk = risks.some(
                            (risk) => risk.lineNumber === index + 1
                          );
                          return (
                            <div
                              key={index}
                              className={`flex ${
                                hasRisk ? "bg-destructive/10" : ""
                              }`}
                            >
                              <span className="text-muted-foreground mr-4 w-8 text-right select-none">
                                {index + 1}
                              </span>
                              <span className="flex-1">{line}</span>
                            </div>
                          );
                        })}
                      </pre>
                    </div>
                  ) : fileType === "document" && pdfUrl ? (
                    <>
                      {pdfUrl && ext === "pdf" && (
                        <div className="w-full h-full overflow-auto p-4">
                          <object
                            data={pdfUrl}
                            type="application/pdf"
                            className="w-full h-full"
                          >
                            <p>您的浏览器不支持 PDF 预览</p>
                          </object>
                        </div>
                      )}
                      {/* 这是excel */}
                      {(ext === "xls" || ext === "xlsx") && (
                        <ExcelViewerClient fileUrl={pdfUrl} />
                      )}
                      {/* ppt */}
                      {(ext === "ppt" || ext === "pptx") && (
                        <PPTViewerClient fileUrl={pdfUrl} />
                      )}
                      {/* doc */}
                      {(ext === "doc" || ext === "docx") && (
                        <DocxViewer fileUrl={pdfUrl} />
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      原始文件（含敏感信息）
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  {risks.map((risk) => (
                    <div
                      key={risk.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-muted-foreground">
                        {risk.type}:
                      </span>
                      <span>{risk.content}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="after" className="space-y-4">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  {fileType === "image" && uploadedImage ? (
                    <img
                      src={uploadedImage}
                      alt="脱敏后图像"
                      className="w-full h-full object-contain blur-md"
                    />
                  ) : fileType === "code" && uploadedCodeContent ? (
                    <div className="w-full h-full overflow-auto p-4">
                      <pre className="text-sm">
                        {uploadedCodeContent.split("\n").map((line, index) => {
                          const hasRisk = risks.some(
                            (risk) => risk.lineNumber === index + 1
                          );
                          return (
                            <div key={index} className="flex">
                              <span className="text-muted-foreground mr-4 w-8 text-right select-none">
                                {index + 1}
                              </span>
                              <span className="flex-1">
                                {hasRisk
                                  ? line.replace(/[a-zA-Z0-9@._-]/g, "*")
                                  : line}
                              </span>
                            </div>
                          );
                        })}
                      </pre>
                    </div>
                  ) : fileType === "document" && pdfUrl ? (
                    <>
                      <div className="absolute inset-0 blur-md">
                        {pdfUrl && ext === "pdf" && (
                          <div className="w-full h-full overflow-auto p-4">
                            <object
                              data={pdfUrl}
                              type="application/pdf"
                              className="w-full h-full"
                            >
                              <p>您的浏览器不支持 PDF 预览</p>
                            </object>
                          </div>
                        )}
                        {/* 这是excel */}
                        {(ext === "xls" || ext === "xlsx") && (
                          <ExcelViewerClient fileUrl={pdfUrl} />
                        )}
                        {/* ppt */}
                        {(ext === "ppt" || ext === "pptx") && (
                          <PPTViewerClient fileUrl={pdfUrl} />
                        )}
                        {/* doc */}
                        {(ext === "doc" || ext === "docx") && (
                          <DocxViewer fileUrl={pdfUrl} />
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-green-600">
                      ✓ 已脱敏文件（安全）
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  {risks.map((risk) => (
                    <div
                      key={risk.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">
                        {risk.type}:
                      </span>
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
  );
}
