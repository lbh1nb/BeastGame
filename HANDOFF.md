# 项目交接文档（HANDOFF）

> 本文件用于把「兽了个兽」项目的全部上下文、当前进度、待办事项打包给**下一个新会话**。
> 新会话务必先阅读本文件，再继续开发。生成时间：2026-08-04。

---

## 一、项目是什么

**兽了个兽**（BeastGame）—— 一款 Q 萌卡通风格的消除类桌面小游戏（Electron 桌面应用）。

- 游戏类型：三消/四消消除 + 闯关模式
- 目标用户：非技术业务人员（文档需用大白话）
- 版本：v1.3.0
- 运行方式：`release/win-unpacked/BeastGame.exe`（打包产物）

---

## 二、技术栈

| 层 | 技术 |
|----|------|
| 桌面壳 | Electron 28 + electron-vite |
| 前端 | Vue 3 + Pinia + Vue Router |
| 3D 地球 | Three.js（WebGL SphereGeometry） |
| 数据库 | sql.js（纯 JS SQLite，**禁止** better-sqlite3） |
| 音频 | Howler + 内置 toneGenerator（JS 合成） |

---

## 三、当前进度（重要）

### 3.1 已完成的核心功能
- 56 种动物模型（6 章：家畜8/野兽10/森林10/小动物8/海洋10/综合10），图片素材在 `resources/animals/static/` 和 `active/`
- 三消/四消游戏逻辑 + 道具（提示/洗牌/撤销）
- 闯关模式：地球 360° 选关（Three.js 卡通地球 `earth_texture_cartoon_v9.jpg`）
- 5 种章节机制：闹脾气(moody)/藤蔓(vine)/贪睡(sleepy)/躲猫猫(hidden)/气泡(bubble)
- 连击系统 + BGM + 音效（统一用 toneGenerator）

### 3.2 最近完成的改动（机制动画系统）
已为 5 种机制实现**完整动画**：
- **idle**（机制存在时）：漂浮/摇摆/脉动
- **resolving**（解除动画）：`moody`/`sleepy` 用 **Seedance 解除视频**播放（`<video>` + `playbackRate=4`）
- **breaking**（破除动画）：`vine`/`bubble` 用 **Seedance 破除视频**播放
- **revealing**（翻牌动画）：`hidden` 保留 CSS `rotateY` 翻转
- **rejected**（点击被拒）：shake 动画
- 视频不可用（缺失/加载失败）时自动回退到「静态图 + CSS 动画」，另含四重反馈（放大强调 + 爆发特效层 + 白色闪光 + 粒子爆发）。

相关文件：
- `src/renderer/src/components/game/Tile.vue`（动画渲染核心 + `<video>` 播放）
- `src/renderer/src/stores/game.ts`（`MECHANIC_ANIM_DURATION`、`triggerMechanicAnim`）
- `src/renderer/src/utils/mechanic-image.ts`（机制素材加载）
- `src/renderer/src/utils/mechanic-video.ts`（机制解除视频加载/缓存/预加载）
- `resources/mechanics/`（14 张 Seedream 生成的机制图 + 爆发特效图 + 粒子图，见下）

### 3.3 机制素材清单（`resources/mechanics/`）
| 文件 | 用途 |
|------|------|
| moody_cloud.jpg / vine.jpg / sleepy_zzz.jpg / bubble.jpg / hidden_q.jpg | 5 种机制主图 |
| burst_moody.jpg / burst_vine.jpg / burst_sleepy.jpg / burst_bubble.jpg / burst_hidden.jpg | 5 种爆发特效图 |
| star.jpg / leaf_particle.jpg / droplet.jpg / cloud_piece.jpg | 4 种粒子图 |
| videos/moody_resolve.mp4 / sleepy_resolve.mp4 / vine_resolve.mp4 / bubble_resolve.mp4 / hidden_resolve.mp4 | 5 个机制解除视频（Seedance 生成，hidden 未接入） |

---

## 四、待办事项（按下个会话要做的优先级）

### 4.1 【协作模式】Seedance 素材由 work 模式 agent 提供（已确认）
- **已确认（2026-08-04）**：code 模式下 Seedance 工具**不可用**，无法生成视频/图片；只有 **work 模式**可用 Seedance / Seedream。
- **协作模式**：「work 模式 agent」负责生成图片与动画素材 → 放入 `resources/` 对应目录 → 「code 模式 agent」负责继续开发并集成素材。
- **code 模式 agent（本会话）须知**：不要强行调用 Seedance/GenerateVideo（会失败）。需要图片/视频/动画素材时，请 work 模式 agent 生成后放到资源目录，再集成。
- 当前功能已用「Seedream 静态图 + CSS 动画」完整实现，**不受 Seedance 缺失影响**。

