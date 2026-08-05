# 成长系统实现计划（星级/道具/商店/收藏/挑战）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为「兽了个兽」新增星级判定、全员限时、4 种新道具、金币商店、56 件收藏品掉落与挑战模式，形成完整经济闭环。

**Architecture:** 纯逻辑层（`src/game/*`）先实现规则与引擎操作，再通过 IPC（`src/main/*`）持久化到 sql.js，最后由渲染层（`src/renderer/*`）的 Pinia store 与 Vue 视图接入。分 5 期推进，每期产出可运行成果。

**Tech Stack:** TypeScript / Vue 3 / Pinia / electron-vite / sql.js / Three.js

## Global Constraints

- 数据持久化必须用 sql.js（`src/main/db/`），禁止本地文件 JSON 替代。
- 所有新表用 `CREATE TABLE IF NOT EXISTS`，并需支持**已有数据库迁移**（`initDB` 中非 isNewDb 也要执行建表）。
- `GameProps` 扩展后，所有引用处（types/engine/game.ts/PropBar）必须同步。
- 新道具（chisel/clear/pair/slot）**不进入** history 撤回序列（与 shuffle 一致）。
- 纯逻辑层（`src/game/*`）禁止依赖 vue/electron。
- 每次改动后必须 `npm run typecheck` 通过，再 `npm run build:win` 打包。
- 星级规则：仅通关参与星级；未通关恒 0 星。
- 全员限时：L1=540s / L2=510s / L3=480s / L4=450s / L5(boss)=420s；超时且未通关 → lost。
- 收藏品 56 件（每动物一件，按章分组）；重复品自动转金币（普通80/稀有200/史诗400/传说800）。
- 挑战模式金币门票 100，通关返门票。
- 新通道需同时注册：`src/main/index.ts` 的 registerXxxIpc、`src/preload/index.ts` 的 gameAPI、`src/renderer/src/types/global.d.ts` 的类型声明。

---

## 文件结构总览

**新增：**
- `src/game/stars.ts` — 星级判定（纯逻辑）
- `src/game/props.config.ts` — 新道具定义与定价
- `src/game/challenge.ts` — 挑战模式随机配置
- `src/main/ipc/inventory.ts` — 金币/库存 IPC
- `src/main/ipc/collection.ts` — 收藏品 IPC
- `src/renderer/src/stores/inventory.ts` — 金币/库存 Store
- `src/renderer/src/stores/collection.ts` — 收藏品 Store
- `src/renderer/src/views/Shop.vue` — 商店
- `src/renderer/src/views/Collection.vue` — 收藏册
- `src/renderer/src/views/Challenge.vue` — 挑战结算

**修改：**
- `src/game/types.ts` — GameProps 扩展、GameMode 加 challenge、level 配置加 timeLimit 语义
- `src/game/engine.ts` — 新道具操作、超时判负
- `src/game/levels.config.ts` — 每关 timeLimit
- `src/game/scoring.ts` — 保留 calcPropReward（或复用）
- `src/main/db/schema.sql` — 新表
- `src/main/db/index.ts` — 建表 + 迁移
- `src/main/db/repository.ts` — inventory/collection 仓储函数
- `src/main/index.ts` — 注册新 IPC
- `src/preload/index.ts` — 暴露新 API
- `src/renderer/src/stores/game.ts` — 结算接入星级/收藏/限时
- `src/renderer/src/stores/user.ts` — 星级计算接入
- `src/renderer/src/components/game/PropBar.vue` — 新道具按钮
- `src/renderer/src/components/game/GameHUD.vue` — 倒计时显示
- `src/renderer/src/views/Game.vue` — 倒计时驱动、结算弹窗增强
- `src/renderer/src/views/Home.vue` — 商店/收藏/挑战入口
- `src/renderer/src/router/index.ts` — 新路由
- `src/renderer/src/types/global.d.ts` — 新 API 类型

---

## 第一期：数据库迁移 + 星级判定 + 全员限时

### Task 1: 数据库新增表与迁移

