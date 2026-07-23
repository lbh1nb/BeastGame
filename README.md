# 🐑 兽了个兽

> Q萌卡通风格的消除类桌面小游戏 · Electron + Vue 3 + TypeScript + SQLite

---

## 📖 项目简介

「兽了个兽」是一款仿"羊了个羊"的消除类小游戏，采用 Q萌卡通风格，支持多模式玩法、闯关系统、道具系统、成就系统。

### 核心特性

- **三种游戏模式**：经典3消 / 四消模式 / 闯关模式
- **30关大型闯关**：6章节 × 5关，每章末尾为 Boss 关
- **6种章节主题**：家畜 / 宠物 / 小动物 / 野生 / 海洋 / 鸟类，共12种Q萌动物
- **道具系统**：撤回 / 洗牌 / 提示，每局固定发放 + 综合评分额外奖励
- **全量统计**：分数 / 连击 / 时长 / 消除数，本地排行榜
- **成就系统**：闯关成就 + 分数成就，共14个
- **全套音效**：3种BGM循环 + 13种SFX + 6档连击夸赞音效 + 游戏内统一温和风铃音效 + 加载界面12种动物真实叫声（点击触发）
- **解压即玩**：无需安装依赖、软件、环境变量，双击 exe 即可运行

---

## 🚀 快速开始

### 玩家使用（解压即玩）

