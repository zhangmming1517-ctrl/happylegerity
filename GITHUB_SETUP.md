# 上传项目到 GitHub - 快速指南

本指南帮助你快速将「AI 极简饮食规划助手」项目上传到 GitHub。

## 📋 前置条件

- 已安装 Git（[下载](https://git-scm.com)）
- 拥有 GitHub 账户（[注册](https://github.com/signup)）
- 已配置 Git 全局信息

## 🔧 配置 Git（首次使用）

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

## 📌 上传步骤

### 方式 1：从本地推送（推荐）

#### 第 1 步：在 GitHub 上创建新仓库

1. 登录 GitHub
2. 点击右上角 `+` → `New repository`
3. 填写仓库信息：
   - **Repository name**: `legerity`（或你喜欢的名称）
   - **Description**: "AI 极简饮食规划助手 - 智能周计划工具"
   - **Public** 或 **Private**（选择 Public 让更多人看到）
   - **Add a README**：不勾（我们已有 README）
   - **Add .gitignore**：不勾（我们已有 .gitignore）
   - **License**：不勾（我们已有 MIT LICENSE）
4. 点 **Create repository**

#### 第 2 步：本地初始化 Git（如尚未）

```bash
cd e:\实习简历\Agent_project\workout_diet\Legerity

# 初始化 Git（如第一次）
git init

# 添加所有文件
git add .

# 首次提交
git commit -m "feat: 初始化项目 - AI 极简饮食规划助手

- 基于 React 19 + TypeScript + Vite
- 支持 PWA 离线使用和 iOS 安装
- 集成 Google Gemini LLM
- 完整的营养知识库和 RAG 检索"
```

#### 第 3 步：连接远程仓库

```bash
# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/legerity.git

# 验证连接
git remote -v
```

#### 第 4 步：推送到 GitHub

```bash
# 重命名分支为 main（如当前为 master）
git branch -M main

# 推送所有代码
git push -u origin main
```

**输入 GitHub 凭证时**：
- **用户名**：你的 GitHub 用户名
- **密码**：创建个人访问令牌（PAT）而非账户密码

#### 创建个人访问令牌（PAT）

1. GitHub 右上角 Settings → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. 点 **Generate new token**
3. 勾选权限：
   - `repo`（完整仓库访问）
   - `gist`（可选）
4. 设置过期时间（建议 90 天）
5. 点 **Generate token**
6. **复制 token**（只显示一次！）
7. 在 Git 推送时粘贴此 token 作为"密码"

### 方式 2：GitHub Web UI 直接上传（简单但限制多）

1. GitHub 创建仓库后，进入仓库首页
2. 点 **Add file** → **Upload files**
3. 拖拽或选择项目文件
4. 输入提交信息
5. 点 **Commit changes**

**注意**：Web UI 一次只能上传 100 个文件，超过需分多次。建议用方式 1。

---

## ✅ 验证上传

上传完毕后，访问你的仓库：

```
https://github.com/YOUR_USERNAME/legerity
```

检查清单：
- ✓ 所有文件都已推送（包括 `README.md`、`DEPLOYMENT.md` 等）
- ✓ `.env.local` 不在仓库中（被 .gitignore 忽略）
- ✓ `node_modules/` 不在仓库中
- ✓ `dist/` 不在仓库中（构建产物，每次 build 生成）
- ✓ GitHub 自动识别项目为 "TypeScript" 和 "PWA"

---

## 🔄 后续更新

本地修改后推送到 GitHub：

```bash
# 编辑代码...
git add .
git commit -m "fix: 修复输入框数字删除问题"
git push origin main
```

---

## 🎯 上线与部署

推送到 GitHub 后，可轻松部署到生产环境：

### 部署至 Vercel（推荐）

1. 访问 [Vercel](https://vercel.com)
2. 用 GitHub 账户登录
3. 点 **New Project**
4. 选择 `legerity` 仓库
5. 添加环境变量 `GEMINI_API_KEY`=`你的_key`
6. 点 **Deploy**

**完毕！** 你的应用已通过 HTTPS 在线，可在 iOS Safari 中"添加到主屏幕"。

### 部署至 Netlify

类似流程，详见 [DEPLOYMENT.md](./DEPLOYMENT.md#4-云部署vercelnetlify)。

---

## 🆘 常见问题

**Q: 推送时显示 `permission denied (publickey)`？**  
A: SSH Key 配置问题。方案：
1. 在 GitHub Settings → SSH and GPG keys 中添加你的 SSH 公钥，或
2. 改用 HTTPS 链接（需 PAT）

**Q: `fatal: 'origin' does not appear to be a 'git' repository`？**  
A: 未运行 `git init` 或路径不对。检查：
```bash
git remote -v    # 应显示你的仓库链接
```

**Q: 如何修改已推送的提交信息？**  
A: 不建议修改已推送的历史。新提交更正即可。如必须修改，使用 `git rebase` 后 `git push -f`（仅限个人仓库）。

**Q: 如何添加协作者？**  
A: 仓库 Settings → **Collaborators** → **Add people** → 输入用户名

---

## 📚 相关文档

- [README.md](./README.md) - 项目介绍
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 详细部署指南
- [CONTRIBUTING.md](./CONTRIBUTING.md) - 贡献指南
- [TECH_STACK_LEARNING.md](./TECH_STACK_LEARNING.md) - 技术栈学习

---

祝你上传顺利！如有问题欢迎在 GitHub Issues 中反馈。🚀
