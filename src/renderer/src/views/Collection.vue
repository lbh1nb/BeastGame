<template>
  <div class="collection">
    <!-- 装饰性气泡 / 云朵（与加载/主页 Q萌风格一致） -->
    <div class="bubble bubble--1" />
    <div class="bubble bubble--2" />
    <div class="bubble bubble--3" />
    <div class="cloud cloud--1" />
    <div class="cloud cloud--2" />

    <!-- 顶部：返回 + 集齐进度 -->
    <div class="collection__header">
      <BaseButton size="md" type="ghost" @click="goHome">⬅ 返回</BaseButton>
      <div class="progress">
        <span class="progress__label">收集进度</span>
        <div class="progress__bar">
          <div class="progress__fill" :style="{ width: percent + '%' }" />
        </div>
        <span class="progress__num">{{ collection.count }} / {{ TOTAL }}</span>
      </div>
    </div>

    <!-- 相册封面标题 -->
    <div class="album-cover">
      <div class="album-cover__tie album-cover__tie--l" />
      <div class="album-cover__tie album-cover__tie--r" />
      <h1 class="album-cover__title">🎨 萌趣收藏册</h1>
      <p class="album-cover__subtitle">集齐全部 {{ TOTAL }} 件与小动物相关的可爱物品，点亮你的相册吧 ✨</p>
    </div>

    <!-- 相册页：按章分组 -->
    <div
      v-for="chapter in CHAPTERS"
      :key="chapter.id"
      class="album-page"
    >
      <!-- 章节头：小动物头像 + 章节名 + 数量 -->
      <div class="chapter-head">
        <div class="chapter-head__avatar">
          <img
            class="chapter-head__animal"
            :src="assetUrl(`animals/static/${chapterMeta(chapter.id).animal}.jpg`)"
            :alt="chapter.name"
          />
        </div>
        <div class="chapter-head__text">
          <h2 class="chapter-head__name">
            <span class="chapter-head__emoji">{{ chapterMeta(chapter.id).emoji }}</span>
            {{ chapter.name }}
          </h2>
          <span class="chapter-head__count">
            已集 {{ obtainedInChapter(chapter.id) }} / {{ chapter.animals.length }}
          </span>
        </div>
        <div class="chapter-head__decor" aria-hidden="true">
          <span class="chapter-head__shine">✦</span>
          <span class="chapter-head__clip">📎</span>
        </div>
      </div>

      <!-- 相册内页网格 -->
      <div class="chapter__grid">
        <button
          v-for="a in chapter.animals"
          :key="a"
          class="card"
          :class="{ 'card--locked': !isObtained(a) }"
          @click="openDetail(a)"
        >
          <!-- 稀有度角标 -->
          <span
            v-if="isObtained(a)"
            class="card__badge"
            :class="`card__badge--${rarityOf(a)}`"
          >
            {{ RARITY_NAME[rarityOf(a)] }}
          </span>

          <!-- 相框：固定尺寸，物品尽量填满 -->
          <div class="card__frame">
            <template v-if="isObtained(a)">
              <img
                class="card__img"
                :src="assetUrl(`collection/${collectionItemOf(a).img}`)"
                :alt="collectionItemOf(a).name"
              />
            </template>
            <span v-else class="card__question">?</span>
          </div>

          <span class="card__name">{{ collectionItemOf(a).name }}</span>
        </button>
      </div>
    </div>

    <!-- 收藏详情弹窗 -->
    <Dialog
      v-model:visible="detailVisible"
      :title="detailTitle"
      cancel-text="关闭"
      @cancel="closeDetail"
    >
      <div v-if="detail" class="detail">
        <div
          class="detail__frame"
          :class="['frame-glow--' + detail.rarity]"
        >
          <img
            class="detail__img"
            :src="assetUrl(`collection/${detail.item.img}`)"
            :alt="detail.item.name"
          />
        </div>
        <div class="detail__name">{{ detail.item.name }}</div>

        <div class="detail__meta">
          <span class="detail__rarity" :class="'rarity-' + detail.rarity">
            {{ RARITY_NAME[detail.rarity] }}
          </span>
          <span v-if="detail.obtained" class="detail__got">✓ 已收集</span>
          <span v-else class="detail__lack">未收集</span>
        </div>

        <p class="detail__desc">{{ detail.item.desc }}</p>

        <div v-if="detail.obtained" class="detail__count">
          重复掉落可转化金币：普通 +80 / 稀有 +200 / 史诗 +400 / 传说 +800
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 收藏册（相册风格）
 * - 顶部：返回 + 集齐进度 + 相册封面标题（Q萌暖色，与加载/主页一致）
 * - 相册页按 6 章分组：章节头带小动物头像与装饰，物品以相框形式展示
 * - 物品图片尽量填满展示框（透明底撑满 + 轻微放大）
 * - 点击某个收藏品 → 弹出详情（大图 + 名称 + 稀有度 + 描述 + 收集状态）
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@components/common/BaseButton.vue'
import Dialog from '@components/common/Dialog.vue'
import type { AnimalType } from '@game/types'
import { useCollectionStore, type CollectionItem } from '@stores/collection'
import { CHAPTERS } from '@game/levels.config'
import { RARITY_NAME, type Rarity } from '@game/collection'
import { collectionItemOf, type CollectionItemDef } from '@game/collection-item'
import { assetUrl } from '@utils/asset-url'