### 4.2 待处理的 git 状态
- 当前有**大量未提交改动**和**未跟踪文件**（见 `git status`），需要在合适时机 commit + push。
- 未跟踪文件包括：`agent.md`、`resources/mechanics/`、`resources/animals/`、`scripts/`、`preview/`、部分地球贴图、`src/.../GameTitle.vue`、`animal-image.ts`、`mechanic-image.ts`、`mechanic-video.ts` 等。

### 4.3 机制解除视频集成（已完成 2026-08-05）
- work 模式已生成 5 个机制解除视频（`resources/mechanics/videos/{mechanic}_resolve.mp4`），本会话已集成：
  - `moody`/`sleepy`（resolving）与 `vine`/`bubble`（breaking）用 `<video>` 播放，`playbackRate=4` 加速到 ~1 秒。
  - `hidden`（revealing）为翻牌语义，**保留 CSS 翻牌动画，不接入视频**。
  - 修复了遮罩层在解除瞬间因 `stuck` 置 0 而隐藏、导致动画/视频无法显示的 bug。
  - 动画时长 `MECHANIC_ANIM_DURATION` 的 resolving/breaking 调整为 1000ms，与视频时长对齐。
- 新增文件：`src/renderer/src/utils/mechanic-video.ts`（视频加载/缓存/预加载）。

---

## 五、关键文件路径索引

| 路径 | 说明 |
|------|------|
| `src/game/engine.ts` | 游戏核心逻辑，机制状态变更 |
| `src/game/types.ts` | 机制事件类型、游戏状态 |
| `src/game/levels.config.ts` | 关卡配置 |
| `src/renderer/src/stores/game.ts` | Pinia 游戏状态 + 动画触发 |
| `src/renderer/src/components/game/Tile.vue` | 牌面 + 机制动画 |
| `src/renderer/src/components/game/EarthGlobe.vue` | 3D 选关地球 |
| `src/renderer/src/components/game/PixelAnimal.vue` | 动物渲染 |
| `src/renderer/src/utils/animal-image.ts` | 动物图加载（去背景/裁剪/缓存） |
| `src/renderer/src/utils/mechanic-image.ts` | 机制素材加载 |
| `src/renderer/src/utils/mechanic-video.ts` | 机制解除视频加载/缓存/预加载 |
| `src/renderer/src/audio/manager.ts` | 音频管理 |
| `src/renderer/src/audio/tone-generator.ts` | 音效合成 |
| `resources/animals/` | 动物素材（static 牌面 / active 悬停） |
| `resources/mechanics/` | 机制素材 |
| `scripts/generate-preview.ts` | 生成预览页 `preview/animals-preview.html` |
| `scripts/gen-earth-preview.js` | 生成地球贴图对比预览 |

---

## 六、构建 / 运行命令

```bash
npm install          # 安装依赖（已装好）
npm run dev          # 开发模式
npm run typecheck    # 类型检查
npm run build:win    # 构建 + 打包 Windows 可执行（release/win-unpacked/BeastGame.exe）
```

> 每次代码改动后必须跑 `npm run build:win`，确保 release 产物最新。

---

## 七、素材来源与替换规则

- 动物素材来自 `shoulege-shou-animals-assets/`（static 牌面 + active 悬停），已复制到 `resources/animals/`。
- 新增动物素材：放入 `resources/animals/static/{animal}.jpg` 和 `active/{animal}_active.jpg` 即可自动加载。
- 机制素材：放入 `resources/mechanics/`。
- 地球贴图：`resources/earth_texture_cartoon_v9.jpg`（2:1 等距圆柱 Q 萌卡通）。

---

## 八、Agent 行为规范（必须遵守）

详见 `agent.md`，核心要点：
1. **中文回复**；不做模糊决策，不用"应该/可能"。
2. 每次改动按 6 步：理解→分析→计划→确认(AskUserQuestion)→执行→审查+解释。
3. 改动后必须 `npm run build:win` 并确认成功。
4. **最小化修改**，不碰无关代码，不做过度设计。
5. 涉及视觉/图片/视频/动画任务时，优先使用 Seedream / Seedance。

---

## 九、硬约束速查（详见 agent.md 第六节）

- sql.js（禁 better-sqlite3）
- Howler `html5: true`
- 消除+combo 音效用 toneGenerator，不走 Howler
- 覆盖判断含 `inSlot`，半整数坐标
- 可见=可点击，灰色牌不可点
- BGM 默认音量 60
- 构建后验证 app.asar 在 zip 中

---

## 十、给下一个会话的开场自检

- [ ] 已读本 HANDOFF.md
- [ ] 已读 agent.md（行为规范）
- [ ] 已用 `git status` 确认当前改动
- [ ] 已确认 Seedance 是否可用（待办 4.1）
- [ ] 已确认 `npm run build:win` 产物为最新