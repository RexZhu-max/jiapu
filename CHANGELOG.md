# Changelog

所有值得关注的变更都会记录在这里。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号建议遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Planned
- Capacitor 壳接入（Android/iOS 工程骨架）
- 上传任务单文件重试与失败项继续处理
- 通知与动态局部更新进一步细化（减少闪烁与重复请求）

## [0.1.0] - 2026-03-05

### Added
- 新增本地后端服务（`server/server.cjs`），提供：
  - 登录鉴权（`/api/auth/login`, `/api/auth/me`）
  - 家谱数据接口（拉取、新增代系、新增成员、编辑成员）
  - 动态接口（列表、发布）
  - 媒体上传接口（图片/视频/音频，Base64 入库落盘）
  - 通知接口（列表、单条已读、全部已读、删除、清空已读）
- 新增实时消息通道 SSE（`/api/stream`）：
  - `moment-updated`
  - `notification-updated`
  - `family-tree-updated`
- 新增前端 API 与会话管理层（`src/lib/api.ts`）：
  - Token 持久化
  - 统一请求封装
  - SSE 订阅
  - 媒体上传增强（进度、重试、图片压缩、可取消）
- 新增登录页面（`src/components/auth/LoginView.tsx`）
- 新增统一状态提示组件（`src/components/common/StatusNotice.tsx`）
- 新增基础埋点工具（`src/lib/telemetry.ts`）

### Changed
- `App` 主流程改为登录态驱动，接入实时更新与主数据刷新。
- 首页动态改为优先使用后端真实数据（无数据时使用本地回退）。
- 动态发布页改为真实上传与发布，并发上传队列（最多 3 并发）、总进度展示、上传取消。
- 口述录音页改为真实录音上传与发布，显示上传进度与重试提示。
- 通知页改为真实数据，并接入 SSE 局部更新（新增/已读/删除/清空已读）。
- 家谱页改为真实数据，支持新增代系/成员/编辑成员并显示成功失败提示。
- 成员编辑页补充字段校验（姓名、角色必填；出生日期格式校验）。
- 新增 Vite 代理配置（`/api` 与 `/uploads` 指向 `3001`）。
- 更新 README，补充本地前后端启动方式和测试账号说明。

### Fixed
- 修复邀请弹窗中无效图标导入导致的构建风险（移除 `Wechat` 导入）。
- 补充 `.gitignore`，避免提交 `node_modules` 与构建产物。

### Security
- 基础鉴权拦截：无 token 或过期 token 的接口访问返回 `401`。

### Notes
- 当前为 MVP 阶段，支付与会员能力按需求暂未接入。
- 当前后端为本地 JSON 存储方案，适合开发与联调，不建议直接用于生产环境。

