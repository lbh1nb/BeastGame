<template>
  <div class="game">
    <template v-if="engineState && resourcesReady">
      <!-- 顶栏 HUD -->
      <GameHUD
        :score="engineState.score"
        :combo="engineState.combo"
        :elapsed="elapsed"
        :mode="engineState.mode"
        :click-remaining="engineState.clickRemaining"
        :time-left="engineState.timeLeft"
        :time-limit="engineState.config?.timeLimit"
        @back="onBack"
        @restart="onRestart"
        @pause="togglePause"
      />

      <!-- 游戏标题 -->
      <GameTitle :mode="engineState.mode" :level-id="levelId" />

      <!-- 牌堆区 -->
      <div class="game-main">
        <!-- 拆牌锤选择态提示条 -->
        <div
          v-if="gameStore.pendingProp === 'chisel'"
          class="chisel-tip"
          @click="gameStore.cancelPendingProp()"
        >
          🎯 请选择要拆除的牌（点击此处取消）
        </div>
        <TileStack
          :tiles="engineState.tiles"
          :hint-tile-ids="engineState.hintTileIds"
          :picked-flash-ids="gameStore.pickedFlashIds"
          @pick="onPick"
        />
      </div>

      <!-- 槽位区 -->
      <TileSlot
        :slots="engineState.slots"
        :max-slots="engineState.maxSlots"
        :last-matched-ids="engineState.lastMatchedTileIds"
      />

      <!-- 道具栏（右下角浮动） -->
      <div class="prop-float">
        <PropBar
          :props="engineState.props"
          :disabled="paused || !gameStore.isPlaying"
          @undo="gameStore.useUndo()"
          @shuffle="gameStore.useShuffle()"
          @hint="gameStore.useHint()"
          @chisel="gameStore.useChisel()"
          @clear="gameStore.useClearProp()"
          @pair="gameStore.usePair()"
          @slot="gameStore.useSlot()"
        />
      </div>

      <!-- 连击夸赞弹幕 -->
      <ComboPraise
        :visible="gameStore.comboPraise.visible"
        :tier="gameStore.comboPraise.tier"
        :combo="gameStore.comboPraise.combo"
        @hide="gameStore.hideComboPraise"
      />

      <!-- 暂停遮罩 -->
      <div v-if="paused" class="pause-mask" @click.self="togglePause">
        <div class="pause-box">
          <div class="pause-title">已暂停</div>
          <div class="pause-actions">
            <BaseButton type="primary" @click="togglePause">继续</BaseButton>
            <BaseButton type="ghost" @click="onRestart">重开</BaseButton>
            <BaseButton type="ghost" @click="onBack">返回菜单</BaseButton>
          </div>
        </div>
      </div>

      <!-- 局终弹窗 -->
      <Dialog
        v-model:visible="resultVisible"
        :title="gameStore.isWon ? '🎉 恭喜通关！' : '😢 游戏失败'"
        confirm-text="再来一局"
        cancel-text="返回菜单"
        @confirm="onRestart"
        @cancel="onBack"
      >
        <!-- 闯关模式：关卡信息 -->
        <div v-if="levelInfo" class="level-info">{{ levelInfo }}</div>

        <!-- 星级展示（通关才有） -->
        <div v-if="gameStore.isWon" class="stars">
          <span
            v-for="i in 3"
            :key="i"
            class="star"
            :class="{ 'star--on': i <= gameStore.lastStars }"
          >★</span>
        </div>

        <div class="result-detail">
          <div class="result-row"><span>最终分数</span><b>{{ gameStore.finalScore }}</b></div>
          <div class="result-row"><span>最高连击</span><b>x{{ engineState.maxCombo }}</b></div>
          <div class="result-row"><span>用时</span><b>{{ formatTime(elapsed) }}</b></div>
          <div class="result-row"><span>消除图案</span><b>{{ engineState.tilesRemoved }}</b></div>
        </div>

        <!-- 通关：收藏品掉落 + 金币奖励 -->
        <div v-if="gameStore.isWon" class="reward">
          <!-- 收藏品掉落（带掉落动画） -->
          <div v-if="gameStore.lastCollection" class="collection-drop">
            <div class="collection-drop-title">🎁 获得收藏品</div>
            <div
              class="collection-card"
              :class="['drop-anim drop-anim--' + gameStore.lastCollection.rarity]"
            >
              <img
                class="collection-item"
                :src="itemImg(gameStore.lastCollection.id)"
                :alt="itemName(gameStore.lastCollection.id)"
              />
              <div class="collection-item-name">{{ itemName(gameStore.lastCollection.id) }}</div>
              <span class="collection-rarity" :class="'rarity-' + gameStore.lastCollection.rarity">
                {{ RARITY_NAME[gameStore.lastCollection.rarity] }}
              </span>
              <span v-if="gameStore.lastCollection.isNew" class="collection-tag new">✨ 新收藏！</span>
              <span v-else class="collection-tag dup">
                重复收藏，+{{ RARITY_GOLD[gameStore.lastCollection.rarity] }}金币
              </span>
            </div>
          </div>
          <!-- 金币奖励明细 -->
          <div v-if="gameStore.lastCoinEarned > 0" class="coin-reward">
            🪙 本局获得金币 <b>+{{ gameStore.lastCoinEarned }}</b>
          </div>
        </div>
        <!-- 闯关模式：上下关导航 -->
        <div v-if="props.mode === 'level'" class="level-nav">
          <button
            class="level-nav-btn"
            :disabled="!canGoPrevLevel"
            @click="goToPrevLevel"
          >
            ← 上一关
          </button>
          <button
            class="level-nav-btn"
            :disabled="!canGoNextLevel"
            @click="goToNextLevel"
          >
            下一关 →
          </button>
        </div>
      </Dialog>
    </template>

    <!-- 引擎未就绪 -->
    <div v-else class="game-loading">
      <p>游戏加载中…</p>
      <BaseButton type="ghost" @click="onBack">返回菜单</BaseButton>
    </div>
  </div>

  <!-- 机制提示弹窗 -->
  <MechanicIntro
    v-if="mechanicIntro"
    :animal="mechanicIntro.animal"
    :title="mechanicIntro.title"
    :body="mechanicIntro.body"
    @dismiss="mechanicIntro = null"
  />
