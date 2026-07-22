/**
 * 像素风 Q 萌动物绘制系统（24×24 版）
 * 纯逻辑层，用 Canvas API 程序化绘制 12 种动物
 *
 * v3 改动：
 *  - 16×16 → 24×24 像素网格，细节更丰富
 *  - 每种动物有独特体型轮廓（圆/方/椭圆/流线/S形等）
 *  - 每种动物有独特配色+纹理（条纹/斑点/渐变/双色等）
 *  - variant 1：戴小帽子
 *
 * 像素字符含义：
 *  '.' 透明
 *  'K' 黑  'W' 白  'M' 主色  'S' 次色(暗)  'L' 次色(亮)
 *  'P' 粉色  'E' 眼睛  'B' 嘴  'O' 描边  'N' 鼻
 *  'T' 纹理色(条纹/斑点)  'C' 装饰色(项圈/蝴蝶结)  'H' 喷水/高光
 */
import type { AnimalType } from '@game/types'

/** 像素尺寸 */
export const PIXEL_SIZE = 24

/** 调色板：字符 -> 颜色 */
export interface Palette {
  K: string
  W: string
  M: string
  S: string
  L: string
  P: string
  E: string
  B: string
  O: string
  N: string
  T: string
  C: string
  H: string
}

/** 动物像素图定义 */
interface AnimalSprite {
  palette: Palette
  pixels: string[]
}

/** 通用调色板基础色（M/S/L 由各动物单独覆盖） */
const BASE: Palette = {
  K: '#1a1a1a',
  W: '#ffffff',
  M: '#cccccc',
  S: '#999999',
  L: '#eeeeee',
  P: '#ffb3c1',
  E: '#1a1a1a',
  B: '#c0392b',
  O: '#0a0a0a',
  N: '#e74c3c',
  T: '#000000',
  C: '#e91e63',
  H: '#81d4fa'
}

