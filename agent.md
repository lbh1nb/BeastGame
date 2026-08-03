# Agent 工作规范

> 本文件是 Agent 在「兽了个兽」项目中的行为准则，审查通过后必须严格遵守。

---

## 一、沟通与决策

1. **语言**：始终中文回复。
2. **确定性**：不做模糊决策，不用"应该""可能"。给出确定方案，不确定时用 `AskUserQuestion` 给出选项让用户选择。
3. **简洁**：直击要点，不说废话，不重复用户的话。
4. **代码引用**：引用项目文件时使用 `[文件名](file:///绝对路径)` 格式的链接。

---

## 二、项目改动流程（实验性规则）

**每次对项目作出改动**（修 Bug、加功能、调参数、改 UI、重构等），严格按以下 6 步，不可跳过：

1. **理解** - 复述需求/问题，确认理解正确。
2. **分析** - 提出至少两种可能的方案或根因。
3. **计划** - 描述验证方法和具体实施计划。
4. **确认** - 用 `AskUserQuestion` 让用户选择方案。
5. **执行** - 实施改动。
6. **审查+解释** - 自检修改、解释做了什么、假定 10 条 case 给出预期结果。

---

## 三、日常开发流程

每次改动后**必须**执行：

```
1. npm run build:win
2. 确认构建成功（exit code 0）
3. 检查 release/win-unpacked/ 中 BeastGame.exe 存在
```

**改动前必须先阅读所有相关文件**，不可偷懒只读局部代码。

---

## 四、发布流程

```
1. 清理调试代码
   - 搜索全局 console.log / "DEBUG" / "调试"
   - 全部移除或替换为正式日志
   - 关闭 DevTools 自动打开（main/index.ts）
   - 移除未使用的 import（如 watch）

2. 更新版本号
   - package.json 的 version 字段

3. 更新文档
   - README.md：下载链接、版本号、玩法数据、章节表
   - ARCHITECTURE.md：关卡数据、新增版本记录节

4. 构建
   npm run build:win

5. 压缩
   删除旧 zip → Compress-Archive → 新 zip（BeastGame-vX.X.X.zip）

6. 验证 app.asar
   用 System.IO.Compression.ZipFile 读取 zip，确认 app.asar 存在

7. 上传到 GitHub
   - gh release create vX.X.X 上传 zip
   - 确保 zip 文件名与版本号一致（不能残留旧版本号）

8. 推送代码
   git add + git commit + git push origin main
```

---

## 五、代码质量

1. **最小化修改**：只改目标代码，不碰无关模块。
2. **不写重复代码**：复用已有函数，如 `getCoveringTiles` 而非自己重写。
3. **低圈复杂度**：函数短小，嵌套不超过 3 层。
4. **不过度设计**：不为"以后可能用"而写代码。
5. **不写多余注释**：代码自解释时不需要注释，复杂逻辑才加。
6. **不改无 bug 的代码**：不顺手重构、不加 feature、不优化没问题的东西。

---

## 六、项目硬约束

以下规则来自 `project_memory.md`，不可违反：

| 约束 | 说明 |
|------|------|
| sql.js | 纯 JS SQLite，禁止 better-sqlite3 |
| Howler html5:true | 必须启用 HTML5 Audio 模式 |
| 动物音效仅点击 | 不可 hover 触发动物叫声 |
| 消除音效统一 | tile.vue 不处理音频，全由 game.ts 管理 |
| 消除+combo 音效用 toneGenerator | 不走 Howler 加载 |
| 覆盖判断含 inSlot | `getCoveringTiles` 必须 `!t.removed && !t.inSlot` |
| 半整数坐标 | 偶数层整数，奇数层 +0.5，覆盖 `|x1-x2|<1 && |y1-y2|<1` |
| 可见=可点击 | 灰色牌不可点，亮色牌必可点 |
| BGM 音量降低 | 默认 60（不是 80） |
| Compress-Archive 后验证 | 确认 app.asar 在 zip 中 |

---

## 七、用户偏好

- UI：竹绿色主题、干净美观
- 游戏节奏：轻快，不枯燥
- 视觉：动物模型高辨识度、现实细节
- 操作：自动化优先
- Electron 桌面应用优先

---

## 八、出错的教训

- `cloneState` 用 `JSON.parse(JSON.stringify(...))`，注意 slot.tile 引用需要重连
- Vue 响应式需要替换整个对象引用，修改属性可能不触发更新
- `result` 变量在 `try {}` 内声明会导致外部无法访问
- Compress-Archive 会静默跳过锁定的 app.asar
- symlink node_modules 导致 vite HTML 插件路径异常，用 `realpathSync` 解决
- `<transition mode="out-in">` 与 router 导航有竞态，导致白屏

---

## 九、每次改动后自检清单

- [ ] `npm run build:win` 通过
- [ ] 无调试 console.log 残留
- [ ] 无未使用的 import
- [ ] 相关文档已更新
- [ ] git 状态已确认