**下载地址**：[GitHub Release v1.1.0](https://github.com/lbh1nb/BeastGame/releases/tag/v1.1.0)

1. 点击上方链接，下载 `BeastGame-portable.zip`（约 120MB）
2. 解压到任意目录
3. 双击 `BeastGame.exe` 即可运行

> **无需安装任何依赖、无需配置环境变量、无需 Node.js**
>
> 存档位置：`%APPDATA%\BeastGame\data.db`（删除游戏文件夹不影响存档）

### 开发者指南

#### 环境要求

- Node.js >= 18
- npm >= 9
- Windows 10/11 x64

#### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 打包

```bash
# 编译 + 打包为解压版文件夹（输出到 release/win-unpacked/）
npm run build:win

# 交付物：release/win-unpacked/ 文件夹
# 压缩后即可分发给玩家
```

#### 类型检查

```bash
npm run typecheck
```

---

## 🎮 玩法说明

### 经典3消

- 点击图案放入底部槽位
- 集齐 **3个相同动物** 即可消除
- 槽位共 **8格**，填满即失败
- **180张牌** 全屏单大堆 **8层** 堆叠，画面充实
- 连击得高分

### 四消模式

- 需要集齐 **4个相同动物** 才能消除
- 槽位 **9格**
- **240张牌** 全屏单大堆 **8层** 堆叠
- 难度更高，得分更多

### 闯关模式

- 共 **6章 30关**，逐关解锁
- 牌数从 **180张递增至540张**，全屏单大堆 **8-12层** 堆叠
- 每章第5关为 **Boss 关**（图案更多 + 240秒限时）
- 通关获星级评价（1-3星）
- 综合评分达标额外奖励道具

### 道具说明

| 道具 | 图标 | 效果 |
|---|---|---|
| 撤回 | ↩ | 取消上一次点击操作 |
| 洗牌 | 🔀 | 重新打乱牌堆中剩余图案 |
| 提示 | 💡 | 高亮一组可消除的相同图案 |

### 综合评分奖励

游戏结束时的综合评分 = 基础分×0.5 + 连击奖励 + 时间奖励

| 总分阈值 | 奖励 |
|---|---|
| ≥ 800 | +1撤回 +1洗牌 |
| ≥ 1500 | +1提示 |
| ≥ 2500 | +1撤回 |

---

## 🎨 视觉设计

- **风格**：Q萌卡通
- **主色**：橙黄 `#ffb84d`
- **背景**：暖米色 `#fff5e1`
- **窗口**：竖版 800×1200（手机比例）
- **动物图案**：12种 Canvas 程序化绘制 **24×24 像素风 Q 萌动物**，每种有独特体型轮廓+配色纹理，悬停弹跳+眨眼；游戏内消除使用统一温和风铃音效，加载界面点击装饰动物可触发真实叫声

### 章节主题色

| 章节 | 主题 | 动物 | 配色 |
|---|---|---|---|
| 第1章 | 家畜 | 🐑🐔 | 浅黄 |
| 第2章 | 宠物 | 🐱🐶 | 浅粉 |
| 第3章 | 小动物 | 🐰🐹 | 浅绿 |
| 第4章 | 野生 | 🐯🐻 | 浅橙 |
| 第5章 | 海洋 | 🐟🐳 | 浅蓝 |
| 第6章 | 鸟类 | 🐤🦢 | 浅紫 |

---

## 📁 项目结构

```
beast-game/
├── package.json                 # 依赖与脚本
├── electron.vite.config.ts      # electron-vite 构建配置
├── electron-builder.json        # 打包配置（解压版文件夹）
├── tsconfig.json                # TS 配置入口
├── tsconfig.node.json           # 主进程/Preload TS 配置
├── tsconfig.web.json            # 渲染层 TS 配置
├── resources/                   # 静态资源（音频/图标）
│   ├── audio/                   # 音频文件（可选，缺失时程序化生成回退）
│   └── README.md               # 资源说明
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             # 入口：创建窗口 + 初始化DB + 注册IPC
│   │   ├── db/                  # SQLite 数据层
│   │   │   ├── index.ts         # 数据库初始化 + nativeBinding
│   │   │   ├── schema.sql       # 建表 SQL
│   │   │   └── repository.ts    # CRUD 操作
│   │   └── ipc/                 # IPC 处理器
│   │       ├── score.ts         # 分数记录
│   │       ├── progress.ts      # 闯关进度
│   │       ├── achievement.ts   # 成就
│   │       ├── settings.ts      # 设置
│   │       └── asset.ts         # 资源路径
│   ├── preload/
│   │   └── index.ts             # contextBridge 暴露 gameAPI
│   ├── game/                    # 游戏引擎（纯TS，无Vue依赖）
│   │   ├── types.ts             # 类型定义
│   │   ├── engine.ts            # 游戏引擎核心
│   │   ├── matcher.ts           # 消除判定
│   │   ├── generator.ts         # 关卡布局生成
│   │   ├── levels.config.ts     # 30关 + 6章配置
│   │   └── scoring.ts           # 评分系统
│   └── renderer/                # Vue 3 渲染层
│       ├── index.html
│       └── src/
│           ├── main.ts          # Vue 入口
│           ├── App.vue          # 根组件
│           ├── router/          # Vue Router
│           ├── stores/          # Pinia 状态管理
│           │   ├── game.ts      # 游戏状态
│           │   ├── settings.ts  # 设置
│           │   └── user.ts      # 玩家进度
│           ├── views/           # 页面
│           │   ├── Home.vue     # 主菜单
│           │   ├── Game.vue     # 游戏页
│           │   ├── Levels.vue   # 选关
│           │   ├── Settings.vue # 设置
│           │   └── Records.vue  # 记录
│           ├── components/      # 组件
│           │   ├── game/        # 游戏组件
│           │   └── common/      # 通用组件
│           ├── audio/           # Howler.js 音效管理
│           ├── types/           # 全局类型声明
│           └── assets/          # 样式
├── README.md                    # 本文件
└── ARCHITECTURE.md              # 架构文档
```

---

## 🔧 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 桌面壳 | Electron | 28+ |
| 构建 | electron-vite + Vite | 2.3+ |
| 渲染层 | Vue 3 + TypeScript | 3.5+ |
| 状态管理 | Pinia | 2.2+ |
| 路由 | Vue Router | 4.4+ |
| 数据库 | sql.js（纯 JavaScript SQLite） | 1.14+ |
| 音效 | Howler.js + Web Audio API | 2.2+ |
| 打包 | electron-builder | 24+ |

---

## 📦 解压即玩说明

本项目采用 **解压版文件夹** 打包方式，玩家无需安装任何依赖：

1. **Node.js 运行时**：Electron 自带，不需系统安装
2. **Chromium 浏览器**：Electron 自带
3. **SQLite 数据库**：`sql.js`（纯 JavaScript，无需原生模块），WASM 文件随包附带
4. **音效**：真实音频文件 + Web Audio API 程序化回退；图片资源打包进 `resources/`
5. **配置文件**：首次启动自动生成到 `%APPDATA%\BeastGame\`
6. **环境变量**：完全不依赖

### 打包后目录结构

```
BeastGame-win-unpacked/
├── BeastGame.exe                ← 双击运行
├── resources/
│   ├── app.asar                 ← 打包后的代码
│   ├── native/
│   │   └── sql-wasm.wasm        ← SQLite WASM 文件
│   ├── audio/                   ← 音频文件
│   └── README.md
├── chrome_100_percent.pak       ← Chromium 运行时
├── ffmpeg.dll
├── icudtl.dat
└── ... (其他 Chromium 依赖)
```

---

## 📝 许可证

MIT License