const router = useRouter()
const collection = useCollectionStore()

/** 收藏品总数（56） */
const TOTAL = CHAPTERS.reduce((sum, c) => sum + c.animals.length, 0)

/** 章节装饰元信息：emoji + 该章代表性小动物（复用现有动物素材，无需 work 端新生成） */
const CHAPTER_META: Record<number, { emoji: string; animal: AnimalType }> = {
  1: { emoji: '🐑', animal: 'sheep' },
  2: { emoji: '🐯', animal: 'tiger' },
  3: { emoji: '🐵', animal: 'monkey' },
  4: { emoji: '🐰', animal: 'rabbit' },
  5: { emoji: '🐟', animal: 'fish' },
  6: { emoji: '🦄', animal: 'hippo' }
}

function chapterMeta(chapterId: number): { emoji: string; animal: AnimalType } {
  return CHAPTER_META[chapterId] ?? { emoji: '🎁', animal: 'sheep' }
}

/** 集齐进度百分比（0~100） */
const percent = computed(() =>
  TOTAL > 0 ? Math.min(100, (collection.count / TOTAL) * 100) : 0
)

/** 收藏品 id → 记录的 Map */
const itemMap = computed<Map<string, CollectionItem>>(() => {
  const map = new Map<string, CollectionItem>()
  for (const item of collection.items) {
    if (item && item.id != null) map.set(String(item.id), item)
  }
  return map
})

/** 某动物是否已收集 */
function isObtained(animal: string): boolean {
  const item = itemMap.value.get(animal)
  return !!item && item.obtained >= 1
}

/** 某动物的稀有度（未收集时兜底 common） */
function rarityOf(animal: string): Rarity {
  const r = itemMap.value.get(animal)?.rarity as Rarity | undefined
  return r && ['common', 'rare', 'epic', 'legendary'].includes(r) ? r : 'common'
}

/** 某章已收集数量 */
function obtainedInChapter(chapterId: number): number {
  const ch = CHAPTERS.find((c) => c.id === chapterId)
  if (!ch) return 0
  return ch.animals.filter((a) => isObtained(a)).length
}

/** 详情弹窗数据 */
interface DetailData {
  item: CollectionItemDef
  rarity: Rarity
  obtained: boolean
}
const detailVisible = ref(false)
const detail = ref<DetailData | null>(null)

/** 弹窗标题 */
const detailTitle = computed(() =>
  detail.value?.obtained ? '🎁 收藏详情' : '🔒 尚未收集'
)

