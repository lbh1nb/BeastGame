<template>
  <div class="shop">
    <!-- 顶部：返回 + 金币余额 -->
    <div class="shop__header">
      <BaseButton size="md" type="ghost" @click="goHome">⬅ 返回</BaseButton>
      <div class="coin-balance">
        <span class="coin-balance__icon">🪙</span>
        <span class="coin-balance__num">{{ inventory.coin }}</span>
      </div>
    </div>

    <h1 class="shop__title">🛒 道具商店</h1>
    <p class="shop__subtitle">用金币兑换实用道具，助你轻松通关</p>

    <!-- 商品卡 -->
    <div class="shop__grid">
      <div
        v-for="item in goods"
        :key="item.key"
        class="card"
        :class="{ 'card--disabled': inventory.coin < item.price }"
      >
        <div class="card__icon">{{ item.icon }}</div>
        <div class="card__name">{{ item.name }}</div>
        <div class="card__price">
          🪙 <span>{{ item.price }}</span>
        </div>
        <BaseButton
          size="md"
          type="primary"
          :disabled="inventory.coin < item.price"
          @click="handleBuy(item.key)"
        >
          购买
        </BaseButton>
      </div>
    </div>

    <!-- 轻提示 -->
    <div v-if="toast" class="toast" :class="`toast--${toastType}`">{{ toast }}</div>
  </div>
</template>

<script setup lang="ts">
/**
 * 道具商店
 * - 顶部显示金币余额 + 返回首页
 * - 4 张新道具商品卡（图标/名称/价格/购买按钮）
 * - 金币不足时购买按钮置灰
 * - 购买成功刷新余额并轻提示
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@components/common/BaseButton.vue'
import { useInventoryStore } from '@stores/inventory'
import { NEW_PROP_PRICES, PROP_NAMES } from '@game/props.config'

type ShopProp = 'chisel' | 'clearProp' | 'pair' | 'slot'

const router = useRouter()
const inventory = useInventoryStore()

/** 商品清单（名称/价格取自配置，配图标） */
const goods: { key: ShopProp; icon: string; name: string; price: number }[] = [
  { key: 'chisel', icon: '🔨', name: PROP_NAMES.chisel, price: NEW_PROP_PRICES.chisel },
  { key: 'clearProp', icon: '🧹', name: PROP_NAMES.clearProp, price: NEW_PROP_PRICES.clearProp },
  { key: 'pair', icon: '⚡', name: PROP_NAMES.pair, price: NEW_PROP_PRICES.pair },
  { key: 'slot', icon: '➕', name: PROP_NAMES.slot, price: NEW_PROP_PRICES.slot }
]

/** 轻提示 */
const toast = ref('')
const toastType = ref<'success' | 'error'>('success')
let toastTimer: number | undefined

onMounted(() => {
  inventory.load()
})

function goHome(): void {
  clearToast()
  router.push('/')
}

async function handleBuy(prop: ShopProp): Promise<void> {
  const ok = await inventory.buy(prop)
  clearToast()
  toastType.value = ok ? 'success' : 'error'
  toast.value = ok
    ? `购买成功！已获得 ${goods.find((g) => g.key === prop)?.icon} ${PROP_NAMES[prop]}`
    : '金币不足，无法购买'
  toastTimer = window.setTimeout(clearToast, 2000)
}

function clearToast(): void {
  if (toastTimer) {
    window.clearTimeout(toastTimer)
    toastTimer = undefined
  }
  toast.value = ''
}
</script>

<style scoped>
.shop {
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

.shop__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 760px;
}

.shop__header :deep(.base-btn) {
  width: auto;
}

.coin-balance {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-card);
}

.coin-balance__icon {
  font-size: 20px;
}

.coin-balance__num {
  font-size: 20px;
  font-weight: 800;
  color: var(--color-warning);
}

.shop__title {
  margin-top: 24px;
  font-size: 34px;
  font-weight: 900;
  color: var(--color-text);
}

.shop__subtitle {
  margin-top: 8px;
  font-size: 14px;
  color: var(--color-text-light);
}

.shop__grid {
  margin-top: 28px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 760px;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 16px 20px;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  transition: transform 0.12s ease;
}

.card:hover {
  transform: translateY(-3px);
}

.card--disabled {
  filter: grayscale(0.4);
  opacity: 0.75;
}

.card__icon {
  font-size: 44px;
}

.card__name {
  font-size: 17px;
  font-weight: 800;
  color: var(--color-text);
}

.card__price {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-warning);
}

.card__price span {
  font-size: 18px;
}

.card :deep(.base-btn) {
  width: 100%;
}

/* 轻提示 */
.toast {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: var(--radius-pill);
  font-weight: 700;
  color: #fff;
  box-shadow: var(--shadow-card);
  z-index: 10;
}

.toast--success {
  background: var(--color-secondary);
}

.toast--error {
  background: var(--color-danger);
}
</style>