"use client"

import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

interface JsonViewerProps {
  data: any
  defaultExpanded?: boolean
  className?: string
}

interface JsonNodeProps {
  nodeKey: string | number
  value: any
  level: number
  defaultExpanded?: boolean
  isDark?: boolean
}

const JsonNode: React.FC<JsonNodeProps> = ({
  nodeKey,
  value,
  level,
  defaultExpanded = false,
  isDark = false,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)
  const isObject = value !== null && typeof value === "object"
  const isArray = Array.isArray(value)
    const isEmpty = isArray
        ? value.length === 0
        : (value && typeof value === 'object' ? Object.keys(value).length === 0 : false)

  const getValueColor = (val: any) => {
    if (val === null) return isDark ? "text-red-400" : "text-red-600"
    if (typeof val === "boolean") return isDark ? "text-blue-400" : "text-blue-600"
    if (typeof val === "number") return isDark ? "text-green-400" : "text-green-600"
    if (typeof val === "string") return isDark ? "text-yellow-400" : "text-yellow-600"
    return isDark ? "text-foreground" : "text-foreground"
  }

  const getValueDisplay = (val: any) => {
    if (val === null) return "null"
    if (typeof val === "boolean") return val ? "true" : "false"
    if (typeof val === "string") return `"${val}"`
    if (typeof val === "number") return String(val)
    return String(val)
  }

  if (!isObject) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className={isDark ? "text-gray-400" : "text-gray-600"}>
          {nodeKey}:
        </span>
        <span className={getValueColor(value)}>{getValueDisplay(value)}</span>
      </div>
    )
  }

  return (
    <div className="py-1">
      <div className="flex items-center gap-1">
        {!isEmpty && (
          <button
              type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0 hover:bg-muted rounded transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        )}
        {isEmpty && <div className="size-4" />}
        <span className={isDark ? "text-gray-400" : "text-gray-600"}>
          {nodeKey}:
        </span>
        <span className={isDark ? "text-gray-500" : "text-gray-500"}>
          {isArray ? "[" : "{"}
          {isEmpty ? (isArray ? "]" : "}") : ""}
        </span>
      </div>

      {isExpanded && !isEmpty && (
        <div className="ml-4 border-l border-muted pl-2">
          {isArray ? (
            (value as any[]).map((item, index) => (
              <JsonNode
                key={index}
                nodeKey={index}
                value={item}
                level={level + 1}
                isDark={isDark}
              />
            ))
          ) : (
            Object.entries(value).map(([key, val]) => (
              <JsonNode
                key={key}
                nodeKey={key}
                value={val}
                level={level + 1}
                isDark={isDark}
              />
            ))
          )}
        </div>
      )}

      {isExpanded && !isEmpty && (
        <div className="flex items-center gap-2 py-1">
          <div className="size-4" />
          <span className={isDark ? "text-gray-500" : "text-gray-500"}>
            {isArray ? "]" : "}"}
          </span>
        </div>
      )}
    </div>
  )
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  defaultExpanded = false,
  className,
}) => {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div
      className={cn(
        "rounded-lg border p-4 font-mono text-sm overflow-auto",
        isDark
          ? "bg-slate-950 border-slate-800 text-slate-100"
          : "bg-slate-50 border-slate-200 text-slate-900",
        className
      )}
    >
      <JsonNode
        nodeKey="root"
        value={data}
        level={0}
        defaultExpanded={defaultExpanded}
        isDark={isDark}
      />
    </div>
  )
}