/** 打开某动物收藏详情 */
function openDetail(animal: string): void {
  const item = collectionItemOf(animal as AnimalType)
  detail.value = {
    item,
    rarity: rarityOf(animal),
    obtained: isObtained(animal)
  }
  detailVisible.value = true
}

function closeDetail(): void {
  detailVisible.value = false
  detail.value = null
}

onMounted(() => {
  collection.load()
})

function goHome(): void {
  router.push('/')
}
</script>

<style scoped>
.collection {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 40px 40px;
  overflow-y: auto;
  background: linear-gradient(180deg, #fff5e1 0%, #ffe9c4 100%);
}

/* 顶部 */
.collection__header {
  display: flex;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 880px;
  z-index: 2;
}

.collection__header :deep(.base-btn) {
  width: auto;
  flex: none;
}

.progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-card);
}

.progress__label {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-light);
  white-space: nowrap;
}

.progress__bar {
  flex: 1;
  height: 12px;
  border-radius: var(--radius-pill);
  background: var(--color-border);
  overflow: hidden;
}

.progress__fill {
  height: 100%;
  border-radius: var(--radius-pill);
  background: linear-gradient(90deg, #ffb84d, #ff6b9d);
  transition: width 0.4s ease;
}

.progress__num {
  font-size: 16px;
  font-weight: 800;
  color: var(--color-text);
  white-space: nowrap;
}

/* 相册封面标题 */
.album-cover {
  position: relative;
  margin-top: 22px;
  width: 100%;
  max-width: 880px;
  padding: 24px 28px 20px;
  text-align: center;
  background: linear-gradient(135deg, #fffdf7 0%, #fff0d0 100%);
  border: 3px solid #f0d59a;
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.06), var(--shadow-card);
  z-index: 2;
}

/* 相册装订带 */
.album-cover__tie {
  position: absolute;
  top: -12px;
  width: 26px;
  height: 34px;
  border-radius: 6px;
}

.album-cover__tie--l {
  left: 18%;
  background: #ff6b9d;
  transform: rotate(-8deg);
}

.album-cover__tie--r {
  right: 18%;
  background: #6dd5b3;
  transform: rotate(8deg);
}

.album-cover__title {
  font-size: 34px;
  font-weight: 900;
  color: var(--color-text);
  letter-spacing: 2px;
  text-shadow: 0 2px 0 rgba(255, 165, 0, 0.15);
}

.album-cover__subtitle {
  margin-top: 8px;
  font-size: 14px;
  color: var(--color-text-light);
}

/* 相册页 */
.album-page {
  margin-top: 26px;
  width: 100%;
  max-width: 880px;
  padding: 20px 24px 24px;
  background: linear-gradient(180deg, #fffdf7 0%, #fdf3e0 100%);
  border: 2px solid #ecd9b8;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  position: relative;
  z-index: 2;
}

/* 章节头 */
.chapter-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 2px dashed #ecd9b8;
}

.chapter-head__avatar {
  flex: none;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  background: #fff;
  border: 3px solid var(--color-primary);
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.08);
}

.chapter-head__animal {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.chapter-head__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chapter-head__name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 21px;
  font-weight: 900;
  color: var(--color-text);
}

.chapter-head__emoji {
  font-size: 22px;
}

.chapter-head__count {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-light);
}

.chapter-head__decor {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  color: #f0a937;
}

.chapter-head__shine {
  animation: twinkle 2s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.4; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.15); }
}

/* 网格：固定最小列宽，卡片尺寸统一 */
.chapter__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 16px;
}

/* 卡片（相框钮）：固定宽高，内容不撑破 */
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  width: 100%;
  height: 158px;
  padding: 12px 8px 10px;
  box-sizing: border-box;
  background: linear-gradient(180deg, #ffffff 0%, #fff6e3 100%);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.05), var(--shadow-card);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  cursor: pointer;
  overflow: hidden;
}

