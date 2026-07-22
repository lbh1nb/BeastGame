<template>
  <div class="records">
    <!-- 顶栏 -->
    <div class="topbar">
      <button class="back-btn" @click="back">←</button>
      <span class="page-title">游戏记录</span>
    </div>

    <!-- Tab 切换 -->
    <div class="tabs">
      <button
        class="tab"
        :class="{ 'tab--active': tab === 'rank' }"
        @click="switchTab('rank')"
      >
        🏆 排行榜
      </button>
      <button
        class="tab"
        :class="{ 'tab--active': tab === 'achv' }"
        @click="switchTab('achv')"
      >
        🎖️ 成就
      </button>
    </div>

    <!-- 排行榜 -->
    <div v-if="tab === 'rank'" class="tab-content">
      <div v-if="ranking.length === 0" class="empty">暂无记录，快去玩一局吧～</div>
      <div v-else class="rank-list">
        <div v-for="(r, i) in ranking" :key="r.id" class="rank-item">
          <span class="rank-no" :class="{ 'rank-no--top': i < 3 }">{{ i + 1 }}</span>
          <span class="rank-badge" :class="`badge--${r.mode}`">{{ modeLabel(r.mode) }}</span>
          <span class="rank-score">{{ r.score }}</span>
          <span class="rank-meta">⏱ {{ formatDuration(r.duration) }}</span>
          <span class="rank-meta">🔥 x{{ r.max_combo }}</span>
          <span class="rank-date">{{ formatDate(r.created_at) }}</span>
        </div>
      </div>
    </div>

    <!-- 成就 -->
    <div v-else class="tab-content">
      <div v-if="achievements.length === 0" class="empty">暂无成就数据</div>
      <div v-else class="achv-grid">
        <div
          v-for="a in achievements"
          :key="a.id"
          class="achv-card"
          :class="{ 'achv-card--locked': !a.unlocked }"
        >
          <div class="achv-icon">{{ a.unlocked ? achvIcon(a.id) : '🔒' }}</div>
          <div class="achv-name">{{ achvName(a.id) }}</div>
          <div class="achv-status">
            {{ a.unlocked ? '已解锁' : `进度 ${a.progress ?? 0}` }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 记录页
 * - Tab：排行榜 / 成就
 * - 排行榜：top 20 单局记录
 * - 成就：网格展示
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@stores/user'

const router = useRouter()
const userStore = useUserStore()

const tab = ref<'rank' | 'achv'>('rank')
const ranking = ref<any[]>([])
const achievements = ref<any[]>([])

onMounted(async () => {
  await Promise.all([loadRanking(), loadAchv()])
})

async function loadRanking(): Promise<void> {
  try {
    ranking.value = await window.gameAPI.score.getRanking(20)
  } catch (e) {
    console.warn('[records] 加载排行榜失败', e)
    ranking.value = []
  }
}

async function loadAchv(): Promise<void> {
  try {
    achievements.value = await window.gameAPI.achievement.getAll()
  } catch (e) {
    console.warn('[records] 加载成就失败', e)
    achievements.value = []
  }
}

function switchTab(t: 'rank' | 'achv'): void {
  tab.value = t
}

function modeLabel(mode: string): string {
  switch (mode) {
    case 'classic3':
      return '3消'
    case 'classic4':
      return '4消'
    case 'level':
      return '闯关'
    default:
      return mode
  }
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function formatDate(ts: number): string {
  const d = new Date(ts * 1000)
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  const dd = d.getDate().toString().padStart(2, '0')
  return `${mm}-${dd}`
}

/** 成就名称映射 */
function achvName(id: string): string {
  const map: Record<string, string> = {
    first_clear: '初次通关',
    chapter1_clear: '家畜达人',
    chapter2_clear: '宠物达人',
    chapter3_clear: '小动物达人',
    chapter4_clear: '野生达人',
    chapter5_clear: '海洋达人',
    chapter6_clear: '鸟类达人',
    all_clear: '全部通关',
    score_500: '得分500',
    score_1000: '得分1000',
    score_2000: '得分2000',
    combo_5: '5连击',
    combo_10: '10连击',
    no_prop_clear: '无道具通关'
  }
  return map[id] ?? id
}

/** 成就图标（emoji） */
function achvIcon(id: string): string {
  if (id.startsWith('chapter')) return '🎯'
  if (id.startsWith('score')) return '⭐'
  if (id.startsWith('combo')) return '🔥'
  if (id === 'all_clear') return '👑'
  if (id === 'first_clear') return '🎁'
  if (id === 'no_prop_clear') return '🧩'
  return '🏅'
}

function back(): void {
  router.push('/')
}
</script>

<style scoped>
.records {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--color-bg-card);
  box-shadow: var(--shadow-card);
}

.back-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  font-size: 18px;
  cursor: pointer;
}

.back-btn:hover {
  background: var(--color-primary);
  color: #fff;
}

.page-title {
  font-size: 18px;
  font-weight: 800;
}

/* Tab */
.tabs {
  display: flex;
  padding: 10px 16px;
  gap: 8px;
}

.tab {
  flex: 1;
  padding: 10px 0;
  border-radius: var(--radius-pill);
  font-size: 14px;
  font-weight: 700;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  cursor: pointer;
  color: var(--color-text-light);
  transition: all 0.15s ease;
}

.tab--active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 4px 16px 16px;
}

.empty {
  text-align: center;
  color: var(--color-text-light);
  padding: 60px 20px;
  font-size: 14px;
}

/* 排行榜 */
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  font-size: 13px;
}

.rank-no {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: var(--color-text-light);
}

.rank-no--top {
  background: var(--color-warning);
  color: #fff;
}

.rank-badge {
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 700;
  color: #fff;
}

.badge--classic3 {
  background: var(--color-primary);
}
.badge--classic4 {
  background: var(--color-secondary);
}
.badge--level {
  background: var(--color-accent);
}

.rank-score {
  flex: 1;
  font-size: 16px;
  font-weight: 800;
  color: var(--color-primary-dark);
}

.rank-meta {
  color: var(--color-text-light);
}

.rank-date {
  color: var(--color-text-light);
  font-size: 12px;
}

/* 成就网格 */
.achv-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.achv-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 14px 8px;
  text-align: center;
  border: 2px solid transparent;
}

.achv-card--locked {
  opacity: 0.55;
  filter: grayscale(0.6);
}

.achv-icon {
  font-size: 30px;
  margin-bottom: 6px;
}

.achv-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
}

.achv-status {
  font-size: 11px;
  color: var(--color-text-light);
}
</style>
