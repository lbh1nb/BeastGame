/**
 * 动物辅助工具（图片素材版）
 * 动物贴图已改为加载 resources/animals 下的图片素材（见 utils/animal-image.ts），
 * 本文件仅保留非贴图相关的辅助函数：
 * - getAnimalBgColor       牌面背景色
 * - ANIMAL_NAMES           动物中文名映射（48 种）
 * - drawMechanicOverlay    章节机制遮罩绘制
 * - drawMechanicResolved   机制解除效果绘制
 */
import type { AnimalType } from '@game/types'

/** 获取动物的背景色 */
export function getAnimalBgColor(_animal: AnimalType): string {
  return '#f8f5ee'
}

/** 动物中文名映射（48 种） */
export const ANIMAL_NAMES: Record<AnimalType, string> = {
  // 第1章 家畜
  sheep: '绵羊', pig: '小猪', chicken: '小鸡', cow: '奶牛',
  horse: '小马', goat: '山羊', duck: '小鸭', rooster: '公鸡',
  // 第2章 野兽
  tiger: '老虎', lion: '狮子', bear: '棕熊', wolf: '灰狼',
  fox: '狐狸', zebra: '斑马', camel: '骆驼', giraffe: '长颈鹿',
  // 第3章 森林
  monkey: '猴子', panda: '熊猫', deer: '小鹿', moose: '驼鹿',
  kangaroo: '袋鼠', koala: '考拉', squirrel: '松鼠', raccoon: '浣熊',
  // 第4章 小动物
  rabbit: '兔子', cat: '小猫', dog: '小狗', otter: '水獭',
  badger: '獾', beaver: '河狸', hedgehog: '刺猬', skunk: '臭鼬',
  // 第5章 海洋
  fish: '小鱼', whale: '鲸鱼', dolphin: '海豚', octopus: '章鱼',
  jellyfish: '水母', turtle: '海龟', crab: '螃蟹', seahorse: '海马',
  // 第6章 综合
  hippo: '河马', rhino: '犀牛', elephant: '大象', frog: '青蛙',
  seal: '海豹', owl: '猫头鹰', goose: '白鹅', penguin: '企鹅'
}

/** 绘制机制遮罩 */
export function drawMechanicOverlay(
  ctx: CanvasRenderingContext2D,
  mechanicType: string,
  canvasSize: number
): void {
  const s = canvasSize
  const half = s / 2
  ctx.globalAlpha = 0.55

  switch (mechanicType) {
    case 'moody': {
      ctx.fillStyle = '#37474f'
      ctx.beginPath()
      const pts = [
        [0, half], [s*0.12, half*0.4], [s*0.25, half*0.25], [half, half*0.1],
        [s*0.75, half*0.25], [s*0.88, half*0.4], [s, half],
        [s*0.9, half*0.75], [s, s*0.85], [s*0.85, s],
        [0, s], [s*0.1, s*0.75]
      ]
      ctx.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#ffd54f'
      ctx.beginPath()
      ctx.moveTo(s*0.42, s*0.35)
      ctx.lineTo(s*0.48, s*0.55)
      ctx.lineTo(s*0.45, s*0.55)
      ctx.lineTo(s*0.52, s*0.75)
      ctx.lineTo(s*0.46, s*0.55)
      ctx.lineTo(s*0.50, s*0.55)
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'vine': {
      ctx.fillStyle = '#388e3c'
      const cx = half, cy = half
      for (let i = 0; i < 5; i++) {
        const angle = (i * 72 + 15) * Math.PI / 180
        ctx.beginPath()
        const x1 = cx + Math.cos(angle) * half * 0.25
        const y1 = cy + Math.sin(angle) * half * 0.25
        const x2 = cx + Math.cos(angle) * half * 0.9
        const y2 = cy + Math.sin(angle) * half * 0.9
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.lineWidth = 3
        ctx.strokeStyle = '#2e7d32'
        ctx.stroke()
      }
      ctx.fillStyle = '#66bb6a'
      for (let i = 0; i < 3; i++) {
        const angle = (i * 120) * Math.PI / 180
        const bx = cx + Math.cos(angle) * half * 0.6
        const by = cy + Math.sin(angle) * half * 0.6
        ctx.beginPath()
        ctx.ellipse(bx, by, 6, 3, angle, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'sleepy': {
      ctx.fillStyle = 'rgba(30,30,60,0.3)'
      ctx.fillRect(0, 0, s, s)
      ctx.fillStyle = '#e3f2fd'
      ctx.globalAlpha = 0.7
      ;[[s*0.65, s*0.25, 6],[s*0.78, s*0.12, 8],[s*0.88, s*0.02, 5]].forEach(([x,y,r]) => {
        ctx.beginPath()
        ctx.arc(x as number, y as number, r as number, 0, Math.PI*2)
        ctx.fill()
      })
      ctx.globalAlpha = 0.55
      break
    }
    case 'hidden': {
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, s, s)
      ctx.fillStyle = '#ffd700'
      ctx.font = `bold ${s*0.6}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('?', half, half)
      break
    }
    case 'bubble': {
      ctx.fillStyle = 'rgba(144,202,249,0.4)'
      ctx.beginPath()
      ctx.arc(half, half, half*0.85, 0, Math.PI*2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.beginPath()
      ctx.arc(half*0.65, half*0.55, half*0.2, 0, Math.PI*2)
      ctx.fill()
      break
    }
  }
  ctx.globalAlpha = 1
}

/** 绘制机制解除后的效果 */
export function drawMechanicResolved(
  ctx: CanvasRenderingContext2D,
  mechanicType: string,
  canvasSize: number
): void {
  if (mechanicType !== 'moody' && mechanicType !== 'sleepy') return
  const s = canvasSize
  const half = s / 2
  ctx.fillStyle = '#ffd700'
  ctx.globalAlpha = 0.6
  for (let i = 0; i < 4; i++) {
    const angle = (i * 90) * Math.PI / 180
    const x = half + Math.cos(angle) * half * 0.35
    const y = half + Math.sin(angle) * half * 0.35
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI*2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}