.card:hover {
  transform: translateY(-4px) rotate(-1deg);
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.06), 0 12px 20px rgba(0, 0, 0, 0.1);
  z-index: 3;
}

.card:active {
  transform: translateY(-1px);
}

.card--locked {
  filter: grayscale(1);
  opacity: 0.55;
}

/* 相框：固定尺寸，物品尽量填满（透明底撑满 + 轻微放大） */
.card__frame {
  flex: none;
  width: 92px;
  height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fffdf7, #fff1d8);
  border: 2px solid #ecd9b8;
  border-radius: 14px;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card__img {
  display: block;
  width: 112%;
  height: 112%;
  flex: none;
  object-fit: contain;
}

.card__question {
  font-size: 44px;
  font-weight: 900;
  color: #c9c2b4;
  line-height: 1;
}

/* 名称：单行省略，不撑高卡片 */
.card__name {
  width: 100%;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 稀有度角标 */
.card__badge {
  position: absolute;
  top: -8px;
  right: -6px;
  z-index: 2;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 800;
  color: #fff;
  box-shadow: var(--shadow-card);
}

.card__badge--common { background: #9e9e9e; }
.card__badge--rare { background: #3b82f6; }
.card__badge--epic { background: #8b5cf6; }
.card__badge--legendary { background: #f59e0b; }

/* 装饰气泡 */
.bubble {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
  opacity: 0.5;
  z-index: 1;
  animation: float 6s ease-in-out infinite;
}

.bubble--1 { width: 120px; height: 120px; background: var(--color-secondary); top: 12%; left: -30px; }
.bubble--2 { width: 80px; height: 80px; background: var(--color-accent); top: 44%; right: -20px; animation-delay: 1.5s; }
.bubble--3 { width: 60px; height: 60px; background: var(--color-primary); bottom: 16%; left: 8%; animation-delay: 3s; }

.cloud {
  position: absolute;
  background: #fff;
  border-radius: 50px;
  opacity: 0.7;
  z-index: 1;
}

.cloud--1 { width: 100px; height: 36px; top: 8%; right: 12%; box-shadow: 30px 8px 0 -4px #fff, -28px 6px 0 -2px #fff; }
.cloud--2 { width: 80px; height: 28px; bottom: 24%; right: 16%; box-shadow: 24px 6px 0 -3px #fff, -22px 5px 0 -2px #fff; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-14px); }
}

/* ===== 收藏详情弹窗 ===== */
.detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.detail__frame {
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fffdf7, #fff1d8);
  border: 3px solid #ecd9b8;
  border-radius: 20px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.frame-glow--common { box-shadow: 0 0 18px rgba(158, 158, 158, 0.4); }
.frame-glow--rare { box-shadow: 0 0 24px rgba(66, 165, 245, 0.5); }
.frame-glow--epic { box-shadow: 0 0 28px rgba(171, 71, 188, 0.55); }
.frame-glow--legendary { box-shadow: 0 0 34px rgba(255, 140, 0, 0.65); }

.detail__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.detail__name {
  font-size: 22px;
  font-weight: 900;
  color: var(--color-text);
}

.detail__meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail__rarity {
  font-size: 13px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: var(--radius-pill);
  color: #fff;
}

.rarity-common { background: #9e9e9e; }
.rarity-rare { background: #42a5f5; }
.rarity-epic { background: #ab47bc; }
.rarity-legendary { background: linear-gradient(135deg, #ffb300, #ff6d00); }

.detail__got { color: #2e7d32; font-weight: 800; }
.detail__lack { color: #b0a695; font-weight: 800; }

.detail__desc {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text);
  text-align: center;
  max-width: 320px;
}

.detail__count {
  font-size: 12px;
  color: #b26a00;
  background: #fff7e6;
  border: 1px dashed #f0d59a;
  border-radius: 10px;
  padding: 6px 12px;
}
</style>