**Files:**
- Modify: `src/main/db/schema.sql`
- Modify: `src/main/db/index.ts`
- Modify: `src/main/db/repository.ts`
- Modify: `src/main/ipc/inventory.ts`（Create）
- Modify: `src/main/ipc/collection.ts`（Create）
- Modify: `src/main/index.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/src/types/global.d.ts`

- [ ] **Step 1: schema.sql 追加两张表**

```sql
-- 玩家库存（金币 + 新道具数量）
CREATE TABLE IF NOT EXISTS player_inventory (
  key   TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

-- 收藏品收集进度
CREATE TABLE IF NOT EXISTS collection (
  id       TEXT PRIMARY KEY,
  rarity   TEXT NOT NULL,
  count    INTEGER NOT NULL DEFAULT 0,
  obtained INTEGER NOT NULL DEFAULT 0
);
```

- [ ] **Step 2: db/index.ts 建表（含迁移）**

在 `initDB` 的 `dbWrapper.exec(...)` 块中追加两张新表（isNewDb 与已有库都执行）。把建表语句提取为常量 `CREATE_TABLES_SQL`，在 isNewDb 时执行一次，非 isNewDb 时也执行 `CREATE TABLE IF NOT EXISTS` 确保旧库补齐新表。

- [ ] **Step 3: repository.ts 增加 inventory/collection 仓储**

```ts
// 库存
export function getInventory(key: string): number
export function addInventory(key: string, delta: number): number
export function getAllInventory(): Record<string, number>
// 收藏品
export function recordCollection(id: string, rarity: string): 'new' | 'duplicate'
export function getAllCollection(): any[]
export function getCollectionCount(): number  // 已收集(obtained=1)数量
```

- [ ] **Step 4: 新建 inventory.ts / collection.ts IPC**

`inventory:getAll` / `inventory:add` / `collection:getAll` / `collection:record` / `collection:count`。在 `main/index.ts` 注册，`preload/index.ts` 暴露到 `gameAPI.inventory` 与 `gameAPI.collection`，`global.d.ts` 补类型。

- [ ] **Step 5: 验证**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/main src/preload src/renderer/src/types
git commit -m "feat: 新增库存与收藏品数据表及 IPC"
```

### Task 2: 星级判定（纯逻辑）

**Files:**
- Create: `src/game/stars.ts`
- Modify: `src/game/types.ts`（可选，加 StarResult 类型）

- [ ] **Step 1: 编写 stars.ts**

```ts
export interface StarInput {
  score: number            // 本局分数
  timeLeft: number         // 剩余时间（秒），无 timeLimit 时为该关基准
  propsUsed: number        // 使用道具总次数
  clickLeft: number        // 剩余点击数，-1 视为无机制满值
  timeLimit: number        // 关卡限时（秒）
  tileCount: number        // 总牌数
  maxSlots: number
}
export function calcStars(input: StarInput): number
```

归一化规则：
- `fScore = min(1, score / (tileCount * 12))`
- `fTime = min(1, timeLeft / timeLimit)`
- `fProps = max(0, 1 - propsUsed / 3)`
- `fClick = clickLeft < 0 ? 1 : min(1, clickLeft / 20)`
- `starScore = 0.4*fScore + 0.2*fTime + 0.25*fProps + 0.15*fClick`
- 映射：`>=0.85 → 3`，`>=0.6 → 2`，`>=0.3 → 1`，否则 0。

- [ ] **Step 2: 补充 cmd 验证脚本（放 scripts/ 临时，验证后删除）**

用 10 组用例断言（用例见"验证预期"），`node -r esbuild-register` 或直接用 `npx tsx` 运行。若环境无 tsx 则用 `npx tsc` 编译后 node 运行。

- [ ] **Step 3: Commit**

```bash
git add src/game/stars.ts
git commit -m "feat: 新增多维星级判定"
```

### Task 3: 全员限时 + 引擎超时判负

**Files:**
- Modify: `src/game/levels.config.ts`
- Modify: `src/game/engine.ts`
- Modify: `src/game/types.ts`

- [ ] **Step 1: levels.config.ts 每关配置 timeLimit**

在 `buildLevelsFromSeed` 中，依据关卡序号 `i`（0=L1…4=L5）设置 `timeLimit`：`[540, 510, 480, 450, 420][i]`（L1≈9分钟，Boss≈7分钟，依序递减）。对所有章统一。移除仅 boss 的 `BOSS_TIME_LIMIT` 特殊逻辑（保留常量名或删除）。

- [ ] **Step 2: types.ts 补充超时字段**

`GameState` 增加 `timeLeft?: number`（当前剩余秒数，由外层驱动递减）。

- [ ] **Step 3: engine.ts 超时判负**

新增 `static timeout(state): GameState`：若 `config.timeLimit` 存在且未通关，置 `status='lost'`、`endTime=now`。返回克隆 state。

- [ ] **Step 4: 验证**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/levels.config.ts src/game/engine.ts src/game/types.ts
git commit -m "feat: 闯关全员限时并支持超时判负"
```

