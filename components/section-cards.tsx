import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface SectionCardData {
  description: string
  value: string | number
  trend?: {
    direction: "up" | "down"
    percentage: number
  }
  footerTitle: string
  footerDescription: string
}

export function SectionCards({ data }: { data?: SectionCardData[] }) {
  // 默认数据
  const defaultData: SectionCardData[] = [
    {
      description: "Total Revenue",
      value: "$1,250.00",
      trend: { direction: "up", percentage: 12.5 },
      footerTitle: "Trending up this month",
      footerDescription: "Visitors for the last 6 months",
    },
    {
      description: "New Customers",
      value: "1,234",
      trend: { direction: "down", percentage: 20 },
      footerTitle: "Down 20% this period",
      footerDescription: "Acquisition needs attention",
    },
    {
      description: "Active Accounts",
      value: "45,678",
      trend: { direction: "up", percentage: 12.5 },
      footerTitle: "Strong user retention",
      footerDescription: "Engagement exceed targets",
    },
    {
      description: "Growth Rate",
      value: "4.5%",
      trend: { direction: "up", percentage: 4.5 },
      footerTitle: "Steady performance increase",
      footerDescription: "Meets growth projections",
    },
  ]

  const displayData = data || defaultData

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {displayData.map((item, index) => (
        <Card key={`${item.value}-${index}`} className="@container/card">
          <CardHeader>
            <CardDescription>{item.description}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {item.value}
            </CardTitle>
            {item.trend && (
              <CardAction>
                <Badge variant="outline">
                  {item.trend.direction === "up" ? (
                    <IconTrendingUp />
                  ) : (
                    <IconTrendingDown />
                  )}
                  {item.trend.direction === "up" ? "+" : "-"}
                  {item.trend.percentage}%
                </Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {item.footerTitle}
              {item.trend?.direction === "up" ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
            </div>
            <div className="text-muted-foreground">{item.footerDescription}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
