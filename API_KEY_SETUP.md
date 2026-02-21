# 🔑 API Key 配置指南

## 关键信息：Vite 安全机制

**Vite 为了安全起见，只有带 `VITE_` 前缀的环境变量才会被允许透传给前端代码！**

这是一个 **重要的安全特性**，防止了敏感变量意外暴露到客户端。

### 为什么必须用 `VITE_` 前缀？

| 变量名 | 是否暴露到前端 | 说明 |
|-------|-------------|------|
| `API_KEY` | ❌ 不会 | Vite 默认不暴露 |
| `VITE_API_KEY` | ✅ 会 | `VITE_` 前缀的才会暴露 |
| `VITE_GEMINI_API_KEY` | ✅ 会 | 我们就用这个 |

---

## 🔧 正确配置步骤

### 1️⃣ 在 `.env.local` 中设置（**必须带 VITE_ 前缀**）

```dotenv
VITE_GEMINI_API_KEY=AIzaSyB1V0uxzG0EWLZFhGdnlB71uwRAgzxzYWo
```

### 2️⃣ 代码中使用 `import.meta.env` 访问

```typescript
// ✅ 正确做法
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// ❌ 旧做法（已修复）
// const apiKey = process.env.API_KEY;
```

### 3️⃣ TypeScript 类型声明（可选但推荐）

在 `types.ts` 或 `env.d.ts` 中添加：

```typescript
interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## 🚀 快速修复（如果你遇到 "API Key 未配置"）

### 本项目已自动处理：

1. ✅ `.env.local` 已更新为 `VITE_GEMINI_API_KEY=xxx`
2. ✅ `services/geminiService.ts` 已改为使用 `import.meta.env.VITE_GEMINI_API_KEY`
3. ✅ 错误信息已改进

### 你需要做的：

```bash
# 1. 确保 .env.local 有正确的变量
cat .env.local
# 应该显示：VITE_GEMINI_API_KEY=AIzaSyB...

# 2. 重启开发服务器（重要！）
npm run dev

# 3. 到浏览器中生成食谱测试
# 应该正常工作了
```

---

## 📋 故障排查

### 问题：仍然显示 "❌ Gemini API Key 未配置"

**检查清单：**

```bash
# 1. 检查 .env.local 格式
# 应该是：VITE_GEMINI_API_KEY=xxx（没有空格）
grep "VITE_GEMINI_API_KEY" .env.local

# 2. 重启开发服务器（关键！）
npm run dev

# 3. 清除浏览器缓存和 Service Worker
# 在浏览器 DevTools → Application → Clear site data

# 4. 检查错误消息用 F12 打开 Console
# 会显示具体的错误原因
```

### 问题：在 Netlify 部署时 API Key 无效

**Netlify 配置步骤：**

```bash
# 1. 在 Netlify 后台找到 "Build & deploy" → "Environment"
# 2. 点击 "Edit variables" 并添加：
#    Key: VITE_GEMINI_API_KEY
#    Value: AIzaSyB... （你的真实 API Key）

# 3. 触发重新部署
# 在 Netlify 后台点击 "Trigger deploy"
```

---

## 🎯 核心原理

### Vite 环境变量的工作流程

```
.env.local (你的本地文件)
    ↓
Vite 构建系统读取
    ↓
寻找 VITE_ 前缀的变量
    ↓
注入到 import.meta.env 中
    ↓
前端代码可通过 import.meta.env.VITE_XXX 访问
```

### 为什么是 `import.meta.env` 而不是 `process.env.XXX`？

- `process.env` 仅在 Node.js 环境中完整可用（Vite build time）
- 浏览器运行时需要通过 `import.meta.env` 访问注入的变量
- 这样做还避免了在前端代码中暴露所有 Node.js 进程变量

---

## ✅ 验证配置成功

### 测试代码片段

在浏览器 Console 中运行：

```javascript
// 如果看到你的 API Key，说明配置正确
console.log(import.meta.env.VITE_GEMINI_API_KEY);

// 应该输出：AIzaSyB1V0uxzG0EWLZFhGdnlB71uwRAgzxzYWo
```

---

## 🔐 安全建议

1. **本地开发**：`.env.local` 已在 `.gitignore` 中，不会上传到 GitHub ✅
2. **生产部署**：
   - ❌ 不要硬编码 API Key 到源代码中
   - ✅ 使用部署平台的环保变量功能（Netlify/Vercel/etc）
   - ✅ 考虑未来用后端代理来隐藏 API Key

---

## 📚 相关文档

- [Vite 官方文档 - 环境变量](https://vitejs.dev/guide/env-and-mode)
- [env.config.ts](env.config.ts) - 本项目的环保变量配置
- [.env.local](.env.local) - 本地开发环保变量（不上传 to GitHub）
- [netlify.toml](netlify.toml) - Netlify 部署配置

---

## ❓ FAQ

**Q: 为什么我改了 `.env.local` 后仍然报错？**
A: 需要重启 `npm run dev`。Vite 只在启动时读取环保变量。

**Q: 可以用 `process.env.VITE_GEMINI_API_KEY` 吗？**
A: 在浏览器端不行。必须用 `import.meta.env.VITE_GEMINI_API_KEY`。

**Q: API Key 会泄露到浏览器吗？**
A: 会。这就是为什么生产环境应该用后端代理来隐藏 API Key。

**Q: 本地开发时 API Key 会被上传到 GitHub 吗？**
A: 不会。`.env.local` 在 `.gitignore` 中。

---

**最后更新**：2026-02-15  
**状态**：✅ VITE_ 前缀强制实施完毕