</template>

<script setup lang="ts">
/**
 * 游戏页
 * - 进入页面调用 gameStore.startGame(mode, levelId?) 初始化
 * - watch mode / levelId 变化时重新初始化
 * - 顶部 HUD + 中间牌堆 + 底部槽位 + 右下角道具栏
 * - 暂停遮罩 + 局终弹窗
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@stores/game'
import { useUserStore } from '@stores/user'
import { getLevelById, CHAPTERS, getChapterMechanic } from '@game/levels.config'
import { RARITY_NAME, RARITY_GOLD } from '@game/collection'
import { collectionItemOf } from '@game/collection-item'
import { assetUrl } from '@utils/asset-url'
import type { GameMode, AnimalType } from '@game/types'
import GameHUD from '@components/game/GameHUD.vue'
import GameTitle from '@components/game/GameTitle.vue'
import TileStack from '@components/game/TileStack.vue'
import TileSlot from '@components/game/TileSlot.vue'
import PropBar from '@components/game/PropBar.vue'
import ComboPraise from '@components/game/ComboPraise.vue'
import BaseButton from '@components/common/BaseButton.vue'
import Dialog from '@components/common/Dialog.vue'
import MechanicIntro from '@components/game/MechanicIntro.vue'
import audioManager from '@audio/manager'

const props = defineProps<{ mode: string }>()

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const userStore = useUserStore()

const engineState = computed(() => gameStore.engineState)
const resourcesReady = computed(() => gameStore.resourcesReady)

/** 路由 query 中的 levelId（闯关模式） */
const levelId = computed<number | undefined>(() => {
  const q = route.query.levelId
  return q != null ? Number(q) : undefined
})

/** 闯关模式上一关是否可用（第 1 关不可用） */
const canGoPrevLevel = computed(() => {
  if (props.mode !== 'level') return false
  const lid = levelId.value
  return lid != null && lid > 1
})

/** 闯关模式下一关是否可用（存在且已解锁） */
const canGoNextLevel = computed(() => {
  if (props.mode !== 'level') return false
  const lid = levelId.value
  if (lid == null || lid >= 30) return false
  return userStore.isLevelUnlocked(lid + 1)
})

/** 闯关模式关卡描述文本 */
const levelInfo = computed<string | null>(() => {
  if (props.mode !== 'level') return null
  const lid = levelId.value
  if (lid == null) return null
  const cfg = getLevelById(lid)
  if (!cfg) return `第 ${lid} 关`
  const chapter = CHAPTERS.find((c) => c.id === cfg.chapter)
  const bossTag = cfg.isBoss ? ' BOSS' : ''
  return `第 ${lid} 关${bossTag} · 第 ${cfg.chapter} 章 ${chapter?.name ?? ''}`
})

