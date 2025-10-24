import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable, schema } from "@/components/data-table"
import { SectionCards, type SectionCardData } from "@/components/section-cards"
import {
  fetchAndProcessRecords,
  calculateStats,
  type ProcessedRecord,
} from "@/lib/dashboard-data"
import { z } from "zod"

/**
 * 将 ProcessedRecord 转换为 DataTable 期望的格式
 */
function convertToDataTableFormat(
  records: ProcessedRecord[]
): z.infer<typeof schema>[] {
  return records.map((record, index) => ({
    id: index + 1, // DataTable 需要数字 ID
    header: record.id, // 使用记录 ID 作为 header
    type: record.taskType || "unknown", // 任务类型
    status: record.aiResult?.blocked ? "Blocked" : "Done", // 根据 blocked 状态设置
    target: record.aiResult?.overallRisk || "unknown", // 风险等级作为 target
    limit: record.aiResult?.reasoning || "-", // 原因作为 limit
    reviewer: "Assign reviewer", // 默认值
  }))
}

async function getDashboardData() {
  try {
    // 获取并处理所有记录
    const processedRecords = await fetchAndProcessRecords()

    // 计算统计数据
    const stats = calculateStats(processedRecords)

    // 构建 SectionCards 数据
    const sectionCardsData: SectionCardData[] = [
      {
        description: "Total Records",
        value: stats.totalRecords,
        trend: { direction: "up", percentage: 5 },
        footerTitle: "All AI tasks processed",
        footerDescription: "From Langfuse API",
      },
      {
        description: "Low Risk",
        value: stats.lowRiskCount,
        trend: { direction: "up", percentage: 12 },
        footerTitle: "Safe to proceed",
        footerDescription: "No compliance issues detected",
      },
      {
        description: "Medium Risk",
        value: stats.mediumRiskCount,
        trend: { direction: "down", percentage: 8 },
        footerTitle: "Requires review",
        footerDescription: "Potential issues found",
      },
      {
        description: "High Risk / Blocked",
        value: stats.highRiskCount + stats.blockedCount,
        trend: { direction: "down", percentage: 3 },
        footerTitle: "Action required",
        footerDescription: "Critical compliance violations",
      },
    ]

    // 转换为 DataTable 格式
    const dataTableData = convertToDataTableFormat(processedRecords)

    return {
      sectionCardsData,
      processedRecords,
      dataTableData,
    }
  } catch (error) {
    console.error("获取 dashboard 数据失败:", error)
    return {
      sectionCardsData: undefined,
      processedRecords: [],
      dataTableData: [],
    }
  }
}

export default async function Page() {
  const { sectionCardsData, dataTableData } = await getDashboardData()

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards data={sectionCardsData} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={dataTableData || []} />
    </div>
  )
}
