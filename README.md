# 林氏春秋（Web + App 壳）

这是一个基于 `React + Vite + Capacitor` 的家谱与家族动态 App MVP。

当前首版已包含：
- 登录
- 家谱查看与编辑
- 动态发布（图文/视频）
- 口述录音发布
- 家族消息（会话列表、实时收发、未读数）
- 家族消息弱网补强（断线自动重连、离线消息补拉）
- 通知中心（含实时更新）
- 后台管理系统（用户管理、动态审核、系统公告、审计日志）
- Capacitor iOS/Android 壳工程

## 1. 环境准备

- Node.js 18+
- npm 9+
- iOS 开发需 macOS + Xcode
- Android 开发需 Android Studio

## 2. 本地启动（Web 联调）

1. 安装依赖

```bash
npm i
```

2. 启动后端（默认 `3001`）

```bash
npm run dev:server
```

3. 启动前端（默认 `3000`）

```bash
npm run dev
```

测试账号：
- 手机号：`13800000000`
- 密码：`123456`
- 备用账号：`13800000001 / 123456`
- 备用账号：`13800000002 / 123456`

管理员后台：
- 地址：`http://localhost:3000/admin`
- 超管：`admin / admin123`
- 运营：`operator / operator123`
- 审核：`reviewer / reviewer123`

## 3. App 壳运行（Capacitor）

### 3.1 先构建并拷贝 Web 资源到壳工程

```bash
npm run mobile:build
```

### 3.2 打开原生工程

```bash
npm run cap:open:ios
npm run cap:open:android
```

### 3.3 每次前端改动后同步

```bash
npm run mobile:build
# 或者
npm run cap:sync
```

## 4. 壳内访问本地后端说明

项目已内置以下默认策略：
- Web 端：走相对地址（`/api`，由 Vite 代理到 `http://localhost:3001`）
- 原生 Android 模拟器：默认后端地址 `http://10.0.2.2:3001`
- 原生 iOS 模拟器：默认后端地址 `http://localhost:3001`

如果你要在真机调试，请手动指定后端地址（你电脑局域网 IP）：

```bash
# 示例：你的电脑 IP 是 192.168.1.12
VITE_NATIVE_API_BASE_URL=http://192.168.1.12:3001 npm run build
npm run cap:copy
```

> 注意：手机和电脑必须在同一局域网。

## 5. 已接入的原生能力（首版）

- 相册读取（系统相册多选）
- 相机拍照上传
- 麦克风权限（录音发布）
- 推送注册初始化（获取设备推送 token）

## 6. 常用命令

```bash
npm run dev                 # 前端开发
npm run dev:server          # 后端开发
npm run build               # 构建 Web
npm run mobile:build        # 构建并拷贝到壳工程
npm run cap:sync            # 同步配置与插件
npm run cap:open:ios        # 打开 iOS 工程
npm run cap:open:android    # 打开 Android 工程
```

## 7. 后台管理能力说明（MVP+）

- 角色权限：
  - `super_admin`：全部权限（含用户封禁、日志查看）
  - `operator`：运营权限（公告发布、用户只读、审核只读）
  - `reviewer`：审核权限（动态审核、公告只读）
- 动态审核：
  - 支持“审核备注模板”与自定义备注
- 公告发布：
  - 支持“立即发布”与“定时发布”
  - 定时公告到点后自动转为已发布并广播通知