/** 切换到指定关卡 */
function navigateToLevel(targetLevelId: number): void {
  resultVisible.value = false
  router.push({ path: '/game/level', query: { levelId: targetLevelId } })
}

function goToPrevLevel(): void {
  const lid = levelId.value
  if (lid != null && lid > 1) navigateToLevel(lid - 1)
}

function goToNextLevel(): void {
  const lid = levelId.value
  if (lid != null && lid < 30 && userStore.isLevelUnlocked(lid + 1)) {
    navigateToLevel(lid + 1)
  }
}

/** 计时器 */
const now = ref(Date.now())
let timer: number | undefined

/** 暂停相关 */
const paused = ref(false)
const pauseOffset = ref(0)
let pausedAt: number | null = null

/** 已用秒数（暂停时冻结，局终时定格） */
const elapsed = computed(() => {
  const s = engineState.value
  if (!s) return 0
  const end = s.endTime ?? now.value
  return Math.max(0, Math.floor((end - s.startTime - pauseOffset.value) / 1000))
})

/** 局终弹窗显隐 */
const resultVisible = ref(false)

/** 机制提示弹窗数据 */
const mechanicIntro = ref<{ animal: AnimalType; title: string; body: string } | null>(null)

/** 检查是否需要显示机制提示（每次进入有机制的关卡都弹） */
function checkMechanicIntro(): void {
  if (props.mode !== 'level') return
  const lid = levelId.value
  if (lid == null) return
  const cfg = getLevelById(lid)
  if (!cfg?.mechanic) return
  const mec = getChapterMechanic(cfg.chapter)
  if (!mec) return
  mechanicIntro.value = { animal: mec.introAnimal, title: mec.introTitle, body: mec.introBody }
}

/** 初始化本局 */
async function initGame(): Promise<void> {
  paused.value = false
  pauseOffset.value = 0
  pausedAt = null
  resultVisible.value = false
  mechanicIntro.value = null
  await gameStore.startGame(props.mode as GameMode, levelId.value)
  checkMechanicIntro()
}

/** 监听模式 / 关卡变化，重新初始化 */
watch(
  [() => props.mode, levelId],
  () => {
    initGame()
  },
  { immediate: true }
)

/** 监听局终状态，弹出结算 */
watch(
  () => engineState.value?.status,
  (status) => {
    if (status === 'won' || status === 'lost') {
      resultVisible.value = true
    }
  }
)

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
  // 进入游戏播放轻快 BGM（与加载界面一致）
  audioManager.playBgm('home').catch(() => {
    // 音频加载失败不影响游戏运行
  })
})

onUnmounted(() => {
  try {
    if (timer) { clearInterval(timer); timer = undefined }
  } catch (e) { console.error('[Game] 清理 timer 失败', e) }
  try {
    gameStore.exitToHome()
  } catch (e) { console.error('[Game] exitToHome 失败', e) }
  try {
    audioManager.stopBgm()
  } catch (e) { console.error('[Game] stopBgm 失败', e) }
})

function onPick(tileId: number): void {
  if (paused.value) return
  // 拆牌锤选择态：点击牌即执行拆牌
  if (gameStore.pendingProp === 'chisel') {
    gameStore.useChisel(tileId)
    return
  }
  gameStore.pickTile(tileId)
}

function onBack(): void {
  router.push('/')
}

async function onRestart(): Promise<void> {
  paused.value = false
  pauseOffset.value = 0
  pausedAt = null
  resultVisible.value = false
  await gameStore.restart()
}

