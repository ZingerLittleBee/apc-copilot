"use client"

import * as React from "react"
import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// 补充选中样式
export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  // 选中样式：检测当前路径
  const pathname = (typeof window !== "undefined" && window.location?.pathname) || "";
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            // 以url开头判定选中状态，支持部分匹配
            const isActive =
              item.url !== "#" && item.url !== "" && pathname.startsWith(item.url);
            return (
              <SidebarMenuItem key={item.title} data-active={isActive ? "true" : undefined}>
                <SidebarMenuButton
                  asChild
                  className={
                    isActive
                      ? "bg-primary/90 font-semibold text-white shadow"
                      : undefined
                  }
                >
                  <a href={item.url}>
                    <item.icon className={isActive ? "text-primary" : undefined} />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
