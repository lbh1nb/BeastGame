<template>
  <div class="game">
    <template v-if="engineState">
      <!-- 顶栏 HUD -->
      <GameHUD
        :score="engineState.score"
        :combo="engineState.combo"
        :elapsed="elapsed"
        :mode="engineState.mode"
        @back="onBack"
        @restart="onRestart"
        @pause="togglePause"
      />

      <!-- 牌堆区 -->
      <div class="game-main">
        <TileStack
          :tiles="engineState.tiles"
          :hint-tile-ids="engineState.hintTileIds"
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
        <div class="result-detail">
          <div class="result-row"><span>最终分数</span><b>{{ gameStore.finalScore }}</b></div>
          <div class="result-row"><span>最高连击</span><b>x{{ engineState.maxCombo }}</b></div>
          <div class="result-row"><span>用时</span><b>{{ formatTime(elapsed) }}</b></div>
          <div class="result-row"><span>消除图案</span><b>{{ engineState.tilesRemoved }}</b></div>
        </div>
      </Dialog>
    </template>

    <!-- 引擎未就绪 -->
    <div v-else class="game-loading">
      <p>游戏加载中…</p>
      <BaseButton type="ghost" @click="onBack">返回菜单</BaseButton>
    </div>
  </div>
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
import type { GameMode } from '@game/types'
import GameHUD from '@components/game/GameHUD.vue'
import TileStack from '@components/game/TileStack.vue'
import TileSlot from '@components/game/TileSlot.vue'
import PropBar from '@components/game/PropBar.vue'
import ComboPraise from '@components/game/ComboPraise.vue'
import BaseButton from '@components/common/BaseButton.vue'
import Dialog from '@components/common/Dialog.vue'
import audioManager from '@audio/manager'

const props = defineProps<{ mode: string }>()

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const engineState = computed(() => gameStore.engineState)

/** 路由 query 中的 levelId（闯关模式） */
const levelId = computed<number | undefined>(() => {
  const q = route.query.levelId
  return q != null ? Number(q) : undefined
})

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

/** 初始化本局 */
async function initGame(): Promise<void> {
  paused.value = false
  pauseOffset.value = 0
  pausedAt = null
  resultVisible.value = false
  await gameStore.startGame(props.mode as GameMode, levelId.value)
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
  // 进入游戏播放游戏 BGM
  audioManager.playBgm('game').catch(() => {
    // 音频加载失败不影响游戏运行
  })
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  gameStore.exitToHome()
  audioManager.stopBgm()
})

function onPick(tileId: number): void {
  if (paused.value) return
  gameStore.pickTile(tileId)
}

function onBack(): void {
  gameStore.exitToHome()
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
  flex: 1;
  min-height: 0;
  background: #fffaf0;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
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

/* 结算明细 */
.result-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0;
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
