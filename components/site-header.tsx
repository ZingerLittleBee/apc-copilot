"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const pageTitles: Record<string, string> = {
  "/dashboard": "APC Copilot - AI 隐私合规防护系统",
  "/dashboard/file-detection": "文件检测与脱敏",
  "/dashboard/prompt-shield": "Prompt 防火墙",
  "/dashboard/output-review": "AI 输出内容审查",
}

export function SiteHeader() {
  const pathname = usePathname()
  const title = pageTitles[pathname] || "APC Copilot"

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  )
}
