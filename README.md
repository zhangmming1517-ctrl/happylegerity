# 🥗 AI 极简饮食规划助手

一个基于 AI（Google Gemini）的智能一周饮食规划与采购清单生成工具，专为追求健康和高效生活的用户设计。

## ✨ 核心功能

- **健康数据计算**：根据用户年龄、性别、身高、体重和运动水平，计算 BMI、TDEE 和目标热量
- **AI 驱动的食谱规划**：使用 Google Gemini LLM 生成营养均衡的一周食谱
- **两种规划模式**：采买模式（新鲜食材）/ 清冰箱模式（最大化库存利用）
- **智能 RAG 检索**：本地营养知识库参与 LLM 推理
- **PWA 应用**：离线使用、自动更新、iOS 主屏安装
- **响应式设计**：完美适配手机和平板

## 🚀 快速开始

### 前置条件
- Node.js 18+
- npm 或 yarn
- 一个免费的 [Google Gemini API Key](https://aistudio.google.com/apikey)

### 本地开发

```bash
# 1. 克隆仓库
git clone <repo-url>
cd Legerity

# 2. 安装依赖
npm install

# 3. 配置环境变量（在根目录创建 .env.local）
GEMINI_API_KEY=your_api_key_here

# 4. 启动开发服务器
npm run dev

# 5. 打开浏览器访问 http://localhost:3000
```

### 构建与部署

```bash
npm run build    # 生成 PWA 图标并构建
npm run preview  # 本地预览
```

## 📂 项目结构

详见 [TECH_STACK_LEARNING.md](./TECH_STACK_LEARNING.md)。

```
├── App.tsx                     # 主应用组件
├── types.ts                    # 全局类型定义
├── services/
│   ├── geminiService.ts        # Gemini LLM 调用
│   └── ragNutrition.ts         # RAG 营养知识库检索
├── utils/calculators.ts        # 健康指标计算
├── data/foodNutrition.ts       # 营养知识库
├── public/                     # PWA 图标与资源
├── dist/                       # 构建输出（PWA）
└── ...
```

## 🛠 技术栈

- React 19 + TypeScript
- Vite 6 + vite-plugin-pwa
- Tailwind CSS 3
- Google Gemini AI
- Service Worker + Workbox

## 📱 iOS 部署

### 方式 1：本地 PWA（同局域网）
```bash
npm run build
npm install -g serve
serve -s dist -l 5000
# iPhone Safari 打开 PC/Mac 的 IP:5000，点"分享" → "添加到主屏幕"
```

### 方式 2：HTTPS 隧道（推荐测试）
```bash
ngrok http 5000
# 复制 ngrok HTTPS 链接到 iPhone Safari
```

### 方式 3：云部署（生产）
部署至 Vercel、Netlify 等 HTTPS 托管服务。详见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 🔐 安全提示

- **.env.local** 包含 API Key，已在 `.gitignore` 中忽略，**不会提交**
- 生产环境：把 API Key 放在后端代理中，前端不暴露敏感凭证
- 监控 API 调用量，防止滥用和意外费用

## 📖 学习资源

- [TECH_STACK_LEARNING.md](./TECH_STACK_LEARNING.md) - 完整技术栈导学
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 部署指南
- [Google Gemini API](https://ai.google.dev/docs)
- [React 文档](https://react.dev)
- [Vite 文档](https://vitejs.dev)

## 📝 许可证

MIT License - 详见 [LICENSE](./LICENSE)
