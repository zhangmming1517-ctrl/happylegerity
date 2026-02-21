# 项目技术栈导学（AI 极简饮食助手）

本文档由资深架构师撰写，目标是帮助你快速理解代码结构、各文件职责，并给出系统的学习路线与练习任务，便于上手与进阶。

**项目概览**
- 这是一个使用 React + TypeScript + Vite 构建的前端单页应用（SPA），内置对 LLM（Google Gemini / GenAI）的调用，用于生成“极简饮食”周计划。部分逻辑包含检索增强（RAG）与本地营养知识库。

**主要文件与职责（按目录列出）**
- **根文件与配置**
  - [package.json](package.json)：项目依赖与 `npm` 脚本（运行、构建、预览）。
  - [vite.config.ts](vite.config.ts)：Vite 配置，定义了环境变量注入和别名等（开发服务器、插件）。
  - [tsconfig.json](tsconfig.json)：TypeScript 编译选项。
  - [.env.local](.env.local)（未提交）：存放 `GEMINI_API_KEY` 等私密配置，参见 [env.config.ts](env.config.ts)。
  - [env.config.ts](env.config.ts)：对可用环境变量的声明与说明（用于在 `vite.config.ts` 中注入）。
  - [metadata.json](metadata.json)：项目元信息（可用于 CI/展示或登记）。

- **前端（UI）**
  - [index.html](index.html)：应用入口 HTML，加载 Tailwind（CDN）并使用 importmap（此处用于静态引用依赖的 CDN 版本）。
  - [index.tsx](index.tsx)：React 挂载点与入口渲染逻辑。
  - [App.tsx](App.tsx)：应用主组件，包含页面流（onboarding、home、plan_input、result）、UI 控件、本地状态与用户交互逻辑（也负责调用服务生成周计划）。
  - [README.md](README.md)：运行说明与快速启动步骤。

- **类型与工具**
  - [types.ts](types.ts)：TypeScript 的业务类型定义（用户画像、计划、营养数据结构等），是整个项目类型安全的中心。
  - [utils/calculators.ts](utils/calculators.ts)：包含 `calculateHealthMetrics`，用于根据用户资料计算 BMI、BMR、TDEE、目标热量等（纯业务逻辑、前端可直接调用）。

- **数据与 RAG（检索增强）**
  - [data/foodNutrition.ts](data/foodNutrition.ts)：本地食物营养知识库（结构化的营养参考数据），被 RAG 层用于为 LLM 提供数量化参考。
  - [services/ragNutrition.ts](services/ragNutrition.ts)：将营养库条目格式化为可注入 prompt 的文本（关键词匹配、基础条目补全）。

- **后端/服务（业务逻辑、外部 API 封装）**
  - [services/geminiService.ts](services/geminiService.ts)：对 Google GenAI（Gemini）SDK 的封装，构建 prompt、注入 nutrition reference、定义响应 schema，并解析返回 JSON 为 `WeeklyPlanResponse`。这是调用外部 LLM 的核心逻辑（属于后端/服务层逻辑，但在此项目中运行在前端环境并通过前端环境变量注入 API key）。

**哪些是前端 / 哪些是后端 / 哪些是配置**
- 前端（UI）：`index.html`, `index.tsx`, `App.tsx` 及所有样式/交互逻辑（组件、事件、localStorage）。
- 业务逻辑（可视为后端/服务层逻辑，但本项目将其放在前端代码里）：`services/geminiService.ts`, `services/ragNutrition.ts`, `utils/calculators.ts`，这些负责与 LLM 通信、检索与营养计算。
- 数据：`data/foodNutrition.ts`（本地知识库），`types.ts`（全局类型）。
- 配置与构建：`package.json`, `vite.config.ts`, `tsconfig.json`, `env.config.ts`, `.env.local`（私有）。

