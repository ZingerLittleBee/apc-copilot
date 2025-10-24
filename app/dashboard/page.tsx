import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards, type SectionCardData } from "@/components/section-cards"
import {
  fetchAndProcessRecords,
  calculateStats,
  type ProcessedRecord,
} from "@/lib/dashboard-data"

import data from "./data.json"

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

    return {
      sectionCardsData,
      processedRecords,
    }
  } catch (error) {
    console.error("获取 dashboard 数据失败:", error)
    return {
      sectionCardsData: undefined,
      processedRecords: [],
    }
  }
}

export default async function Page() {
  const { sectionCardsData, processedRecords } = await getDashboardData()

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards data={sectionCardsData} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </div>
  )
}