### Task 4: 渲染层倒计时 + HUD 显示

**Files:**
- Modify: `src/renderer/src/stores/game.ts`
- Modify: `src/renderer/src/components/game/GameHUD.vue`
- Modify: `src/renderer/src/views/Game.vue`

- [ ] **Step 1: game.ts 增加倒计时驱动**

`startGame` 后若 `config.timeLimit` 存在，设定时器每秒递减 `engineState.timeLeft`；归零调用 `GameEngine.timeout` 并 `applyState` + `endGame()`。`exitToHome`/`restart` 清理定时器。

- [ ] **Step 2: GameHUD 增加倒计时显示**

新增 prop `timeLeft?: number`、`timeLimit?: number`。剩余 ≤30s 变红闪烁（复用 clicks-pulse 动画模式）。

- [ ] **Step 3: Game.vue 传参**

向 `<GameHUD>` 传 `:time-left="engineState.timeLeft"` `:time-limit="engineState.config?.timeLimit"`。

- [ ] **Step 4: 验证**

Run: `npm run typecheck` → `npm run build:win`
Expected: PASS，运行 exe 看到倒计时，超时弹出"游戏失败"

- [ ] **Step 5: Commit**

```bash
git add src/renderer
git commit -m "feat: 渲染层倒计时与超时结算"
```

---

## 第二期：新道具系统（4 种）

### Task 5: 类型与引擎新道具操作

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/engine.ts`
- Create: `src/game/props.config.ts`

- [ ] **Step 1: types.ts 扩展 GameProps**

```ts
export interface GameProps {
  undo: number; shuffle: number; hint: number;
  chisel: number; clearProp: number; pair: number; slot: number;
}
```

`GameMode` 增加 `'challenge'`。

- [ ] **Step 2: props.config.ts**

```ts
export const NEW_PROP_PRICES = { chisel: 120, clearProp: 100, pair: 180, slot: 150 } as const
export const NEW_PROP_NAMES: Record<PropType, string> = {
  undo: '撤回', shuffle: '洗牌', hint: '提示',
  chisel: '拆牌锤', clearProp: '槽位清空', pair: '一键配对', slot: '临时扩容'
}
```

- [ ] **Step 3: engine.ts 新增 4 个操作**

- `useChisel(state, tileId)`：校验库存>0，标记该 tile `removed`（`inSlot=false`），减库存，不记 history。
- `useClearProp(state)`：校验>0，槽位所有牌 `inSlot=false`、清除 slot.tile，减库存。
- `usePair(state)`：校验>0，用 `findHint` 或自写找一对可点击同动物牌直接消除，减库存。
- `useSlot(state)`：校验>0，`maxSlots+1`、`slots.push({index, tile:null})`，减库存。

`DEFAULT_PROPS` 全部初始为 0；`GameState.props` 克隆需含新字段。

- [ ] **Step 4: 验证**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game
git commit -m "feat: 引擎新增4种新道具操作"
```