学习技术栈的系统路线（针对开发者，从入门到进阶）
1. 基础准备（1-2 天）
   - 熟悉 JavaScript（ES6+）与 TypeScript（重点：类型、泛型、模块、TS config）。
   - Node.js 与 npm 基础（依赖管理、脚本）。
   - 资源：TypeScript 官方手册、MDN JS、Node.js docs。

2. 前端核心（3-7 天）
   - React 18/19（函数组件、Hooks：useState/useEffect/useMemo、事件处理、状态提升、Context、StrictMode）。
   - JSX/组件设计、可复用 UI 模式。
   - 练习：阅读并修改 `App.tsx`，把某个页面拆成更小组件（例如将 Onboarding 抽成单独文件）。

3. 构建工具与环境（1-2 天）
   - Vite：项目启动、开发服务器、构建产物、插件系统。
   - 环境变量管理：理解 `env.config.ts`、`.env.local` 与 `vite.config.ts` 中的 `define` 注入。
   - 练习：添加一个新的环境 variable 到 `env.config.ts` 并在 `App.tsx` 中读取。

4. UI 与样式（半天）
   - Tailwind CSS（此项目通过 CDN 引入，理解类名与响应式写法）。
   - 练习：在 `App.tsx` 调整样式，增加一个新的卡片组件样式。

5. 与大模型集成（2-4 天）
   - 理解 RAG（检索增强）模式与 prompt 设计：阅读 `services/ragNutrition.ts` 与 `services/geminiService.ts`。
   - 熟悉 Google GenAI SDK 用法（或其它 LLM SDK），了解如何构造 schema、解析响应、错误处理与重试策略。
   - 安全性：不要在公有仓库提交 API Key；在部署时使用安全的后端代理或机密管理服务（此项目现在在前端直接用 API key，生产需改造）。
   - 练习：本地用有效 key 跑一次 `generateWeeklyPlan`，并打印返回结果结构；或把调用封装成一个后端 API（下一步建议）。

6. 数据建模与业务逻辑（1-3 天）
   - 深入 `types.ts` 与 `data/foodNutrition.ts`：了解如何设计类型、接口与可扩展的数据源。
   - 练习：扩展 `FOOD_NUTRITION_DB`，加入 5 个常见食材并观察 RAG 输出变化。

7. 质量与部署（2-4 天）
   - 添加单元测试（Jest / Vitest）来测试 `calculateHealthMetrics` 与 `ragNutrition` 的关键函数。
   - 构建与部署：使用 `npm run build` 生成静态文件，选择静态托管（Netlify、Vercel、GitHub Pages）或将前端与后端代理一起部署。
   - 练习：为 `calculateHealthMetrics` 写 3 个边界单元测试。

实践任务（按优先级）
- 必做
  - 本地运行项目并熟悉功能：
    ```bash
    npm install
    # 在根目录创建 .env.local: GEMINI_API_KEY=你的key
    npm run dev
    ```
  - 阅读 `services/geminiService.ts`，把 prompt 中的某个约束改成可选配置，并验证运行行为。

- 建议
  - 将 LLM 调用迁移到后端小服务（例如 Express 或 Vercel Serverless），避免在浏览器暴露 API Key。
  - 为 RAG 层建立缓存或向量数据库（如 Milvus/Weaviate/PGVector）以支持更大规模知识库和更稳定的检索。

安全与生产注意事项
- 切勿在公共仓库或客户端暴露真实 API Key。生产建议：
  - 在后端代理中保存机密并由后端向 LLM 请求（前端调用后端）。
  - 对用户输入做严格校验与速率限制，防止滥用与额外费用。

下一步（我可以为你做的事）
- 我可以把 `App.tsx` 中大体功能拆成更小组件并提交 PR（例如 `Onboarding`, `Home`, `PlanInput`, `Result`）。
- 我也可以把 `services/geminiService.ts` 改造为一个本地的简单后端（Express + 环境变量），并演示如何从前端安全调用。

祝学习愉快！需要我把这个文档提交到仓库（已完成）并打开一个分支做重构吗？
