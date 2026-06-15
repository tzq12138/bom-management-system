# AGENTS.md

## 快速导航

本文件为 AI 助手提供项目关键信息。详细架构和命令参考请查看 `CLAUDE.md`。

## 项目结构

- `bom-app/` — React 19 + TypeScript + Vite 前端
- `bom-server/` — 零依赖 Node.js 后端 (原生 `node:http`，无 Express)
- `stitch_bom_team_management_system/` — HTML 原型设计稿，非生产代码

## 关键约束

### 启动顺序
后端必须先于前端启动。前端 Vite 代理 `/api/*` 到 `http://localhost:3001`。

### 无测试框架
项目没有测试文件或测试框架。不需要运行测试命令。

### 数据存储
所有业务数据存储在 `bom-server/data/store.json`。前端 API 客户端：`bom-app/src/services/storage.ts`。

### 路由机制
无 react-router。`App.tsx` 使用 `currentPage` 状态变量和 `switch` 语句渲染页面组件。

### 权限系统
三种角色：admin（完全访问）、editor（创建/编辑/导出）、viewer（只读）。权限检查在前端和后端同时进行。

## 常用命令

```bash
# 前端
cd bom-app
npm run dev       # 开发服务器 http://localhost:5173
npm run build     # tsc -b && vite build
npm run lint      # ESLint 检查

# 后端
cd bom-server
npm start         # 生产模式端口 3001
npm run dev       # 开发模式自动重启
```

## 代码规范

- TypeScript 严格模式，启用 `noUnusedLocals` 和 `noUnusedParameters`
- Tailwind CSS v4 + Material Design 3 自定义主题
- UI 语言：中文（简体）
- 实体 ID 前缀：`proj-1`, `mat-1`, `mod-1`, `user-1`, `part-1`
- 后端使用 ES module (`import/export`)

## 演示凭据

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | admin |
| zhangsan | demo | editor |
| lisi | demo | editor |
| wangwu | demo | viewer |