### Task 6: 视图层道具栏 + 选择态

**Files:**
- Modify: `src/renderer/src/stores/game.ts`
- Modify: `src/renderer/src/components/game/PropBar.vue`
- Modify: `src/renderer/src/views/Game.vue`

- [ ] **Step 1: game.ts 增加 useProp 转发**

`useChisel/useClear/usePair/useSlot` 调用引擎对应方法并 `applyState`。维护 `pendingProp`（当前待选目标道具，如 chisel/pair 需选牌）。

- [ ] **Step 2: PropBar 增加 4 个按钮**

显示新道具库存与徽章；点击触发 `emit('chisel')` 等。数量 0 禁用。

- [ ] **Step 3: Game.vue 选择态**

`pendingProp==='chisel'` 时点击牌调 `useChisel(tileId)`；pair 自动执行。清空/扩容即时执行。

- [ ] **Step 4: 验证**

Run: `npm run typecheck` → `npm run build:win`
Expected: PASS，新道具按钮可用（库存需先充值）

- [ ] **Step 5: Commit**

```bash
git add src/renderer
git commit -m "feat: 新道具视图与选择态"
```

---

## 第三期：商店系统

### Task 7: 库存 Store + 商店视图

**Files:**
- Create: `src/renderer/src/stores/inventory.ts`
- Create: `src/renderer/src/views/Shop.vue`
- Modify: `src/renderer/src/router/index.ts`
- Modify: `src/renderer/src/views/Home.vue`

- [ ] **Step 1: inventory Store**

持有 `coin`、`props` 各数量；`load()`（getAllInventory）、`buy(prop)`（校验金币、扣金币加道具）、`spendCoin(n)`。

- [ ] **Step 2: Shop.vue**

展示金币余额 + 4 种新道具商品卡（图标/名称/价格/购买按钮）。金币不足置灰。

- [ ] **Step 3: 路由 + Home 入口**

路由加 `/shop`；Home 底部加「🛒 商店」按钮。

- [ ] **Step 4: 验证**

Run: `npm run typecheck` → `npm run build:win`
Expected: PASS，可进入商店购买道具

- [ ] **Step 5: Commit**

```bash
git add src/renderer
git commit -m "feat: 金币商店系统"
```

---

## 第四期：收藏品掉落 + 收藏册

### Task 8: 掉落逻辑 + 结算接入

**Files:**
- Create: `src/game/challenge.ts`（含掉落函数，或独立 `src/game/collection.ts`）
- Modify: `src/renderer/src/stores/game.ts`

- [ ] **Step 1: 掉落函数**

```ts
export function rollCollection(chapterAnimals: AnimalType[], stars: number): { id: string; rarity: string }
```
按星级概率抽稀有度，从 chapterAnimals 中随机选一只动物作为 id。概率表（普通/稀有/史诗/传说）：1星 90/9/1/0，2星 60/30/9/1，3星 30/40/25/5。

- [ ] **Step 2: 结算接入**

`endGame` 中若 `result==='win'` 且 mode 为 level/challenge：算星级 → 调 `rollCollection` → `recordCollection`；返回 `new/duplicate`。duplicate 时 `addInventory('coin', 稀有度金币)`。结算弹窗展示获得的收藏品与星级。

- [ ] **Step 3: 验证**

Run: `npm run typecheck` → `npm run build:win`
Expected: PASS，通关后掉落收藏品并转金币

- [ ] **Step 4: Commit**

```bash
git add src/game src/renderer/src/stores
git commit -m "feat: 收藏品掉落与星际结算"
```

### Task 9: 收藏册视图

**Files:**
- Create: `src/renderer/src/stores/collection.ts`
- Create: `src/renderer/src/views/Collection.vue`
- Modify: `src/renderer/src/router/index.ts`
- Modify: `src/renderer/src/views/Home.vue`

- [ ] **Step 1: collection Store**

`items`（getAllCollection）、`count`（getCollectionCount）、`load()`。

- [ ] **Step 2: Collection.vue**

