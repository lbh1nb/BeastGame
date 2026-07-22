<template>
  <div class="levels">
    <!-- 顶栏 -->
    <div class="topbar">
      <button class="back-btn" @click="back">←</button>
      <span class="page-title">🌍 选择关卡</span>
      <span class="page-subtitle">第 {{ activeChapter }} 章 · {{ currentChapter.name }}</span>
    </div>

    <!-- 上方：3D 地球（居中大尺寸） -->
    <div class="globe-area">
      <EarthGlobe
        :active-chapter="activeChapter"
        :size="360"
        :chapters="chapters"
        @select="selectChapter"
        @hover-animal="handleAnimalHover"
      />
    </div>

    <!-- 章节切换标签栏 -->
    <div class="chapter-tabs">
      <button
        v-for="ch in chapters"
        :key="ch.id"
        class="tab-btn"
        :class="{ 'tab-btn--active': activeChapter === ch.id }"
        @click="selectChapter(ch.id)"
      >
        <span class="tab-emoji">{{ chapterEmoji(ch.id) }}</span>
        <span class="tab-name">{{ ch.name }}</span>
      </button>
    </div>

    <!-- 下方：关卡网格（纵向排列） -->
    <div class="levels-list">
      <div class="levels-list-title">
        <span>关卡列表</span>
        <span class="chapter-progress">{{ completedCount }}/{{ totalCount }}</span>
      </div>
      <div class="levels-grid">
        <button
          v-for="lv in levelsOf(activeChapter)"
          :key="lv.id"
          class="level-btn"
          :class="{ 'level-btn--locked': isLocked(lv.id), 'level-btn--boss': isBoss(lv.id) }"
          :disabled="isLocked(lv.id)"
          @click="enterLevel(lv.id)"
        >
          <span v-if="isBoss(lv.id)" class="boss-tag">BOSS</span>
          <span class="level-no">{{ lv.id }}</span>
          <span class="level-stars">
            <template v-for="n in 3" :key="n">
              <span :class="n <= starsOf(lv.id) ? 'star star--on' : 'star'">★</span>
            </template>
          </span>
          <span v-if="isLocked(lv.id)" class="lock-icon">🔒</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 选关页（v3：3D地球版）
 * - 上方：大尺寸 3D 地球（360px），场景直接在地球表面
 * - 中部：6 章节切换标签栏
 * - 下方：关卡网格纵向排列
 * - 点击地球左右按钮/标签栏切换章节，地球真实旋转
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { CHAPTERS, LEVELS } from '@game/levels.config'
import type { Chapter } from '@game/levels.config'
import { useUserStore } from '@stores/user'
import EarthGlobe from '@components/game/EarthGlobe.vue'
import audioManager from '@audio/manager'
import type { AnimalType } from '@game/types'

const router = useRouter()
const userStore = useUserStore()

/** 当前选中章节 */
const activeChapter = ref(1)

/** 章节兜底配置 */
const FALLBACK_CHAPTERS: Chapter[] = [
  { id: 1, name: '家畜', animals: ['sheep', 'chicken', 'duck', 'goose'], theme: '#FFF8DC' },
  { id: 2, name: '宠物', animals: ['cat', 'dog', 'rabbit', 'hamster'], theme: '#FFE4E1' },
  { id: 3, name: '小动物', animals: ['rabbit', 'hamster', 'chicken', 'duck'], theme: '#E6F5E6' },
  { id: 4, name: '野生', animals: ['tiger', 'bear', 'sheep', 'cat'], theme: '#FFE8CC' },
  { id: 5, name: '海洋', animals: ['fish', 'whale', 'duck', 'goose'], theme: '#E0F0FF' },
  { id: 6, name: '综合', animals: ['tiger', 'bear', 'fish', 'whale'], theme: '#ECE0FF' }
]

const chapters = computed<Chapter[]>(() => {
  if (!CHAPTERS || CHAPTERS.length === 0) return FALLBACK_CHAPTERS
  return CHAPTERS
})

/** 当前章节对象 */
const currentChapter = computed<Chapter>(() => {
  return chapters.value.find((c) => c.id === activeChapter.value) ?? chapters.value[0]
})

/** 当前章节关卡完成数 */
const completedCount = computed(() => {
  return levelsOf(activeChapter.value).filter((lv) => starsOf(lv.id) > 0).length
})

