"use client"

import { useState, useEffect } from "react"
import { Settings, Building2, Shield, Database, CreditCard, Stethoscope, GraduationCap, Factory, Store, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// 行业类型定义
interface Industry {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  complianceFrameworks: string[]
  riskAreas: string[]
}

// 预定义行业
const industries: Industry[] = [
  {
    id: "finance",
    name: "金融服务",
    icon: CreditCard,
    description: "银行、保险、投资等金融服务机构",
    complianceFrameworks: ["PCI DSS", "SOX", "Basel III", "GDPR"],
    riskAreas: ["客户财务信息", "交易数据", "信用记录", "风险评估"]
  },
  {
    id: "healthcare",
    name: "医疗健康",
    icon: Stethoscope,
    description: "医院、诊所、制药、医疗器械等",
    complianceFrameworks: ["HIPAA", "FDA", "ISO 27001", "GDPR"],
    riskAreas: ["患者隐私", "医疗记录", "基因数据", "临床试验"]
  },
  {
    id: "education",
    name: "教育培训",
    icon: GraduationCap,
    description: "学校、培训机构、在线教育平台",
    complianceFrameworks: ["FERPA", "COPPA", "GDPR", "ISO 27001"],
    riskAreas: ["学生信息", "成绩记录", "行为数据", "家庭信息"]
  },
  {
    id: "manufacturing",
    name: "制造业",
    icon: Factory,
    description: "汽车、电子、机械、化工等制造企业",
    complianceFrameworks: ["ISO 27001", "IATF 16949", "GDPR", "SOX"],
    riskAreas: ["供应链信息", "技术机密", "客户数据", "员工信息"]
  },
  {
    id: "retail",
    name: "零售电商",
    icon: Store,
    description: "电商平台、实体零售、物流配送",
    complianceFrameworks: ["PCI DSS", "GDPR", "CCPA", "ISO 27001"],
    riskAreas: ["客户购买记录", "支付信息", "地址数据", "行为分析"]
  },
  {
    id: "technology",
    name: "科技互联网",
    icon: Database,
    description: "软件开发、云计算、人工智能、大数据",
    complianceFrameworks: ["ISO 27001", "SOC 2", "GDPR", "CCPA"],
    riskAreas: ["用户数据", "算法模型", "源代码", "API密钥"]
  },
  {
    id: "government",
    name: "政府机构",
    icon: Building2,
    description: "政府部门、公共机构、事业单位",
    complianceFrameworks: ["FISMA", "NIST", "GDPR", "ISO 27001"],
    riskAreas: ["公民信息", "政府机密", "政策数据", "公共服务记录"]
  },
  {
    id: "consulting",
    name: "咨询服务",
    icon: Briefcase,
    description: "管理咨询、法律咨询、财务咨询",
    complianceFrameworks: ["ISO 27001", "GDPR", "SOX", "SOC 2"],
    riskAreas: ["客户机密", "商业计划", "财务数据", "战略信息"]
  }
]

export default function SettingsPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>("")
  const [customCompliance, setCustomCompliance] = useState<string>("")
  const [riskTolerance, setRiskTolerance] = useState<"low" | "medium" | "high">("medium")
  const [isSaved, setIsSaved] = useState(false)

  // 获取当前选择的行业
  const currentIndustry = industries.find(industry => industry.id === selectedIndustry)

  // 保存设置
  const handleSaveSettings = () => {
    const settings = {
      industry: selectedIndustry,
      customCompliance,
      riskTolerance,
      timestamp: new Date().toISOString()
    }
    
    localStorage.setItem('privacy-detection-settings', JSON.stringify(settings))
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  // 加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('privacy-detection-settings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        setSelectedIndustry(settings.industry || "")
        setCustomCompliance(settings.customCompliance || "")
        setRiskTolerance(settings.riskTolerance || "medium")
      } catch (error) {
        console.error('加载设置失败:', error)
      }
    }
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">隐私检测设置</h1>
        <p className="text-muted-foreground">
          配置行业特定的合规检测规则，提升隐私风险检测的准确性
        </p>
      </div>

      <Tabs defaultValue="industry" className="space-y-4">
        <TabsList>
          <TabsTrigger value="industry">行业设置</TabsTrigger>
          <TabsTrigger value="compliance">合规框架</TabsTrigger>
          <TabsTrigger value="risk">风险偏好</TabsTrigger>
        </TabsList>

        <TabsContent value="industry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                选择行业类型
              </CardTitle>
              <CardDescription>
                选择您所在的行业，系统将应用相应的合规检测规则
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {industries.map((industry) => {
                  const Icon = industry.icon
                  return (
                    <Card 
                      key={industry.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedIndustry === industry.id 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedIndustry(industry.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <h3 className="font-medium">{industry.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {industry.description}
                        </p>
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">合规框架:</div>
                          <div className="flex flex-wrap gap-1">
                            {industry.complianceFrameworks.map((framework) => (
                              <Badge key={framework} variant="secondary" className="text-xs">
                                {framework}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {currentIndustry && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>已选择: {currentIndustry.name}</strong><br />
                    系统将重点关注以下风险领域: {currentIndustry.riskAreas.join('、')}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                合规框架设置
              </CardTitle>
              <CardDescription>
                配置额外的合规要求和检测规则
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  自定义合规要求
                </label>
                <textarea
                  className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="请输入额外的合规要求，例如：内部审计标准、行业特定规定等..."
                  value={customCompliance}
                  onChange={(e) => setCustomCompliance(e.target.value)}
                />
              </div>

              {currentIndustry && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    当前行业合规框架
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {currentIndustry.complianceFrameworks.map((framework) => (
                      <Badge key={framework} variant="outline" className="text-sm">
                        {framework}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                风险偏好设置
              </CardTitle>
              <CardDescription>
                设置系统的风险检测敏感度
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    riskTolerance === 'low' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setRiskTolerance('low')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div>
                      <h3 className="font-medium">低风险偏好</h3>
                      <p className="text-sm text-muted-foreground">
                        严格检测，对任何潜在风险都会发出警告
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    riskTolerance === 'medium' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setRiskTolerance('medium')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div>
                      <h3 className="font-medium">中等风险偏好</h3>
                      <p className="text-sm text-muted-foreground">
                        平衡检测，重点关注中高风险项目
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    riskTolerance === 'high' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setRiskTolerance('high')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div>
                      <h3 className="font-medium">高风险偏好</h3>
                      <p className="text-sm text-muted-foreground">
                        宽松检测，仅对高风险项目发出警告
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={!selectedIndustry}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          {isSaved ? "已保存" : "保存设置"}
        </Button>
      </div>

      {isSaved && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            设置已保存！系统将根据您的行业和合规要求进行针对性检测。
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