function togglePause(): void {
  if (gameStore.isWon || gameStore.isLost) return
  if (paused.value) {
    if (pausedAt != null) pauseOffset.value += Date.now() - pausedAt
    pausedAt = null
    paused.value = false
  } else {
    pausedAt = Date.now()
    paused.value = true
  }
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/** 收藏品物品图片 URL（缺映射时回退为 id 兜底） */
function itemImg(id: string): string {
  const def = collectionItemOf(id as AnimalType)
  return assetUrl(`collection/${def.img}`)
}

/** 收藏品物品中文名（缺映射时回退为 id） */
function itemName(id: string): string {
  return collectionItemOf(id as AnimalType).name
}
</script>

<style scoped>
.game {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  padding: 10px;
  gap: 10px;
}

.game-main {
  position: relative;
  flex: 1;
  min-height: 0;
  background: #fffaf0;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

/* 拆牌锤选择态提示条 */
.chisel-tip {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  padding: 6px 16px;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  box-shadow: var(--shadow-card);
  cursor: pointer;
}

.prop-float {
  position: absolute;
  right: 14px;
  bottom: 110px;
  z-index: 10;
}

/* 暂停遮罩 */
.pause-mask {
  position: absolute;
  inset: 0;
  background: rgba(74, 60, 46, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(2px);
}

.pause-box {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 30px 40px;
  text-align: center;
  border: 4px solid var(--color-primary);
}

.pause-title {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 20px;
  color: var(--color-text);
}

.pause-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 180px;
}

/* 星级展示 */
.stars {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 6px 0 4px;
}

.star {
  font-size: 34px;
  color: #e3d6c0;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.08);
  transition: color 0.3s ease, transform 0.3s ease;
}

.star--on {
  color: #ffb300;
  filter: drop-shadow(0 2px 4px rgba(255, 179, 0, 0.5));
  animation: star-pop 0.5s ease both;
}

@keyframes star-pop {
  0% { transform: scale(0) rotate(-20deg); }
  60% { transform: scale(1.3) rotate(5deg); }
  100% { transform: scale(1) rotate(0); }
}

/* 结算明细 */
.result-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0;
}

/* 关卡信息 */
.level-info {
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 4px;
}

/* 通关奖励区 */
.reward {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 收藏品掉落 */
.collection-drop {
  margin: 2px 0;
  text-align: center;
}

.collection-drop-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}

.collection-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #fff8e6, #fff0d0);
  border: 2px solid #f0d59a;
  border-radius: var(--radius-lg);
  padding: 16px 20px 12px;
  box-shadow: var(--shadow-card);
}

.collection-item {
  width: 76px;
  height: 76px;
  object-fit: contain;
}

.collection-item-name {
  font-size: 16px;
  font-weight: 800;
  color: var(--color-primary-dark);
}

/* 掉落动画：下落 + 弹跳 + 稀有度光晕 */
.drop-anim {
  animation: drop-in 0.7s cubic-bezier(0.22, 1.2, 0.36, 1) both;
}

.drop-anim::before {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 22px;
  pointer-events: none;
  animation: rarity-glow 1.6s ease-in-out infinite;
}

.drop-anim--common::before { box-shadow: 0 0 18px rgba(158, 158, 158, 0.55); }
.drop-anim--rare::before { box-shadow: 0 0 22px rgba(66, 165, 245, 0.7); }
.drop-anim--epic::before { box-shadow: 0 0 26px rgba(171, 71, 188, 0.75); }
.drop-anim--legendary::before { box-shadow: 0 0 30px rgba(255, 130, 0, 0.85); }

@keyframes drop-in {
  0% { transform: translateY(-46px) scale(0.4); opacity: 0; }
  55% { transform: translateY(6px) scale(1.08); opacity: 1; }
  72% { transform: translateY(-4px) scale(0.98); }
  88% { transform: translateY(2px) scale(1.02); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes rarity-glow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.collection-rarity {
  font-size: 13px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  color: #fff;
}

.rarity-common { background: #9e9e9e; }
.rarity-rare { background: #42a5f5; }
.rarity-epic { background: #ab47bc; }
.rarity-legendary { background: linear-gradient(135deg, #ffb300, #ff6d00); }

.collection-tag {
  font-size: 12px;
  font-weight: 700;
}

.collection-tag.new { color: #2e7d32; }
.collection-tag.dup { color: #b26a00; }

/* 金币奖励汇总 */
.coin-reward {
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: #7a4a00;
  background: linear-gradient(135deg, #ffd76e, #ffb84d);
  border-radius: var(--radius-pill);
  padding: 8px 16px;
  box-shadow: 0 3px 0 #e09a2e;
}

.coin-reward b {
  font-size: 16px;
}

.result-row {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  font-size: 14px;
  color: var(--color-text);
}

.result-row b {
  color: var(--color-primary-dark);
}

/* 闯关导航按钮 */
.level-nav {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 12px;
}

.level-nav-btn {
  padding: 8px 20px;
  border-radius: var(--radius-md);
  border: 2px solid var(--color-primary);
  background: var(--color-bg-card);
  color: var(--color-primary-dark);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.level-nav-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: #fff;
}

.level-nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  border-color: var(--color-border);
  color: var(--color-text-light);
}

/* 加载态 */
.game-loading {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  color: var(--color-text-light);
}
</style>
