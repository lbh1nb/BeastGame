/**
 * 机制解除视频加载工具
 * - 从 resources/mechanics/videos/ 加载 work 模式生成的机制解除视频（480p 1:1）
 * - 命名规则：{mechanic}_resolve.mp4（如 moody_resolve.mp4）
 * - 通过 fetch(file://) 读取为 Blob 并创建 objectURL，避免 `<video src="file://">` 在部分环境下加载失败
 * - 结果以 Promise 缓存，避免重复读取
 */
import type { MechanicType } from '@game/types'
import { assetUrl } from './asset-url'

/** 视频播放速率：源视频 4 秒，解除动画仅需 ~1 秒，故加速 4 倍 */
export const MECHANIC_VIDEO_PLAYBACK_RATE = 4

/** 5 种机制（含 hidden，hidden 也使用视频播放翻牌动画） */
const MECHANIC_TYPES: MechanicType[] = ['moody', 'vine', 'sleepy', 'hidden', 'bubble']

/** 缓存 key = 机制类型，值为 Promise（避免并发重复读取） */
const cache = new Map<MechanicType, Promise<string | undefined>>()

/**
 * 获取某机制的解除视频 objectURL（blob://）
 * @param mechanic 机制类型
 * @returns 视频 objectURL，读取失败返回 undefined
 */
export function getMechanicVideoUrl(mechanic: MechanicType): Promise<string | undefined> {
  if (cache.has(mechanic)) return cache.get(mechanic)!

  const p = (async (): Promise<string | undefined> => {
    let url: string | undefined
    try {
      // 使用自定义协议 assets:// 加载，避免 file:// 在 fetch 时被 CORS 拦截
      const fileUrl = assetUrl(`mechanics/videos/${mechanic}_resolve.mp4`)
      const resp = await fetch(fileUrl)
      if (!resp.ok) throw new Error(`fetch fail: ${fileUrl}`)
      const blob = await resp.blob()
      url = URL.createObjectURL(blob)
    } catch {
      url = undefined
    }
    return url
  })()

  cache.set(mechanic, p)
  return p
}

/** 保留预热用的 <video> 引用，避免被 GC 回收导致解码缓存失效（数量少，静音不播，开销可忽略） */
const warmupEls: HTMLVideoElement[] = []

/**
 * 预加载全部机制的解除视频并预热解码。
 * - getMechanicVideoUrl 仅 fetch 为 blob 建 objectURL（不解码）；
 *   这里额外创建隐藏 <video> 触发解码，确保机制动画触发时视频帧已就绪、可立即播放，
 *   避免动画窗口（~1s）内视频仍在解码导致回退静态图或丢帧。
 * - 供游戏启动时后台调用，不阻塞游戏启动。
 */
export async function preloadMechanicVideos(): Promise<void> {
  const urls = await Promise.all(MECHANIC_TYPES.map((t) => getMechanicVideoUrl(t)))
  await Promise.all(urls.filter((u): u is string => !!u).map((u) => warmVideo(u)))
}

/** 创建一个隐藏 <video> 加载指定 objectURL 并等待首帧就绪，触发解码缓存 */
function warmVideo(url: string): Promise<void> {
  return new Promise((resolve) => {
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      v.removeEventListener('loadeddata', done)
      v.removeEventListener('error', done)
      resolve()
    }
    const v = document.createElement('video')
    v.preload = 'auto'
    v.muted = true
    v.playsInline = true
    v.src = url
    warmupEls.push(v)
    v.addEventListener('loadeddata', done)
    v.addEventListener('error', done)
    // 兜底：3s 内未就绪也不阻塞，避免长时间卡在预加载
    setTimeout(done, 3000)
  })
}