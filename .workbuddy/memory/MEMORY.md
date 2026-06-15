# 记忆文件

## 项目信息

### BOM 管理软件
- **位置**: `d:/项目/bom/bom-management-system/bom-app/`
- **技术栈**: React + Vite + TypeScript + Tailwind CSS v4
- **数据存储**: localStorage（可切换为后端 API）
- **状态**: 功能完善中

### 模块管理功能 (2026-04-22 新增)
- 按机台工位分类的大模块/子模块结构
- 每个零件支持设置默认品牌和多个替代品牌
- 示例数据：视觉系统（相机、镜头、光源、采集卡）、电气系统（PLC、伺服）、线缆组件

### 登录与权限系统 (2026-04-22 新增)
- 登录页面：支持用户名密码登录和快速登录演示账号
- 三种角色：admin（管理员）、editor（编辑者）、viewer（查看者）
- 权限控制：创建、编辑、删除、批准、导出、管理用户等
- 用户管理：管理员可添加、编辑、删除用户，设置角色
- 设置页面：个人资料、用户管理、系统设置
- 帮助页面：快速开始、模块库使用、版本管理、常见问题等

## 用户偏好
- 简洁直接的沟通风格
- Windows 用户，PowerShell/Git Bash 终端
- 熟悉 WinForms 开发
- 中文界面

## 当前任务
- BOM 管理前端：Dashboard、Projects、Modules、Materials、Activity 五个页面
- 核心功能：CRUD、版本管理、模块化BOM组合
- 待完成：Excel 导入导出、模块应用到BOM项目