按章分组展示 56 件；已收集（obtained=1）显示动物形象（复用 PixelAnimal），未收集显示剪影；顶部展示集齐进度 `count/56`；稀有度角标配色。

- [ ] **Step 3: 路由 + Home 入口**

路由加 `/collection`；Home 加「🎨 收藏册」按钮。

- [ ] **Step 4: 验证**

Run: `npm run typecheck` → `npm run build:win`
Expected: PASS，收藏册展示与进度统计

- [ ] **Step 5: Commit**

```bash
git add src/renderer
git commit -m "feat: 收藏册视图"
```

---

## 第五期：挑战模式

### Task 10: 挑战配置生成 + 引擎入队

**Files:**
- Create: `src/game/challenge.ts`
- Modify: `src/game/engine.ts`
- Modify: `src/game/types.ts`

- [ ] **Step 1: challenge.ts 生成随机 LevelConfig**

`generateChallengeConfig(): LevelConfig`：随机选一章动物（子集 6-8 种）、随机 1-2 种机制（前 5 章）、`timeLimit` 取 240s（比闯关短）、`mode='challenge'`、`id=0`、`isBoss=false`。

- [ ] **Step 2: 引擎支持 challenge

`makeDefaultConfig`/`init` 增加 challenge 分支，用 `generateChallengeConfig()`。

- [ ] **Step 3: 验证**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/game
git commit -m "feat: 挑战模式随机配置"
```

### Task 11: 挑战入口 + 门票 + 结算

**Files:**
- Modify: `src/renderer/src/views/Home.vue`
- Modify: `src/renderer/src/router/index.ts`
- Create: `src/renderer/src/views/Challenge.vue`
- Modify: `src/renderer/src/stores/game.ts`

- [ ] **Step 1: Home 按钮 + 路由**

路由加 `/challenge`；Home 加「⚡ 挑战」按钮。

- [ ] **Step 2: Challenge.vue**

进入扣 100 金币（库存不足提示）；调 `startGame('challenge')`。结算复用 Game 弹窗逻辑，通关返 100 金币 + 掉落收藏品 + 额外道具；失败不返。

- [ ] **Step 3: 验证**

Run: `npm run typecheck` → `npm run build:win`
Expected: PASS，挑战模式可玩、门票与奖励正确

- [ ] **Step 4: Commit**

```bash
git add src/renderer src/game
git commit -m "feat: 挑战模式入口与门票结算"
```

---

## 验证预期（10 条用例）

**星级判定（calcStars）：**
1. 高分+满时间+无用道具+满点击 → 3星
2. 低分+满时间+无用道具 → 1星
3. 高分但用满3道具 → 降为2星
4. 高分+时间耗尽(timeLeft=0) → ≤2星
5. 藤蔓关 clickLeft=0 → 最高2星
6. 无 timeLimit 关（challenge 也算有）→ 按基准归一化
7. 分数=0 → 0星（未通关由调用方保证）
8. 满分+满时间+0道具+满点击 → 恰 3星
9. timeLeft 极少 → 强降星
10. 边界 0.85/0.6/0.3 阈值精确映射

**限时判负：**
- 倒计时归零且未通关 → status='lost'、弹结算窗
- 倒计时归零但已通关（won）→ 保持 won

**新道具：**
- chisel 移除指定牌（含藤蔓牌）且不记 history
- clear 槽位清空回牌堆
- pair 消除一对同动物
- slot 槽位 +1

**收藏掉落：**
- 1星几乎必掉普通，3星有机会掉传说
- duplicate 自动加金币（普通+80）

**挑战：**
- 门票不足无法进入
- 通关返 100 金币 + 掉落收藏品

---

## 自检结论

- **Spec 覆盖**：星级/道具/商店/收藏/挑战/全员限时均有对应 Task。
- **占位符扫描**：无 TBD/TODO，代码块完整。
- **类型一致性**：`GameProps` 新字段在 Task 5 定义，Task 6-8 复用；`clearProp` 命名全程一致（避免与 `clear` 关键字冲突）。