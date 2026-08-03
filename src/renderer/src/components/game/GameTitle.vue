<template>
  <Transition name="title-enter">
    <div v-if="title" class="game-title" :style="titleStyle">
      <span class="title-icon">{{ icon }}</span>
      <span class="title-text">{{ title }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { getLevelById, CHAPTERS } from "@game/levels.config"
import type { GameMode } from "@game/types"

interface Props {
  mode: GameMode
  levelId?: number
}

const props = defineProps<Props>()

const CHAPTER_EMOJI: Record<number, string> = {
  1: "🐮",
  2: "🦁",
  3: "🐼",
  4: "🦜",
  5: "🐬",
  6: "🦊"
}

const LEVEL_NAMES = ["初识", "熟悉", "挑战", "进阶", "决战"]

const titleInfo = computed(() => {
  if (props.mode === "classic3") {
    return { icon: "🐾", title: "经典三消", color: "#FFF8E1", borderColor: "#FFB74D" }
  }
  if (props.mode === "classic4") {
    return { icon: "✨", title: "四消模式", color: "#F3E5F5", borderColor: "#BA68C8" }
  }
  if (props.mode === "level" && props.levelId != null) {
    const cfg = getLevelById(props.levelId)
    if (!cfg) return null
    const chapter = CHAPTERS.find((c) => c.id === cfg.chapter)
    if (!chapter) return null
    const emoji = CHAPTER_EMOJI[cfg.chapter] ?? "🐾"
    const idx = (props.levelId - 1) % 5
    const levelName = cfg.isBoss ? ("⚔️" + LEVEL_NAMES[idx]) : ("🐾" + LEVEL_NAMES[idx])
    return {
      icon: emoji,
      title: "第" + cfg.chapter + "章 · " + chapter.name + " — 第" + props.levelId + "关 " + levelName,
      color: chapter.theme,
      borderColor: "#FFB74D"
    }
  }
  return null
})

const icon = computed(() => titleInfo.value?.icon ?? "")
const title = computed(() => titleInfo.value?.title ?? "")

const titleStyle = computed(() => {
  if (!titleInfo.value) return {}
  return {
    "--title-bg": titleInfo.value.color,
    "--title-border": titleInfo.value.borderColor
  }
})
</script>

<style scoped>
.game-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 8px 20px;
  border-radius: var(--radius-lg);
  background: var(--title-bg);
  border: 2px solid var(--title-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  user-select: none;
}

.title-icon {
  font-size: 24px;
  animation: icon-bounce 2s ease-in-out infinite;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1));
}

.title-text {
  font-size: 16px;
  font-weight: 800;
  color: #5D4037;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
}

@keyframes icon-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.title-enter-enter-active {
  animation: title-slide-in 0.5s ease;
}

.title-enter-leave-active {
  animation: title-slide-in 0.3s ease reverse;
}

@keyframes title-slide-in {
  0% {
    opacity: 0;
    transform: translateY(-16px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
