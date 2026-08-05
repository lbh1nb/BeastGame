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
    <p class="collection__subtitle">集齐全部 56 只小动物，与它们成为伙伴吧！</p>

    <!-- 按章分组 -->
    <div
      v-for="chapter in CHAPTERS"
      :key="chapter.id"
      class="chapter"
      :style="{ '--chapter-theme': chapter.theme }"
    >
      <h2 class="chapter__name">
        <span class="chapter__badge">{{ chapter.id }}</span>
        {{ chapter.name }}
        <span class="chapter__count">
          {{ obtainedInChapter(chapter.id) }}/{{ chapter.animals.length }}
        </span>
      </h2>

      <div class="chapter__grid">
        <CollectionCard
          v-for="a in chapter.animals"
          :key="a"
          :animal="a"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 收藏册
 * - 顶部展示集齐进度 count/56 + 返回首页
 * - 按 6 章分组展示 56 件收藏品
 * - 已收集卡片显示动物形象（复用 PixelAnimal）+ 稀有度角标
 * - 未收集卡片显示灰色问号占位（剪影）
 */
import { computed, defineComponent, h, onMounted, type PropType } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@components/common/BaseButton.vue'
import PixelAnimal from '@components/game/PixelAnimal.vue'
import type { AnimalType } from '@game/types'
import { useCollectionStore, type CollectionItem } from '@stores/collection'
import { CHAPTERS } from '@game/levels.config'
import { RARITY_NAME, type Rarity } from '@game/collection'
import { ANIMAL_NAMES } from '@utils/pixel-animal'

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

/** 卡片子组件：内部计算一次 obtained/rarity，避免模板重复求值 */
const CollectionCard = defineComponent({
  name: 'CollectionCard',
  props: {
    animal: { type: String as PropType<AnimalType>, required: true },
  },
  setup(props) {
    return () => {
      const obtained = isObtained(props.animal)
      const rarity = rarityOf(props.animal)
      return h(
        'div',
        { class: ['card', { 'card--locked': !obtained }] },
        [
          obtained
            ? h('div', { class: 'card__img' }, [
                h(PixelAnimal, { animal: props.animal, size: 56 }),
              ])
            : h('div', { class: 'card__img card__img--locked' }, '?'),
          h('span', { class: 'card__name' }, ANIMAL_NAMES[props.animal]),
          obtained
            ? h(
                'span',
                { class: ['card__badge', `card__badge--${rarity}`] },
                RARITY_NAME[rarity]
              )
            : null,
        ]
      )
    }
  },
})

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
  background: var(--chapter-theme, #fff);
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

.chapter__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 14px;
}

/* 卡片 */
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px 10px;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  transition: transform 0.12s ease;
}

.card:hover {
  transform: translateY(-3px);
}

.card--locked {
  filter: grayscale(1);
  opacity: 0.6;
}

.card__img {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card__img--locked {
  font-size: 40px;
  font-weight: 900;
  color: #bdbdbd;
  background: #ececec;
  border-radius: 12px;
}

.card__name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
}

/* 稀有度角标 */
.card__badge {
  position: absolute;
  top: -8px;
  right: -6px;
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