/**
 * Dashboard 数据获取和处理工具
 */
import {getTraceDetail, getTraceList} from "@/server/actions/data";
import type {TraceWithFullDetails} from "@langfuse/core";

export interface AITaskResult {
  risks: unknown[]
  overallRisk: "low" | "medium" | "high"
  blocked: boolean
  reasoning: string
}

export interface ProcessedRecord {
  id: string
  taskType: string
  aiResult: AITaskResult | null
  rawData: TraceWithFullDetails
}

export interface SectionCardStats {
  totalRecords: number
  lowRiskCount: number
  mediumRiskCount: number
  highRiskCount: number
  blockedCount: number
}

/**
 * 从 URL 参数中提取任务类型
 * 例如：'/api/ai?type=prompt-detection' -> 'prompt-detection'
 */
function extractTaskTypeFromUrl(url: string): string {
  try {
    const urlObj = new URL(url, "http://localhost")
    return urlObj.searchParams.get("type") || "unknown"
  } catch {
    return "unknown"
  }
}

/**
 * 从观察数据中提取 AI 任务结果
 */
function extractAIResult(observations: unknown[]): AITaskResult | null {
  if (!Array.isArray(observations)) {
    return null
  }

  const generationObs = observations.find(
    (obs: unknown) =>
      typeof obs === "object" &&
      obs !== null &&
      (obs as Record<string, unknown>).type === "GENERATION"
  )

  if (!generationObs) {
    return null
  }

  const output = (generationObs as Record<string, unknown>).output

  if (
    typeof output === "object" &&
    output !== null &&
    "overallRisk" in output &&
    "blocked" in output
  ) {
    return output as AITaskResult
  }

  return null
}

/**
 * 处理单条记录
 */
async function processRecord(record: unknown): Promise<ProcessedRecord | null> {
  if (
    typeof record !== "object" ||
    record === null ||
    !("id" in record)
  ) {
    return null
  }

  const recordObj = record as Record<string, unknown>
  const id = String(recordObj.id)

  // 获取详细信息
  const detail = await getTraceDetail(id)

  if (!detail) {
    return null
  }

  const detailObj = detail

  // 提取任务类型
  const metadata = detailObj.metadata as Record<string, unknown> | undefined
  const attributes = metadata?.attributes as Record<string, unknown> | undefined
  const target = attributes?.['http.target'] as string

  const taskType = extractTaskTypeFromUrl(target)

  // 提取 AI 结果
  const observations = detailObj.observations as unknown[] | undefined
  const aiResult = extractAIResult(observations || [])

  return {
    id,
    taskType,
    aiResult,
    rawData: detail,
  }
}

/**
 * 获取并处理所有记录
 */
export async function fetchAndProcessRecords(): Promise<ProcessedRecord[]> {
  const records = (await getTraceList()).data

  if (records.length === 0) {
    return []
  }

  // 并行处理所有记录（限制并发数）
  const processedRecords: ProcessedRecord[] = []
  const batchSize = 5

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map((record) => processRecord(record))
    )
    processedRecords.push(...results.filter((r) => r !== null))
  }

  return processedRecords
}

/**
 * 计算统计数据
 */
export function calculateStats(records: ProcessedRecord[]): SectionCardStats {
  const stats: SectionCardStats = {
    totalRecords: records.length,
    lowRiskCount: 0,
    mediumRiskCount: 0,
    highRiskCount: 0,
    blockedCount: 0,
  }

  records.forEach((record) => {
    if (record.aiResult) {
      if (record.aiResult.blocked) {
        stats.blockedCount++
      }

      switch (record.aiResult.overallRisk) {
        case "low":
          stats.lowRiskCount++
          break
        case "medium":
          stats.mediumRiskCount++
          break
        case "high":
          stats.highRiskCount++
          break
      }
    }
  })

  return stats
}