/** 12 种动物的像素图（24×24）- 独特体型+独特配色纹理 */
const SPRITES: Record<AnimalType, AnimalSprite> = {
  // 绵羊：圆形蓬松白色身体 + 卷毛纹理 + 黑脸
  sheep: {
    palette: {
      ...BASE,
      M: '#f5f0e8',  // 蓬松毛色
      S: '#d4cfc5',  // 阴影
      L: '#fffaf0',  // 亮部
      T: '#c8b896',  // 卷毛纹理点
      K: '#2c2c2c'   // 脸部黑
    },
    pixels: [
      '........................',
      '.....OO..........OO.....',
      '....OMMMO........OMMMO..',
      '...OMTLTMO......OMTLTMO.',
      '..OMTLTLTMO....OMTLTLTMO',
      '..OMTLTLTLMO..OMTLTLTLMO',
      '.OMTLTLTLTLMOOOMTLTLTLMO',
      '.OMTLTLTLTLTLWTLTLTLTLMO',
      '.OMTLTLTLTLTLWTLTLTLTLMO',
      '.OMTLTLKKKLTLWTLTLTLTLMO',
      '.OMTLTLKEEKLTLWTLTLTLTMO',
      '.OMTLTLKEEKLTLWTLTLTLTMO',
      '.OMTLKLKNKKLTLWTLTLTLMO.',
      '..OMTLKLLKLTLWTLTLTLMO..',
      '..OMTLTLTLTLWTLTLTLTMO..',
      '...OMTLTLTLTLWTLTLTMO...',
      '....OMTLTLTLTLWTLTMO....',
      '.....OMTLTLTLTLWTMO.....',
      '......OMTLTLTLTMO.......',
      '.......OOMMMMOO........',
      '........KOOOK..........',
      '........KOOOK..........',
      '........KKOKK..........',
      '........................'
    ]
  },

  // 小鸡：圆胖黄色 + 橙色尖嘴 + 三角冠
  chicken: {
    palette: {
      ...BASE,
      M: '#ffd54f',  // 主黄
      S: '#f9a825',  // 暗黄
      L: '#fff176',  // 亮黄
      N: '#ff6f00'   // 嘴橙
    },
    pixels: [
      '........................',
      '.........OO.............',
      '........ONNO............',
      '.........OO.............',
      '.......OOMMO............',
      '......OMMMMMO...........',
      '.....OMLMMMMMNO.........',
      '....OMMMMMMMMMNO........',
      '...OMLMMMMMMMMMMNO......',
      '..OMMMMMMMMMMMMMMMNO....',
      '.OMLMMMMMMMMMMMMMMMNO...',
      '.OMMMMEEWMMMMMEEWMMMNO..',
      '.OMMMMMMNMMMMMMNMMMMMNO.',
      '.OMMMMMMNWMMMMMNWMMMMNO.',
      '.OMMMMMLLMMMMMLLMMMMNO..',
      '.OMMMMMMMMMMMMMMMMMMNO..',
      '..OMMMMMMMMMMMMMMMMNO...',
      '...OMMMMMMMMMMMMMMNO....',
      '....OOMMMMMMMMMMMNO.....',
      '.....NNNN....NNNN.......',
      '.....NNOO....OONN.......',
      '.....KOOO....OOOK.......',
      '......KK......KK........',
      '........................'
    ]
  },

  // 小猫：椭圆橙色 + 竖三角耳 + 条纹 + 长尾
  cat: {
    palette: {
      ...BASE,
      M: '#ffa726',  // 主橙
      S: '#ef6c00',  // 暗橙
      L: '#ffb74d',  // 亮橙
      T: '#3e2723',  // 条纹黑棕
      P: '#ff8a80'   // 鼻粉
    },
    pixels: [
      '........................',
      '...O.O..........O.O.....',
      '..OTPTO........OTPTO....',
      '..OTMTO........OTMTO....',
      '.OTMMMTO......OTMMMTO...',
      '.OTMMMMMTOOOOTMMMMMTO...',
      'OTMMMMMMMMMMMMMMMMMMTO..',
      'OTMLMMMMMMMMMMMMMMMTO...',
      'OTMMMEEWMMMMMEEWMMMTO...',
      '.OTMMMMPNPMMMMMMMMTO....',
      '.OTMMMMMMMMMMMMMMTO.....',
      '.OTMTMMMMMMMMMMMMTO.....',
      '.OTMMTMMMMMMMMMMTO......',
      '.OTMMMTMMMMMMMMTO.......',
      '..OTMMMTMMMMMMTO........',
      '..OTMMMMTMMMMTO.........',
      '...OTMMMMMMTO...........',
      '....OTMMMMTO............',
      '.....OTMMTO.............',
      '......OOTO..............',
      '.......OO...............',
      '......KOOOK.............',
      '......KOOOK.............',
      '........................'
    ]
  },

  // 小狗：方形棕色 + 垂耳 + 黑鼻 + 项圈
  dog: {
    palette: {
      ...BASE,
      M: '#b8860b',  // 主棕
      S: '#8d6e08',  // 暗棕
      L: '#daa520',  // 亮棕
      C: '#d32f2f',  // 项圈红
      N: '#1a1a1a'   // 鼻黑
    },
    pixels: [
      '........................',
      '...OOO..........OOO.....',
      '..OCCCO........OCCCO....',
      '..OCCCO........OCCCO....',
      '..OCCCO........OCCCO....',
      '.OCCCCCOOOOOOOOCCCCCO...',
      'OCCCCCCCCCCCCCCCCCCCCCO.',
      'OCCCCCCCCCCCCCCCCCCCCCO.',
      'OCCMLMMMMMMMMMMMMLMCCO..',
      'OCCMMMEEWMMMMMEEWMMCCO..',
      '.OCCMMMMNWMMMMMNWMCCO...',
      '.OCCMMMMMNWMMMNMMCCO....',
      '.OCCMMMMMMMMMMMMCCO.....',
      '.OCCMMMMMMMMMMMCCO......',
      '..OCCMMMMMMMMMCCO.......',
      '..OCCMMMMMMMMCCO........',
      '...OCCMMMMMMCCO.........',
      '....OCCMMMMCCO..........',
      '.....OCCMMCCO...........',
      '......OOOOOO............',
      '.....KOOOOOOK...........',
      '.....KOOOOOOK...........',
      '......KKKKKK............',
      '........................'
    ]
  },

  // 兔子：高个白色 + 超长耳 + 粉鼻 + 圆球尾
  rabbit: {
    palette: {
      ...BASE,
      M: '#f5f5f5',  // 主白
      S: '#e0e0e0',  // 阴影
      L: '#ffffff',  // 亮白
      P: '#ffb3c1',  // 鼻粉
      T: '#e0e0e0'   // 耳内粉
    },
    pixels: [
      '....O....O..............',
      '...OPO..OPO.............',
      '...OPO..OPO.............',
      '...OPO..OPO.............',
      '...OPO..OPO.............',
      '...OPO..OPO.............',
      '....OOOOOO..............',
      '...OOMMMMMNO............',
      '..OMMMMMMMMMNO..........',
      '.OMLMMMMMMMMMNO.........',
      '.OMMMMMMMMMMMMNO........',
      '.OMMEEWMMMMMEEWNO.......',
      '.OMMMMPPMMMMMMMNO.......',
      '.OMMMMMMMMMMMMMNO.......',
      '.OMLMMMMMMMMMMMNO.......',
      '.OMMMMMMMMMMMMMNO.......',
      '..OMMMMMMMMMMMNO........',
      '...OMMMMMMMMMNO.........',
      '....OMMMMMMMNO..........',
      '....OOWWWWWOO...........',
      '.....OWWWWWO............',
      '.....KOOOOOK............',
      '.....KOOOOOK............',
      '........................'
    ]
  },

  // 仓鼠：短胖橙白色 + 圆耳 + 大颊囊
  hamster: {
    palette: {
      ...BASE,
      M: '#ffcc80',  // 主橙
      S: '#ffa000',  // 暗橙
      L: '#ffe0b2',  // 亮橙
      W: '#ffffff',  // 肚白
      P: '#ff8a80'   // 鼻粉
    },
    pixels: [
      '........................',
      '.....OO......OO.........',
      '....OPPO....OPPO........',
      '...OPPPPO..OPPPPO.......',
      '..OPPPPPPOOPPPPPPO......',
      '..OPPPPPPPPPPPPPPO......',
      '.OPPPPPPPPPPPPPPPPO.....',
      'OPPPMLPPPPPPPPPLMPPPO...',
      'OPPPMMLPPPPPPPLMMPPPO...',
      'OPPMMEEPPPPPPPEEMPPPO...',
      'OPPMMMPPPNPPPPPMMMPPPO..',
      'OPPMMMPPPNWPPPPMMMPPPO..',
      'OPPMMMMPPWWPPPMPPPPO....',
      'OPPMMMMMWWWWPPPMMPPPO...',
      '.OPPMMMWWWWWWPMMPPPO....',
      '.OPPMMMWWWWWWPMMPO......',
      '..OPPMMWWWWWWPMPO.......',
      '...OPPMWWWWWPMO.........',
      '....OPPMWWWO............',
      '.....OOOOOO.............',
      '....KOOOOOOK............',
      '....KOOOOOOK............',
      '.....KKKKKK.............',
      '........................'
    ]
  },

  // 老虎：椭圆橙色 + 黑条纹 + 圆耳 + 凶眉
  tiger: {
    palette: {
      ...BASE,
      M: '#ff9800',  // 主橙
      S: '#e65100',  // 暗橙
      L: '#ffb74d',  // 亮橙
      T: '#1a1a1a',  // 条纹黑
      K: '#ffffff'   // 凶眉白
    },
    pixels: [
      '........................',
      '...OO.O........O.OO.....',
      '..OTMMTO......OTMMTO....',
      '..OTMMTO......OTMMTO....',
      '.OTMMMMTOOOOOTMMMMTO....',
      'OTMMMMMMMMMMMMMMMMMTO...',
      'OTMLMMMMMMMMMMMMMMMTO...',
      'OTMMKEMMMMKEMMMMMMMTO...',
      'OTMMKEMMMMKEMMMMMMMTO...',
      '.OTMMMMMENMMMMMMMMTO....',
      '.OTMMMTMMMMMMMMMMTO.....',
      '.OTMMMMMMMMMMMMMTO......',
      '.OTMMTMMMMMMMMMTO.......',
      '.OTMMMTMMMMMMMMTO.......',
      '.OTMMMMTMMMMMMTO........',
      '..OTMMMMTMMMMTO.........',
      '..OTMMMMMMTO............',
      '...OTMMMMTO.............',
      '....OTMMTO..............',
      '.....OOTO...............',
      '....KOOOOK..............',
      '....KOOOOK..............',
      '.....KKKKK..............',
      '........................'
    ]
  },

  // 小熊：棕色 + 圆耳 + 圆肚 + 米色胸
  bear: {
    palette: {
      ...BASE,
      M: '#a1887f',  // 主棕
      S: '#6d4c41',  // 暗棕
      L: '#bcaaa4',  // 亮棕
      W: '#fff8e1',  // 胸米色
      N: '#1a1a1a'   // 鼻黑
    },
    pixels: [
      '........................',
      '...OOO..........OOO.....',
      '..OMMMO........OMMMO....',
      '..OMMMO........OMMMO....',
      '.OMMMMMOOOOOOOOMMMMO....',
      'OMMMMMMMMMMMMMMMMMMMO...',
      'OMMLMMMMMMMMMMMMMMMLO...',
      'OMMMMEEWMMMMMEEWMMMMO...',
      'OMMMMMMNWMMMMMNWMMMMO...',
      'OMMMMMMMNWMMMNMMMMMMO...',
      'OMMMMMMMMMMMMMMMMMMMO...',
      'OMMMMWWMMMMMMMMWWWMMO...',
      'OMMMMWWWMMMMMMMWWWWMO...',
      'OMMMMWWWWMMMMMWWWWWMO...',
      '.OMMWWWWWMMMMWWWWWWMO...',
      '.OMMWWWWWWMMMWWWWWWMO...',
      '..OMWWWWWWMMMWWWWWWMO...',
      '...OMWWWWWMMMWWWWMMO....',
      '....OMWWWMMMMMWWMMO.....',
      '.....OOMMMMMMMMMMO......',
      '.....KOOOOOOOOOK........',
      '.....KOOOOOOOOOK........',
      '......KKKKKKKKKK........',
      '........................'
    ]
  },

  // 小鱼：流线型蓝色 + 三角尾鳍 + 鳞片
  fish: {
    palette: {
      ...BASE,
      M: '#42a5f5',  // 主蓝
      S: '#1565c0',  // 暗蓝
      L: '#90caf9',  // 亮蓝
      T: '#0d47a1',  // 鳞片深蓝
      E: '#ffffff'   // 眼白
    },
    pixels: [
      '........................',
      '..................OO....',
      '.................OMMMO..',
      '................OMMMMO..',
      '...............OMMMMMO..',
      '......OOOOOOOOOMMMMMMO..',
      '.....OMMMMMMMMMMMMMMMO..',
      '....OMMLMMMMMMMMMMMMMO..',
      '...OMMLLMMMMMMMMMMMMO...',
      '..OMMLLLMMMMMMMMMMMO....',
      '.OMMLLTLMMMMMMMMMMO.....',
      'OMMLLTTLMMMMMMMMMO......',
      'OMMEEWMMMMMMMMMMO.......',
      'OMMMMMMMMMMMMMMO........',
      'OMMMMMMMMMMMMO..........',
      '.OMMMMMMMMMMO...........',
      '..OMMMMMMMO.............',
      '...OMMMMMO..............',
      '....OMMMO...............',
      '.....OOO................',
      '......O.................',
      '........................',
      '........................',
      '........................'
    ]
  },

  // 鲸鱼：大椭圆蓝紫色 + 喷水 + 白肚
  whale: {
    palette: {
      ...BASE,
      M: '#5c6bc0',  // 主蓝紫
      S: '#3949ab',  // 暗蓝紫
      L: '#9fa8da',  // 亮蓝紫
      W: '#ffffff',  // 白肚
      H: '#81d4fa'   // 喷水蓝
    },
    pixels: [
      '.........HH.............',
      '........HOOH............',
      '.........OO.............',
      '........HOO.............',
      '.......HOO..............',
      '.....OOMMMNO............',
      '....OMMMMMMMNO..........',
      '..OMMMMMMMMMMMNO........',
      '.OMLMMMMMMMMMMMMNO......',
      'OMMLMMMMMMMMMMMMMMNO....',
      'OMMEEWMMMMMMMMMMMMMNO...',
      'OMMMMMMMMMMMMMMMMMMMNO..',
      'OMMMMWWMMMMMMMMMMMMMNO..',
      'OMMMMWWWMMMMMMMMMMMMNO..',
      '.OMMWWWWMMMMMMMMMMNO....',
      '.OMMWWWWWMMMMMMMMNO.....',
      '..OMWWWWWWMMMMMMNO......',
      '...OMWWWWWWMMMMNO.......',
      '....OMWWWWWWMMNO........',
      '.....OMWWWWWMMO.........',
      '......OMWWWMMO..........',
      '.......OOMMMO...........',
      '........OOOO............',
      '........................'
    ]
  },

  // 小鸭：椭圆黄色 + 扁平橙嘴 + 翅膀
  duck: {
    palette: {
      ...BASE,
      M: '#ffeb3b',  // 主黄
      S: '#f9a825',  // 暗黄
      L: '#fff59d',  // 亮黄
      N: '#ff6f00',  // 嘴橙
      W: '#ffffff'   // 翅白
    },
    pixels: [
      '........................',
      '.......OO...............',
      '......ONNO..............',
      '.....ONNNNO.............',
      '....OMMMMMO.............',
      '...OMMMMMMMNO...........',
      '..OMLMMMMMMMNO..........',
      '.OMMMMMMMMMMMNO.........',
      'OMMMEEWMMMMMMMNO........',
      'OMMMMMMMMMMMMMNO........',
      'OMMMMWMMMMMMMMNO........',
      'OMMMMWWWMMMMMMNO........',
      'OMMMMWWWWMMMMNO.........',
      'OMMMMWWWWMMMNO..........',
      '.OMMMWWWWMMNO...........',
      '.OMMMMWWMMNO............',
      '..OMMMMMMNO.............',
      '...OMMMMNO..............',
      '....NNNNNO..............',
      '....NNOOOO..............',
      '....KOOOOO..............',
      '....KOOOOO..............',
      '.....KKKKK..............',
      '........................'
    ]
  },

  // 白鹅：S形长脖 + 白色 + 橙脚
  goose: {
    palette: {
      ...BASE,
      M: '#f5f5f5',  // 主白
      S: '#bdbdbd',  // 阴影
      L: '#ffffff',  // 亮白
      N: '#ff6f00',  // 嘴橙
      W: '#e0e0e0'   // 翅灰
    },
    pixels: [
      '..............OO........',
      '..............ONO.......',
      '..............ONO.......',
      '..............OO........',
      '.............OWWO.......',
      '............OMMMO.......',
      '...........OMMMMO.......',
      '..........OMMMMMO.......',
      '.........OMMMMMMO.......',
      '........OMMMMMMMO.......',
      '.......OMMMMMMMMO.......',
      '......OMMMMMMMMMO.......',
      '.....OMMMMMMMMMMO.......',
      'OOMLMMMMMMMMMMMMMO......',
      'OMMMMMMMMMMMMMMMMNO.....',
      'OMMEEWMMMMMMMMMMMNO.....',
      'OMMMMMMMMMMMMMMMMNO.....',
      '.OMMMMMMMMMMMMMMNO......',
      '.OMMWWMMMMMMMMMNO.......',
      '..OMWWWMMMMMMMNO........',
      '...OMWMMMMMMMNO.........',
      '....NNOOOOONN...........',
      '....NNOOOOONN...........',
      '.....KKKKKKKK...........'
    ]
  }
}