/** 当前章节关卡总数 */
const totalCount = computed(() => levelsOf(activeChapter.value).length)

/** 章节图标 */
function chapterEmoji(id: number): string {
  const emojis: Record<number, string> = {
    1: '🏠',
    2: '🐾',
    3: '🌳',
    4: '🌿',
    5: '🌊',
    6: '⛰️'
  }
  return emojis[id] ?? '📍'
}

/** 选择章节 */
function selectChapter(id: number): void {
  activeChapter.value = id
}

/** 悬停地球上的动物播放叫声 */
function handleAnimalHover(animal: AnimalType): void {
  audioManager.playAnimalSound(animal)
}

/** 某章节下的关卡 */
function levelsOf(chapterId: number) {
  const all = (LEVELS as any[] | undefined) || []
  const list = all.filter((l) => l.chapter === chapterId)
  if (list.length === 0) {
    const base = (chapterId - 1) * 5 + 1
    return Array.from({ length: 5 }, (_, i) => ({
      id: base + i,
      chapter: chapterId,
      isBoss: (i + 1) % 5 === 0
    }))
  }
  return list
}

/** 是否 Boss 关（每章第 5 关） */
function isBoss(levelId: number): boolean {
  return levelId % 5 === 0
}

/** 是否锁定 */
function isLocked(levelId: number): boolean {
  if (levelId === 1) return false
  return !userStore.isLevelUnlocked(levelId)
}

/** 获取星级 */
function starsOf(levelId: number): number {
  return userStore.getProgress(levelId)?.stars ?? 0
}

function enterLevel(levelId: number): void {
  router.push({ path: '/game/level', query: { levelId: String(levelId) } })
}

function back(): void {
  router.push('/')
}

onMounted(() => {
  userStore.loadProgress()
})
</script>

<style scoped>
.levels {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%);
  overflow: hidden;
}

/* 顶栏 */
.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.back-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #90caf9;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #42a5f5;
  color: #fff;
  border-color: #42a5f5;
}

.page-title {
  font-size: 18px;
  font-weight: 800;
  color: #1565c0;
}

.page-subtitle {
  margin-left: auto;
  font-size: 14px;
  font-weight: 700;
  color: #5c6bc0;
  background: rgba(255, 255, 255, 0.6);
  padding: 4px 10px;
  border-radius: 12px;
}

/* 地球区 */
.globe-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  min-height: 380px;
  position: relative;
}

/* 章节标签栏 */
.chapter-tabs {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.4);
}

.tab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 16px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-2px);
}

.tab-btn--active {
  background: #fff;
  border-color: #ffd700;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.tab-emoji {
  font-size: 24px;
  line-height: 1;
}

.tab-name {
  font-size: 12px;
  font-weight: 700;
  color: #455a64;
}

/* 关卡列表区 */
.levels-list {
  background: rgba(255, 255, 255, 0.85);
  padding: 12px 16px 16px;
  flex-shrink: 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.levels-list-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 800;
  color: #1565c0;
}

.chapter-progress {
  font-size: 12px;
  color: #5c6bc0;
  background: #e3f2fd;
  padding: 2px 8px;
  border-radius: 10px;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  max-width: 600px;
  margin: 0 auto;
}

.level-btn {
  position: relative;
  aspect-ratio: 1;
  border-radius: 14px;
  background: #fff;
  border: 3px solid #e3f2fd;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.level-btn:hover:not(:disabled) {
  background: #e3f2fd;
  border-color: #42a5f5;
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(66, 165, 245, 0.25);
}

.level-btn:active:not(:disabled) {
  transform: translateY(0);
}

.level-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.level-btn--locked {
  background: #f5f5f5;
}

.level-btn--boss {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-color: #ff9800;
}

.level-btn--boss:hover:not(:disabled) {
  background: linear-gradient(135deg, #ffe0b2 0%, #ffb74d 100%);
}

.boss-tag {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 9px;
  font-weight: 900;
  color: #fff;
  background: #e65100;
  padding: 1px 4px;
  border-radius: 4px;
}

.level-no {
  font-size: 22px;
  font-weight: 900;
  color: #1565c0;
}

.level-btn--boss .level-no {
  color: #e65100;
}

.level-stars {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1;
}

.star {
  color: #e0e0e0;
}

.star--on {
  color: #ffc107;
}

.lock-icon {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 14px;
}
</style>
