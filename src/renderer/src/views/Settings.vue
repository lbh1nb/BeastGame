<template>
  <div class="settings">
    <!-- 顶栏 -->
    <div class="topbar">
      <button class="back-btn" @click="back">←</button>
      <span class="page-title">设置</span>
    </div>

    <div class="content">
      <!-- 音量调节 -->
      <section class="card section">
        <h2 class="section-title">🔊 音量调节</h2>
        <div class="slider-row">
          <label class="slider-label">背景音乐</label>
          <input
            class="slider"
            type="range"
            min="0"
            max="100"
            :value="settingsStore.bgmVolume"
            @input="onBgmChange"
          />
          <span class="slider-value">{{ settingsStore.bgmVolume }}</span>
        </div>
        <div class="slider-row">
          <label class="slider-label">游戏音效</label>
          <input
            class="slider"
            type="range"
            min="0"
            max="100"
            :value="settingsStore.sfxVolume"
            @input="onSfxChange"
          />
          <span class="slider-value">{{ settingsStore.sfxVolume }}</span>
        </div>
      </section>

      <!-- 玩法说明 -->
      <section class="card section">
        <h2 class="section-title">📖 玩法说明</h2>
        <div
          v-for="g in guides"
          :key="g.title"
          class="guide-item"
          :class="{ 'guide-item--open': g.open }"
        >
          <button class="guide-head" @click="g.open = !g.open">
            <span>{{ g.title }}</span>
            <span class="guide-arrow">{{ g.open ? '▾' : '▸' }}</span>
          </button>
          <div v-show="g.open" class="guide-body">{{ g.body }}</div>
        </div>
      </section>

      <!-- 记录查看 -->
      <section class="card section">
        <h2 class="section-title">📊 记录查看</h2>
        <BaseButton type="ghost" @click="router.push('/records')">查看游戏记录</BaseButton>
      </section>

      <!-- 危险操作 -->
      <section class="card section danger-zone">
        <h2 class="section-title danger-title">⚠️ 危险操作</h2>
        <BaseButton type="danger" @click="confirmReset = true">重置所有数据</BaseButton>
      </section>
    </div>

    <!-- 重置确认对话框 -->
    <Dialog
      v-model:visible="confirmReset"
      title="确认重置？"
      confirm-text="确认重置"
      cancel-text="取消"
      @confirm="doReset"
    >
      <p>将清空所有分数记录、闯关进度、成就和设置，且不可恢复。</p>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 设置页
 * - 音量调节（BGM / 音效）
 * - 玩法说明（折叠面板）
 * - 记录查看入口
 * - 危险操作：重置所有数据（二次确认）
 */
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@stores/settings'
import BaseButton from '@components/common/BaseButton.vue'
import Dialog from '@components/common/Dialog.vue'

const router = useRouter()
const settingsStore = useSettingsStore()
const confirmReset = ref(false)

/** 玩法说明折叠面板 */
const guides = reactive([
  {
    title: '经典3消',
    open: false,
    body: '点击图案放入底部槽位，集齐 3 个相同动物即可消除。槽位共 7 格，填满即失败。尽量连击拿高分！'
  },
  {
    title: '四消模式',
    open: false,
    body: '需要集齐 4 个相同动物才能消除，槽位 8 格。难度更高，得分更多，适合高手挑战。'
  },
  {
    title: '闯关模式',
    open: false,
    body: '共 6 章 30 关，逐关解锁。通关可获星级评价，分数达到阈值还会奖励道具（撤回/洗牌/提示）。'
  },
  {
    title: '道具说明',
    open: false,
    body: '撤回 ↩：取消上一次点击；洗牌 🔀：重新打乱牌堆；提示 💡：高亮一组可消除的图案。'
  }
])

onMounted(() => {
  settingsStore.load()
})

function onBgmChange(e: Event): void {
  const v = Number((e.target as HTMLInputElement).value)
  settingsStore.setBgmVolume(v)
}

function onSfxChange(e: Event): void {
  const v = Number((e.target as HTMLInputElement).value)
  settingsStore.setSfxVolume(v)
}

async function doReset(): Promise<void> {
  // 清空所有数据：记录 + 进度 + 成就 + 设置
  await window.gameAPI.settings.clearAllData()
  // 同步刷新本地设置状态
  await settingsStore.load()
  confirmReset.value = false
  alert('已清空所有分数记录、闯关进度、成就和设置')
}

function back(): void {
  router.push('/')
}
</script>

<style scoped>
.settings {
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

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-title {
  font-size: 16px;
  font-weight: 800;
  margin-bottom: 12px;
}

/* 滑块 */
.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.slider-label {
  width: 80px;
  font-size: 14px;
  color: var(--color-text);
}

.slider {
  flex: 1;
  accent-color: var(--color-primary);
}

.slider-value {
  width: 32px;
  text-align: right;
  font-weight: 700;
  color: var(--color-primary-dark);
}

/* 折叠面板 */
.guide-item {
  border-bottom: 1px solid var(--color-border);
}

.guide-item:last-child {
  border-bottom: none;
}

.guide-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: none;
  border: none;
  color: var(--color-text);
}

.guide-arrow {
  color: var(--color-text-light);
}

.guide-body {
  padding: 4px 4px 14px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text-light);
}

/* 危险区 */
.danger-zone {
  border: 2px solid #fecaca;
}

.danger-title {
  color: var(--color-danger);
}
</style>