/**
 * 绘制单个动物到 Canvas 上下文
 *
 * @param ctx Canvas 2D 上下文
 * @param animal 动物类型
 * @param variant 变体（1=戴帽子）
 * @param frame 帧：'idle' | 'hover'
 * @param scale 缩放倍数（1 = 24px，2 = 48px...）
 * @param offsetX 画布内 x 偏移
 * @param offsetY 画布内 y 偏移
 */
export function drawAnimal(
  ctx: CanvasRenderingContext2D,
  animal: AnimalType,
  variant: 0 | 1,
  frame: 'idle' | 'hover',
  scale: number,
  offsetX: number,
  offsetY: number
): void {
  const sprite = SPRITES[animal]
  if (!sprite) return

  const pal = sprite.palette

  // hover 帧：整体上移 2px（弹跳效果更明显）
  const bounceY = frame === 'hover' ? -2 : 0

  // 绘制像素图
  for (let row = 0; row < PIXEL_SIZE; row++) {
    const line = sprite.pixels[row]
    if (!line) continue
    for (let col = 0; col < PIXEL_SIZE; col++) {
      const ch = line[col]
      if (ch === '.' || ch === ' ') continue

      let color: string | undefined
      switch (ch) {
        case 'K': color = pal.K; break
        case 'W': color = pal.W; break
        case 'M': color = pal.M; break
        case 'S': color = pal.S; break
        case 'L': color = pal.L; break
        case 'P': color = pal.P; break
        case 'E': color = pal.E; break
        case 'B': color = pal.B; break
        case 'O': color = pal.O; break
        case 'N': color = pal.N; break
        case 'T': color = pal.T; break
        case 'C': color = pal.C; break
        case 'H': color = pal.H; break
        default: color = undefined
      }
      if (!color) continue

      // hover 帧眼睛变成 ^^（开心眼，用粉色）
      if (frame === 'hover' && ch === 'E') {
        color = pal.P
      }

      ctx.fillStyle = color
      ctx.fillRect(
        offsetX + col * scale,
        offsetY + (row + bounceY) * scale,
        scale,
        scale
      )
    }
  }

  // variant 1：戴一顶小帽子（头顶位置）
  if (variant === 1) {
    drawHat(ctx, scale, offsetX, offsetY + bounceY)
  }
}

