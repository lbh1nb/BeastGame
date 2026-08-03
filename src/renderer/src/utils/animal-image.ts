/**
 * 动物图片加载工具（图片素材版）
 * - 从 resources/animals/static 加载静态图，resources/animals/active 加载悬停动态图
 * - 素材为 JPEG 带浅色背景，加载后自动抠透明背景 + 裁剪主体边界
 * - 结果缓存，避免重复处理（同一 (animal, hover) 只处理一次）
 * - 纯渲染层工具，通过 window.gameAPI.asset.resolve 解析资源路径
 */
import type { AnimalType } from '@game/types'

/** 抠图容差：与角落背景色差值之和小于该值时视为背景 */
const BG_TOLERANCE = 45

/** 抠图结果缓存：key = `${animal}_${folder}` */
const cache = new Map<string, HTMLCanvasElement | null>()

/**
 * 获取某动物的抠图结果（透明背景，已裁剪主体边界）
 * @param animal 动物类型
 * @param hover 是否使用悬停动态图（active 文件夹）
 * @returns 抠图后的 canvas，失败返回 null
 */
export async function getAnimalImage(
  animal: AnimalType,
  hover: boolean
): Promise<HTMLCanvasElement | null> {
  const folder = hover ? 'active' : 'static'
  const fileName = hover ? `${animal}_active.jpg` : `${animal}.jpg`
  const key = `${animal}_${folder}`

  if (cache.has(key)) return cache.get(key)!

  let result: HTMLCanvasElement | null = null
  try {
    const basePath = await window.gameAPI.asset.resolve('animals')
    const url = 'file:///' + `${basePath}/${folder}/${fileName}`.replace(/\\/g, '/')

    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('load fail'))
      img.src = url
    })

    // 绘制到离屏 canvas
    const off = document.createElement('canvas')
    off.width = img.width
    off.height = img.height
    const octx = off.getContext('2d')!
    octx.drawImage(img, 0, 0)

    // 读取像素，以角落像素作为背景参考色
    const idd = octx.getImageData(0, 0, off.width, off.height)
    const d = idd.data
    const bgR = d[0]
    const bgG = d[1]
    const bgB = d[2]

    // 抠透明 + 计算主体边界
    let minX = Infinity
    let minY = Infinity
    let maxX = -1
    let maxY = -1
    for (let y = 0; y < off.height; y++) {
      for (let x = 0; x < off.width; x++) {
        const i = (y * off.width + x) * 4
        const isBg =
          Math.abs(d[i] - bgR) + Math.abs(d[i + 1] - bgG) + Math.abs(d[i + 2] - bgB) < BG_TOLERANCE
        if (isBg) {
          d[i + 3] = 0
        } else {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }
    octx.putImageData(idd, 0, 0)

    // 主体边界无效（全背景）则返回空
    if (maxX < minX || maxY < minY) return null

    // 裁剪到主体边界
    const cw = maxX - minX + 1
    const ch = maxY - minY + 1
    const crop = document.createElement('canvas')
    crop.width = cw
    crop.height = ch
    crop.getContext('2d')!.drawImage(off, minX, minY, cw, ch, 0, 0, cw, ch)
    result = crop
  } catch {
    result = null
  }

  cache.set(key, result)
  return result
}

/**
 * 预加载一组动物的图片（static + active）并写入缓存。
 * 在进入游戏前调用，避免牌面卡片空白、慢慢加载的问题。
 * @param animals 需要预加载的动物列表
 */
export async function preloadAnimalImages(animals: AnimalType[]): Promise<void> {
  const tasks: Promise<unknown>[] = []
  for (const animal of animals) {
    tasks.push(getAnimalImage(animal, false))
    tasks.push(getAnimalImage(animal, true))
  }
  await Promise.all(tasks)
}