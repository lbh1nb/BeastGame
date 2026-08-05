<template>
  <div class="collection">
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

    <h1 class="collection__title">🎨 收藏册</h1>
    <p class="collection__subtitle">集齐全部 {{ TOTAL }} 件萌趣物品，点亮你的收藏册吧！</p>

    <!-- 按章分组 -->
    <div
      v-for="chapter in CHAPTERS"
      :key="chapter.id"
      class="chapter"
    >
      <h2 class="chapter__name">
        <span class="chapter__badge">{{ chapter.id }}</span>
        {{ chapter.name }}
        <span class="chapter__count">
          {{ obtainedInChapter(chapter.id) }}/{{ chapter.animals.length }}
        </span>
      </h2>

      <div class="chapter__grid">
        <div
          v-for="a in chapter.animals"
          :key="a"
          class="card"
          :class="{ 'card--locked': !isObtained(a) }"
        >
          <!-- 稀有度角标 -->
          <span
            v-if="isObtained(a)"
            class="card__badge"
            :class="`card__badge--${rarityOf(a)}`"
          >
            {{ RARITY_NAME[rarityOf(a)] }}
          </span>

          <!-- 展品框（固定尺寸，图片完美嵌入） -->
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 收藏册
 * - 顶部展示集齐进度 count/56 + 返回首页
 * - 按 6 章分组展示 56 件可爱收藏物品
 * - 已收集卡片：固定展品框内展示物品图 + 稀有度角标
 * - 未收集卡片：灰色问号占位
 */
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@components/common/BaseButton.vue'
import type { AnimalType } from '@game/types'
import { useCollectionStore, type CollectionItem } from '@stores/collection'
import { CHAPTERS } from '@game/levels.config'
import { RARITY_NAME, type Rarity } from '@game/collection'
import { collectionItemOf } from '@game/collection-item'
import { assetUrl } from '@utils/asset-url'

const router = useRouter()
const collection = useCollectionStore()

/** 收藏品总数（56） */
const TOTAL = CHAPTERS.reduce((sum, c) => sum + c.animals.length, 0)

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
  padding: 28px 40px 40px;
  overflow-y: auto;
  background: linear-gradient(180deg, #fff5e1 0%, #ffe9c4 100%);
}

.collection__header {
  display: flex;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 860px;
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

.collection__title {
  margin-top: 24px;
  font-size: 34px;
  font-weight: 900;
  color: var(--color-text);
}

.collection__subtitle {
  margin-top: 8px;
  font-size: 14px;
  color: var(--color-text-light);
}

/* 章节 */
.chapter {
  margin-top: 28px;
  width: 100%;
  max-width: 860px;
  padding: 20px 24px;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.chapter__name {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  font-size: 20px;
  font-weight: 900;
  color: var(--color-text);
}

.chapter__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 15px;
  font-weight: 900;
}

.chapter__count {
  margin-left: auto;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-light);
}

/* 网格：固定最小列宽，卡片尺寸统一 */
.chapter__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 14px;
}

/* 卡片：固定宽高，内容不撑破 */
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 148px;
  padding: 10px 8px 8px;
  box-sizing: border-box;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  transition: transform 0.12s ease;
  overflow: hidden;
}

.card:hover {
  transform: translateY(-3px);
}

.card--locked {
  filter: grayscale(1);
  opacity: 0.6;
}

/* 展品框：固定尺寸，图片绝对嵌入不溢出 */
.card__frame {
  flex: none;
  width: 76px;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fffdf7, #fff1d8);
  border: 2px solid #ecd9b8;
  border-radius: 15px;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card__img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

.card__question {
  font-size: 40px;
  font-weight: 900;
  color: #c9c2b4;
  line-height: 1;
}

/* 名称：单行省略，不撑高卡片 */
.card__name {
  width: 100%;
  font-size: 12px;
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

.card__badge--common {
  background: #9e9e9e;
}

.card__badge--rare {
  background: #3b82f6;
}

.card__badge--epic {
  background: #8b5cf6;
}

.card__badge--legendary {
  background: #f59e0b;
}
</style>