/**
 * 绘制小帽子（variant 1 专用）
 */
function drawHat(
  ctx: CanvasRenderingContext2D,
  scale: number,
  offsetX: number,
  offsetY: number
): void {
  // 帽子像素（5×4）
  const hat = [
    '.RRR.',
    'RRRRR',
    'RRRRR',
    'KKKKK'
  ]
  const hatColor = '#e91e63'
  const hatShadow = '#ad1457'
  const hatBrim = '#1a1a1a'
  const startCol = 14
  const startRow = 1

  for (let row = 0; row < hat.length; row++) {
    for (let col = 0; col < hat[row].length; col++) {
      const ch = hat[row][col]
      if (ch === '.') continue
      if (ch === 'K') ctx.fillStyle = hatBrim
      else if (row === 0) ctx.fillStyle = hatShadow
      else ctx.fillStyle = hatColor
      ctx.fillRect(
        offsetX + (startCol + col) * scale,
        offsetY + (startRow + row) * scale,
        scale,
        scale
      )
    }
  }
}

/**
 * 获取动物的背景色（用于牌面背景）
 */
export function getAnimalBgColor(animal: AnimalType): string {
  const sprite = SPRITES[animal]
  return sprite ? sprite.palette.M + '33' : '#ffffff33'
}

/**
 * 动物中文名映射
 */
export const ANIMAL_NAMES: Record<AnimalType, string> = {
  sheep: '绵羊',
  chicken: '小鸡',
  cat: '小猫',
  dog: '小狗',
  rabbit: '兔子',
  hamster: '仓鼠',
  tiger: '老虎',
  bear: '小熊',
  fish: '小鱼',
  whale: '鲸鱼',
  duck: '小鸭',
  goose: '白鹅'
}
