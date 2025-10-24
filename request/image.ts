/**
 * 图像检测 API 接口
 */

// API 响应类型定义
export interface DetectionBox {
  class: string
  score: number
  box: [number, number, number, number] // [x, y, width, height]
}

export interface ImageDetectionResponse {
  prediction: DetectionBox[][]
  success: boolean
}

// 检测结果映射类型
export interface MappedDetectionResult {
  id: string
  type: string // 中文类型名称
  content: string // 描述信息
  severity: "high" | "medium" | "low"
  position?: { x: number; y: number; width: number; height: number }
  originalClass: string // 原始 class 名称
  score: number // 置信度
}

/**
 * 类别名称映射（英文 -> 中文）
 */
const CLASS_NAME_MAP: Record<string, string> = {
  FACE_FEMALE: "女性人脸",
  FACE_MALE: "男性人脸",
  BELLY_EXPOSED: "裸露腹部",
  FEMALE_BREAST_EXPOSED: "裸露胸部",
  FEMALE_GENITALIA_EXPOSED: "裸露生殖器",
  MALE_GENITALIA_EXPOSED: "裸露生殖器",
  BUTTOCKS_EXPOSED: "裸露臀部",
  ANUS_EXPOSED: "裸露肛门",
  FEET_EXPOSED: "裸露脚部",
  ARMPITS_EXPOSED: "裸露腋下",
  BELLY_COVERED: "遮盖腹部",
  FEMALE_BREAST_COVERED: "遮盖胸部",
  BUTTOCKS_COVERED: "遮盖臀部",
  FEET_COVERED: "遮盖脚部",
  ARMPITS_COVERED: "遮盖腋下",
  FEMALE_GENITALIA_COVERED: "遮盖女性生殖器",
}

/**
 * 根据类别判断风险等级
 */
function getSeverity(className: string): "high" | "medium" | "low" {
  // 人脸信息 - 高风险（隐私相关）
  if (className.includes("FACE")) {
    return "high"
  }

  // 裸露部位 - 高风险
  if (className.includes("EXPOSED") && !className.includes("FEET") && !className.includes("ARMPITS")) {
    return "high"
  }

  // 脚部、腋下裸露 - 中风险
  if (className.includes("FEET_EXPOSED") || className.includes("ARMPITS_EXPOSED")) {
    return "medium"
  }

  // 其他遮盖部位 - 低风险
  return "low"
}

/**
 * 生成检测结果描述
 */
function generateContent(className: string, score: number): string {
  const percentage = (score * 100).toFixed(1)

  if (className.includes("FACE")) {
    return `检测到人脸信息（置信度 ${percentage}%）`
  }

  if (className.includes("EXPOSED")) {
    return `检测到敏感内容（置信度 ${percentage}%）`
  }

  return `检测到相关内容（置信度 ${percentage}%）`
}

/**
 * 调用图像检测 API
 * @param file 要检测的图像文件
 * @returns 检测结果
 */
export async function detectImage(file: File): Promise<ImageDetectionResponse> {
  const formData = new FormData()
  formData.append("f1", file)

  const response = await fetch("https://nudenet-production.up.railway.app/infer", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

/**
 * 将 API 响应映射为页面展示格式
 * @param response API 响应数据
 * @param imageWidth 图像宽度（用于计算百分比位置）
 * @param imageHeight 图像高度（用于计算百分比位置）
 * @returns 映射后的检测结果数组
 */
export function mapDetectionResults(
  response: ImageDetectionResponse,
  imageWidth: number,
  imageHeight: number
): MappedDetectionResult[] {
  if (!response.success || !response.prediction || response.prediction.length === 0) {
    return []
  }

  const detections = response.prediction[0] || []

  return detections.map((detection, index) => {
    const [x, y, width, height] = detection.box
    const className = detection.class
    const chineseName = CLASS_NAME_MAP[className] || className

    return {
      id: `detection-${index}`,
      type: chineseName,
      content: generateContent(className, detection.score),
      severity: getSeverity(className),
      position: {
        x: (x / imageWidth) * 100,
        y: (y / imageHeight) * 100,
        width: (width / imageWidth) * 100,
        height: (height / imageHeight) * 100,
      },
      originalClass: className,
      score: detection.score,
    }
  })
}

/**
 * 完整的图像检测流程（上传 + 映射）
 * @param file 要检测的图像文件
 * @returns 映射后的检测结果
 */
export async function detectAndMapImage(file: File): Promise<MappedDetectionResult[]> {
  // 首先获取图像尺寸
  const imageSize = await getImageSize(file)

  // 调用检测 API
  const response = await detectImage(file)

  // 映射结果
  return mapDetectionResults(response, imageSize.width, imageSize.height)
}

/**
 * 获取图像尺寸
 * @param file 图像文件
 * @returns 图像的宽度和高度
 */
function getImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("无法加载图像"))
    }

    img.src = url
  })
}
