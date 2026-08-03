/**
 * 机制元素图片加载工具
 * - 从 resources/mechanics/ 加载 Seedream 生成的像素风元素图
 * - 自动抠透明背景 + 裁剪主体边界（复用与动物图一致的角落色参考法）
 * - 结果缓存，避免重复处理
 */

/** 机制元素类型 */
export type MechanicAssetName =
  | 'moody_cloud'
  | 'vine'
  | 'sleepy_zzz'
  | 'bubble'
  | 'hidden_q'
  | 'star'
  | 'leaf_particle'
  | 'droplet'
  | 'cloud_piece'
  | 'burst_moody'
  | 'burst_vine'
  | 'burst_sleepy'
  | 'burst_bubble'
  | 'burst_hidden'

/** 抠图容差 */
const BG_TOLERANCE = 45

/** 缓存 key = 文件名 */
const cache = new Map<MechanicAssetName, HTMLCanvasElement | null>()

/**
 * 获取某机制元素的抠图结果（透明背景，已裁剪主体边界）
 * @param name 元素名（不含扩展名）
 * @returns 抠图后的 canvas，失败返回 null
 */
export async function getMechanicImage(name: MechanicAssetName): Promise<HTMLCanvasElement | null> {
  if (cache.has(name)) return cache.get(name)!

  let result: HTMLCanvasElement | null = null
  try {
    const basePath = await window.gameAPI.asset.resolve('mechanics')
    const url = 'file:///' + `${basePath}/${name}.jpg`.replace(/\\/g, '/')

    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('load fail: ' + name))
      img.src = url
    })

    const off = document.createElement('canvas')
    off.width = img.width
    off.height = img.height
    const octx = off.getContext('2d')!
    octx.drawImage(img, 0, 0)

    const idd = octx.getImageData(0, 0, off.width, off.height)
    const d = idd.data
    const bgR = d[0]
    const bgG = d[1]
    const bgB = d[2]

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

    if (maxX < minX || maxY < minY) {
      result = null
    } else {
      const cw = maxX - minX + 1
      const ch = maxY - minY + 1
      const crop = document.createElement('canvas')
      crop.width = cw
      crop.height = ch
      crop.getContext('2d')!.drawImage(off, minX, minY, cw, ch, 0, 0, cw, ch)
      result = crop
    }
  } catch {
    result = null
  }

  cache.set(name, result)
  return result
}

/** 预加载所有机制元素，避免首次出现时闪白 */
export async function preloadMechanicImages(): Promise<void> {
  const names: MechanicAssetName[] = [
    'moody_cloud', 'vine', 'sleepy_zzz', 'bubble', 'hidden_q',
    'star', 'leaf_particle', 'droplet', 'cloud_piece',
    'burst_moody', 'burst_vine', 'burst_sleepy', 'burst_bubble', 'burst_hidden'
  ]
  await Promise.all(names.map(n => getMechanicImage(n)))
}

/** 把 canvas 转成 dataURL，方便 <img :src> 使用（带缓存） */
const urlCache = new Map<MechanicAssetName, string | null>()
export async function getMechanicImageUrl(name: MechanicAssetName): Promise<string | null> {
  if (urlCache.has(name)) return urlCache.get(name)!
  const canvas = await getMechanicImage(name)
  const url = canvas ? canvas.toDataURL('image/png') : null
  urlCache.set(name, url)
  return url
}
