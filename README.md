# APC Copilot - AI 隐私合规防护系统演示

## 项目简介

APC Copilot 是一个 AI 隐私合规防护系统的演示项目,通过三层防护机制保障 AI 应用的安全合规运行。

## 三层防护机制

### 第一层：数据内容层 - 文件检测与脱敏
检测图片、视频、文档、代码中的隐私与敏感信息

**功能特点：**
- 支持多种文件类型（图像、文档、代码）
- AI 智能检测隐私信息
- 可视化标注风险区域
- 自动脱敏处理
- 脱敏前后对比展示

**检测内容：**
- 图像：人脸、身份证、车牌、品牌 Logo
- 文档：客户信息、银行账号、合同金额、签名
- 代码：API 密钥、数据库密码、内网 IP、用户数据

### 第二层：模型交互层 - Prompt 防火墙 (PromptShield)
审查 Prompt 输入与模型输出,阻断潜在泄露

**功能特点：**
- 实时检测 Prompt 中的隐私风险
- 智能识别敏感数据访问意图
- 自动阻断高风险请求
- 提供安全建议和修改方案

**防护规则：**
- 客户隐私保护：阻止涉及客户个人信息的请求
- 商业机密防护：检测敏感商业数据访问
- 数据导出控制：限制批量数据导出操作

### 第三层：结果合规层 - AI 输出内容审查
审查 AI 生成内容的版权、肖像权与品牌风险

**功能特点：**
- 多维度合规检测（版权、肖像权、品牌）
- 智能识别侵权风险
- 自动修复建议
- 一键应用修复方案

**检测类型：**
- 版权风险：检测版权素材使用
- 肖像权风险：识别未授权人物形象
- 品牌风险：检测品牌标识和引用
- 内容合规：识别虚假宣传等问题

## 技术栈

- **框架：** Next.js 16.0.0
- **UI 组件：** shadcn/ui (基于 Radix UI)
- **样式：** Tailwind CSS 4
- **图标：** Lucide React + Tabler Icons
- **语言：** TypeScript

## 项目结构

```
app/
├── dashboard/
│   ├── layout.tsx                 # Dashboard 共享布局
│   ├── page.tsx                   # Dashboard 主页
│   ├── file-detection/
│   │   └── page.tsx              # 文件检测与脱敏页面
│   ├── prompt-shield/
│   │   └── page.tsx              # Prompt 防火墙页面
│   └── output-review/
│       └── page.tsx              # AI 输出内容审查页面
components/
├── app-sidebar.tsx               # 应用侧边栏
├── site-header.tsx               # 页面头部
└── ui/                           # shadcn/ui 组件
```

## 快速开始

### 1. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 2. 启动开发服务器

```bash
npm run dev
# 或
pnpm dev
```

### 3. 访问应用

打开浏览器访问 [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

## 功能演示

### 文件检测与脱敏

1. 访问 `/dashboard/file-detection`
2. 选择文件类型（图像/文档/代码）
3. 点击上传按钮触发检测
4. 查看检测结果和风险标注
5. 点击"执行自动脱敏"
6. 查看脱敏前后对比

### Prompt 防火墙

1. 访问 `/dashboard/prompt-shield`
2. 在输入框中输入 Prompt 或点击示例加载
3. 系统实时检测隐私风险
4. 查看风险警告和安全建议
5. 高风险 Prompt 将被自动阻断

### AI 输出内容审查

1. 访问 `/dashboard/output-review`
2. 选择要审查的 AI 生成内容
3. 系统自动检测合规问题
4. 查看问题详情和严重程度
5. 点击"自动修复"应用修复方案
6. 查看修复后的内容

## 注意事项

- 本项目为演示系统,使用模拟数据展示功能
- 实际检测功能需要接入真实的 AI 检测后端
- 所有检测结果和修复建议均为示例数据

## 行业应用场景

- **医疗行业：** 保护患者隐私信息
- **金融行业：** 防止交易数据泄露
- **电商行业：** 保护用户购买记录
- **媒体行业：** 规避版权和肖像权风险
- **政务行业：** 确保政务数据安全

## 开发说明

### 添加新的检测规则

在各个页面组件中修改检测逻辑：

- `file-detection/page.tsx` - 文件检测规则
- `prompt-shield/page.tsx` - Prompt 检测规则
- `output-review/page.tsx` - 输出审查规则

### 自定义 UI 样式

项目使用 Tailwind CSS,可以在组件中直接修改样式类。

### 添加新的功能模块

1. 在 `app/dashboard/` 下创建新的路由目录
2. 在 `components/app-sidebar.tsx` 中添加导航链接
3. 在 `components/site-header.tsx` 中添加页面标题

## 许可证

MIT

