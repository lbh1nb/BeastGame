/**
 * 像素风 Q 萌动物绘制系统（32×32 扁平方块版）
 * 纯逻辑层，用 Canvas API 程序化绘制 30 种动物
 *
 * v4 改动：
 *  - 24×24 → 32×32 像素网格，体型更大、特征更突出
 *  - 12 种 → 20 种动物，主色均匀分布色环，相邻色相差≥30°
 *  - 去掉 variant（戴帽子）变体，每种动物唯一模型
 *  - 扁平方块风格：去掉圆形描边 'O'，纯色块填充
 *  - 每种动物有独特体型轮廓 + 独特识别特征，保证一眼可辨
 *
 * v5 新增：
 *  - 20 种 → 30 种动物（马、牛、狼、鹰、猴、鹿、猫头鹰、天鹅、海豚、海龟）
 *  - 新增 drawMechanicOverlay / drawMechanicResolved 机制遮罩函数
 *
 * 像素字符含义：
 *  '.' 透明
 *  'K' 黑  'W' 白  'M' 主色  'S' 次色(暗)  'L' 次色(亮)
 *  'P' 粉色  'E' 眼睛  'B' 嘴红  'N' 嘴橙  'T' 纹理色
 *  'C' 装饰色(项圈/羽冠)  'H' 喷水/高光
 */
import type { AnimalType } from '@game/types'

/** 像素尺寸 */
export const PIXEL_SIZE = 32

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
  N: '#ff6f00',
  T: '#000000',
  C: '#e91e63',
  H: '#81d4fa'
}

/**
 * 20 种动物的像素图（32×32 扁平方块）
 * 按章节分组，主色均匀分布色环
 */
const SPRITES: Record<AnimalType, AnimalSprite> = {
  // ============ 第1章 家畜 ============

  // 绵羊：蓬松米白羊毛团 + 黑脸 + 黑耳
  sheep: {
    palette: {
      ...BASE,
      M: '#f5f0e8',  // 蓬松毛色（米白）
      S: '#d4cfc5',  // 毛阴影
      L: '#fffaf0',  // 毛亮部
      T: '#c8b896',  // 卷毛纹理点
      K: '#2c2c2c'   // 脸黑
    },
    pixels: [
      '................................',
      '................................',
      '.......MM..............MM.......',
      '......MMLM............MMLM......',
      '.....MMLTLM..........MMLTLM.....',
      '....MMLTLTLM........MMLTLTLM....',
      '....MMLTLTLM........MMLTLTLM....',
      '...MMLTLTLTLM......MMLTLTLTLM...',
      '..MMLTLTLTLTLM....MMLTLTLTLTLM..',
      '..MMLTLTLTLTLM....MMLTLTLTLTLM..',
      '.MMLTLTLTLTLTLM..MMLTLTLTLTLTLM.',
      '.MMLTLTLTLTLTLLLLLTLTLTLTLTLTLM.',
      'MMLTLTLTLTLTLTLWTLTLTLTLTLTLTLM.',
      'MMLTLTLKKKLTLTLWTLTLTLTLTLTLTLM.',
      '.MMLTLTLKEEKLTLTLWTLTLTLTLTLTLM.',
      '.MMLTLTLKEEKLTLTLWTLTLTLTLTLTLM.',
      '.MMLTLKLKNKKLTLTLWTLTLTLTLTLTLM.',
      '.MMLTKLLKLTLTLTLWTLTLTLTLTLTLM..',
      '.MMLTLTLTLTLTLTLWTLTLTLTLTLTLM..',
      '..MMLTLTLTLTLTLTLWTLTLTLTLTLM...',
      '..MMLTLTLTLTLTLTLWTLTLTLTLTLM...',
      '...MMLTLTLTLTLTLTLWTLTLTLTLM....',
      '....MMLTLTLTLTLTLTLWTLTLTLM.....',
      '.....MMLTLTLTLTLTLTLWTLTLM......',
      '......MMLTLTLTLTLTLTLWTLM.......',
      '.......MMLTLTLTLTLTLTWLM........',
      '........MMLTLTLTLTLTWLM.........',
      '.........MMLTLTLTLTWLM..........',
      '..........MMLTLTLTWLM...........',
      '...........MMLTLTWLM............',
      '............MMLTWLM.............',
      '.............MMMMLM.............',
    ]
  },

  // 小猪：粉色胖身 + 大鼻孔 + 三角耳 + 卷尾
  pig: {
    palette: {
      ...BASE,
      M: '#f48fb1',  // 主粉
      S: '#ec6090',  // 暗粉
      L: '#ffc1d4',  // 亮粉
      K: '#1a1a1a',  // 鼻孔黑
      P: '#ff8a80'   // 鼻头粉红
    },
    pixels: [
      '................................',
      '................................',
      '...MM......................MM...',
      '..MLLM....................MLLM..',
      '..MLLM....................MLLM..',
      '..MLLM....................MLLM..',
      '..MLLLLM..MMMMMMMMMMMM..MLLLLM..',
      'MLLLLLLMMMMLLLLLLLLLLMMMMLLLLLM.',
      'MLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLM',
      'MLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLM',
      'MLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLM',
      'MLLLLEELLLLLLLLLLLLLLLLLLEELLLLM',
      'MLLLLEELLLLLLLLLLLLLLLLLLEELLLLM',
      'MLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLM',
      'MLLLLLLLLPPPPPPPPPPPLLLLLLLLLLM.',
      'MLLLLLLLPPKKPPPPKKPPPLLLLLLLLLM.',
      '.MLLLLLLPPKKPPPPKKPPPLLLLLLLLLM.',
      '.MLLLLLLPPPPPPPPPPPPLLLLLLLLLM..',
      '..MLLLLLLLLLLLLLLLLLLLLLLLLLLM..',
      '...MLLLLLLLLLLLLLLLLLLLLLLLLM...',
      '...MLLLLLLLLLLLLLLLLLLLLLLLLM...',
      '....MLLLLLLLLLLLLLLLLLLLLLLM....',
      '.....MLLLLLLLLLLLLLLLLLLLLM.....',
      '......MLLLLLLLLLLLLLLLLLLM......',
      '.......MLLLLLLLLLLLLLLLLM.......',
      '........MLLLLLLLLLLLLLLM........',
      '.........MLLLLLLLLLLLLM.........',
      '..........MLLLLLLLLLLM..........',
      '...........MLLLLLLLLM...........',
      '............MLLLLLLM............',
      '.............MLLLLM.............',
      '..............MLLM..............',
    ]
  },

  // 小鸡：柠檬黄圆胖身 + 红冠 + 橙尖嘴
  chicken: {
    palette: {
      ...BASE,
      M: '#fff176',  // 主柠檬黄
      S: '#fdd835',  // 暗黄
      L: '#ffff9c',  // 亮黄
      B: '#c0392b',  // 红冠
      N: '#ff6f00'   // 嘴橙
    },
    pixels: [
      '................................',
      '................................',
      '...............BB...............',
      '..............BBBB..............',
      '..............BBBB..............',
      '..............BBBB..............',
      '..............NNNN..............',
      '............LMMMMML.............',
      '...........LMMMMMMML............',
      '..........LMMMMMMMMML...........',
      '.........LMMMMMMMMMMML..........',
      '........LMMMMMMMMMMMMML.........',
      '.......LMMMMMMMMMMMMMMML........',
      '......LMMMMMMMMMMMMMMMMML.......',
      '.....LMMMMMMMMMMMMMMMMMMML......',
      '...LMMMMMMMEELMMMMMEELMMMMML....',
      '...LMMMMMMMEELMMMMMEELMMMMML....',
      '...LMMMMMMMMNNLMMMMNNMMMMMML....',
      '...LMMMMMMMMNNWMMMNNWMMMMMML....',
      '....LMMMMMMMLLMMMMMLLMMMMMML....',
      '....LMMMMMMMMMMMMMMMMMMMMMML....',
      '.....LMMMMMMMMMMMMMMMMMMMML.....',
      '......LMMMMMMMMMMMMMMMMMML......',
      '.......LMMMMMMMMMMMMMMMML.......',
      '........LMMMMMMMMMMMMMML........',
      '.........LMMMMMMMMMMMML.........',
      '..........LMMMMMMMMMML..........',
      '...........LMMMMMMML............',
      '............LMMMMML.............',
      '.............NNNNN..............',
      '.............KKKKK..............',
      '................................',
    ]
  },

  // 小狗：浅棕方身 + 垂耳 + 黑鼻 + 红项圈
  dog: {
    palette: {
      ...BASE,
      M: '#bcaaa4',  // 主浅棕
      S: '#8d6e63',  // 暗棕
      L: '#d7ccc8',  // 亮棕
      C: '#d32f2f',  // 项圈红
      K: '#1a1a1a'   // 鼻黑
    },
    pixels: [
      '................................',
      '................................',
      '...MMM....................MMM...',
      '..MLLM....................MLLM..',
      '..MLLM....................MLLM..',
      '..MLLM....................MLLM..',
      '.MLLLM....................MLLLM.',
      'MLLLLLMMMMMMMMMMMMMMMMMMMMMLLLLM',
      'MLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLM',
      'MLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLM',
      'MLLMEELLLLLLLLLLLLLLLLLLLLEELLLM',
      'MLLMEELLLLLLLLLLLLLLLLLLLLEELLLM',
      'MLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLM',
      'MLLLLLLLLLLKLLLLLLLLKLLLLLLLLLM.',
      'MLLLLLLLLLKKKKLLLLKKKKLLLLLLLLM.',
      'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC.',
      'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC.',
      '.MLLLLLLLLLLLLLLLLLLLLLLLLLLLM..',
      '.MLLLLLLLLLLLLLLLLLLLLLLLLLLLM..',
      '..MLLLLLLLLLLLLLLLLLLLLLLLLLLM..',
      '..MLLLLLLLLLLLLLLLLLLLLLLLLLLM..',
      '...MLLLLLLLLLLLLLLLLLLLLLLLLM...',
      '....MLLLLLLLLLLLLLLLLLLLLLLM....',
      '.....MLLLLLLLLLLLLLLLLLLLLM.....',
      '......MLLLLLLLLLLLLLLLLLLM......',
      '.......MLLLLLLLLLLLLLLLLM.......',
      '........MLLLLLLLLLLLLLLM........',
      '.........MLLLLLLLLLLLLM.........',
      '..........MLLLLLLLLLLM..........',
      '...........MLLLLLLLLM...........',
      '............MLLLLLLM............',
      '.............MLLLLM.............',
    ]
  },

  // ============ 第2章 野生 ============

  // 老虎：椭圆橙色 + 黑条纹 + 圆耳 + 凶眉
  tiger: {
    palette: {
      ...BASE,
      M: '#ff9800',  // 主橙
      S: '#e65100',  // 暗橙
      L: '#ffb74d',  // 亮橙
      T: '#1a1a1a',  // 条纹黑
      W: '#ffffff'   // 凶眉白
    },
    pixels: [
      '................................',
      '................................',
      '...MMM....................MMM...',
      '..MTMTM..................MTMTM..',
      '..MTMTM..................MTMTM..',
      '.MTMMMTM................MTMMMTM.',
      'MTMMMMMTMMMMMMMMMMMMMMMMTMMMMMTM',
      'MTMMMMMMMMMMMMMMMMMMMMMMMMMMMMTM',
      'MTMLMMMMMMMMMMMMMMMMMMMMMMMMLMTM',
      'MTMMKWEMMMMMMMMMMMMMMMMMEKWMMTM.',
      'MTMMKWEMMMMMMMMMMMMMMMMMEKWMMTM.',
      '.MTMMMMMENNNNNNNNNNEMMMMMEEETM..',
      '..MTMMTMMMMMMMMMMMMMMMMMMTMETM..',
      '..MTMMMTMMMMMMMMMMMMMMMMMTMETM..',
      '..MTMMMMTMMMMMMMMMMMMMMMTMMETM..',
      '..MTMMMMTMMMMMMMMMMMMMTMMMETM...',
      '..MTMMMMMMTMMMMMMMMMTMMMMMMTM...',
      '...MTMMMMMMTMMMMMMMTMMMMMMTM....',
      '....MTMMMMMMMMMMMMMMMMMMMMTM....',
      '.....MTMMMMMMMMMMMMMMMMMMTM.....',
      '......MTMMMMMMMMMMMMMMMMTM......',
      '.......MTMMMMMMMMMMMMMMTM.......',
      '........MTMMMMMMMMMMMMTM........',
      '.........MTMMMMMMMMMMTM.........',
      '..........MTMMMMMMMMTM..........',
      '...........MTMMMMMMTM...........',
      '............MTMMMMTM............',
      '.............MTMMTM.............',
      '..............MTTM..............',
      '...............MM...............',
      '................................',
      '................................',
    ]
  },

  // 狮子：金黄身体 + 棕色鬃毛环绕 + 圆耳
  lion: {
    palette: {
      ...BASE,
      M: '#ffc107',  // 主金黄（身体）
      S: '#ff8f00',  // 暗金
      L: '#ffe082',  // 亮金
      T: '#6d4c41',  // 鬃毛棕
      K: '#1a1a1a'   // 鼻黑
    },
    pixels: [
      '................................',
      '................................',
      '.....TTTT..............TTTT.....',
      '....TTTTTT............TTTTTT....',
      '....TTTTTT............TTTTTT....',
      '...TTTTTTTT..........TTTTTTTT...',
      '...TTTTTTTTTTTTTTTTTTTTTTTTTT...',
      '..TTTTTTTTTTTTTTTTTTTTTTTTTTT...',
      '..TTTTTTTTTTTTTTTTTTTTTTTTTTTT..',
      '.TTTMMTTTTTTTTTTTTTTTTTTMMTTTT..',
      '.TTTMMMMTTTTTTTTTTTTTTMMMMTTTT..',
      '.TTMMMMMMTTTTTTTTTTTTMMMMMMTTT..',
      '.TTMMMMMMTTTTTTTTTTTTMMMMMMTTT..',
      '.TTMMMMEEMTTTTTTTTTTEEMMMMTTTT..',
      '.TTMMMMEEMTTTTTTTTTTEEMMMMTTTT..',
      '..TTMMMMKKKTTTTTTTKKKMMMMTTTT...',
      '...TTMMMMMNKTTTTTTTKNMMMMMTTT...',
      '....TTMMMMMMTTTTTTMMMMMMMTT.....',
      '.....TTMMMMMMMMMMMMMMMMMTT......',
      '.......TTMMMMMMMMMMMMMMTT.......',
      '........TTMMMMMMMMMMMTT.........',
      '..........TTMMMMMMMMTT..........',
      '...........TTMMMMMTT............',
      '............TTMMMTT.............',
      '.............TTMTT..............',
      '..............TTT...............',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
    ]
  },

  // 棕熊：棕色圆胖 + 圆耳 + 米色胸
  bear: {
    palette: {
      ...BASE,
      M: '#795548',  // 主棕
      S: '#4e342e',  // 暗棕
      L: '#a1887f',  // 亮棕
      W: '#fff8e1',  // 胸米色
      K: '#1a1a1a'   // 鼻黑
    },
    pixels: [
      '................................',
      '................................',
      '...MMM....................MMM...',
      '..MMMMM..................MMMMM..',
      '..MMMMM..................MMMMM..',
      '.MMMMMMM................MMMMMMM.',
      'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
      'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
      'MMLMMMMMMMMMMMMMMMMMMMMMMMMLMMMM',
      'MMMMMMMMEEMMMMMMMMEEMMMMMMMMMMM.',
      'MMMMMMMMEEMMMMMMMMEEMMMMMMMMMMM.',
      'MMMMMMMMMNWMMMMMNWMMMMMMMMMMMMM.',
      '.MMMMMMMMMMNWMMMNWMMMMMMMMMMMMM.',
      '.MMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.',
      '.MMMMMMWWMMMMMMMMMMMWWMMMMMMMMM.',
      '.MMMMMWWWMMMMMMMMMMMWWWMMMMMMM..',
      '.MMMMWWWWMMMMMMMMMMMWWWWMMMMMM..',
      '.MMMWWWWWMMMMMMMMMMMWWWWWMMMMM..',
      '..MMMWWWWWWMMMMMMMMMWWWWWWMMMM..',
      '..MWWWWWWWWMMMMMMMWWWWWWWWMMM...',
      '...MWWWWWWWWWMMMMMWWWWWWWWWMM...',
      '...MWWWWWWWWWWMMMWWWWWWWWWMM....',
      '....MWWWWWWWWWWWWWWWWWWWWWMM....',
      '.....MWWWWWWWWWWWWWWWWWWWMM.....',
      '......MWWWWWWWWWWWWWWWWWMM......',
      '.......MWWWWWWWWWWWWWWWMM.......',
      '........MWWWWWWWWWWWWWMM........',
      '.........MWWWWWWWWWWWMM.........',
      '..........MWWWWWWWWWMM..........',
      '...........MWWWWWWWMM...........',
      '............MWWWWWMM............',
      '.............MWMMM..............',
    ]
  },

  // 红狐狸：流线红橙 + 尖耳 + 白胸 + 白尾尖
  fox: {
    palette: {
      ...BASE,
      M: '#e8523a',  // 主红橙
      S: '#c41e2a',  // 暗红
      L: '#ff7961',  // 亮红
      W: '#ffffff',  // 白胸白尾尖
      K: '#1a1a1a'   // 鼻黑
    },
    pixels: [
      '................................',
      '................................',
      '...MM.....................MM....',
      '..MMM.....................MMM...',
      '.MMMM.....................MMMM..',
      '.MMMMM...................MMMMM..',
      '.MMMMMM.................MMMMMM..',
      '.MMMMMMMMMMMMMMMMMMMMMMMMMMMMM..',
      '.MMMMMMMMMMMMMMMMMMMMMMMMMMMMM..',
      '.MMLMMMMMMMMMMMMMMMMMMMMMMMMLM..',
      '.MMMEEMMMMMMMMMMMMMMMMMMMMMEEM..',
      '.MMMEEMMMMMMMMMMMMMMMMMMMMMEEM..',
      '..MMMMMMMNWMMMMMMMMMMMNWMMMMMM..',
      '..MMMMMMMNWMMMMMMMMMMMNWMMMMMM..',
      '..MMMMMMMMMMMMMMMMMMMMMMMMMMM...',
      '...MMMWWWMMMMMMMMMMMMMWWWMMM....',
      '....MMWWWWWMMMMMMMMMMWWWWWMM....',
      '....MWWWWWWMMMMMMMMWWWWWWMM.....',
      '.....MWWWWWWWMMMMWWWWWWWMM......',
      '......MWWWWWWWWWWWWWWWWMM.......',
      '.......MWWWWWWWWWWWWWWMM........',
      '........MMMMMMMMMMMMMMMM........',
      '.........MMMMMMMMMMMMM..........',
      '..........MMMMMMMMMMM...........',
      '...........MMMMMMMMM............',
      '............MMMMMMW.............',
      '.............MMMMW..............',
      '..............MMW...............',
      '...............W................',
      '................................',
      '................................',
      '................................',
    ]
  },

  // ============ 第3章 森林 ============

  // 青蛙：草绿蹲坐 + 凸大眼 + 大嘴
  frog: {
    palette: {
      ...BASE,
      M: '#66bb6a',  // 主草绿
      S: '#388e3c',  // 暗绿
      L: '#a5d6a7',  // 亮绿
      W: '#ffffff',  // 肚白
      E: '#1a1a1a'   // 眼黑
    },
    pixels: [
      '................................',
      '................................',
      '.......EE..............EE.......',
      '.......EEE............EEE.......',
      '......EEWEE..........EEWEE......',
      '......EEWEE..........EEWEE......',
      '.....EEEWEEE........EEEWEEE.....',
      '.....MMMMMMM........MMMMMMM.....',
      '....MMMMMMMMMMMMMMMMMMMMMMMM....',
      '....MMLMMMMMMMMMMMMMMMMMMLMM....',
      '....MMMMMMMMMMMMMMMMMMMMMMMM....',
      '....MMMMMMMMMMMMMMMMMMMMMMMM....',
      '....MMMMMMMMMMMMMMMMMMMMMMMM....',
      '....MMMMMMMMMMMMMMMMMMMMMMMM....',
      '....MMMMWWWWWWWWWWWWWWWWWWMM....',
      '....MMMMWWWWWWWWWWWWWWWWWWMM....',
      '....MMMWWWWWWWWWWWWWWWWWWMM.....',
      '....MMMWWWWWWWWWWWWWWWWWWMM.....',
      '.....MMWWWWWWWWWWWWWWWWWWMM.....',
      '.....MMWWWWWWWWWWWWWWWWWWMM.....',
      '.....MWWWWWWWWWWWWWWWWWWWMM.....',
      '.....MWWWWWWWWWWWWWWWWWWWMM.....',
      '.....MWWWWWWWWWWWWWWWWWWMM......',
      '.....MWWWWWWWWWWWWWWWWWWMM......',
      '......MWWWWWWWWWWWWWWWWWMM......',
      '......MMMMMMMMMMMMMMMMMMMM......',
      '.......MMMMMMMMMMMMMMMMMM.......',
      '........MMMMMMMMMMMMMMMM........',
      '........MMMMMMMMMMMMMMM.........',
      '..........MMMMMMMMMMMM..........',
      '................................',
      '................................',
    ]
  },

  // 鳄鱼：深绿长扁身 + 长嘴 + 锯齿背 + 黄肚
  crocodile: {
    palette: {
      ...BASE,
      M: '#2e7d32',  // 主深绿
      S: '#1b5e20',  // 暗绿
      L: '#4caf50',  // 亮绿
      T: '#1a1a1a',  // 锯齿黑
      W: '#fff9c4'   // 黄肚
    },
    pixels: [
      '................................',
      '.T.T.T.T.T.T.T.T.T.T.T.T.T.T.T..',
      'MTMTMTMTMTMTMTMTMTMTMTMTMTMTMTM.',
      'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.',
      'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.',
      '.MMMMMMMMMMMMMMMMMMMMMMMMMMMMM..',
      '..MMMMMMMMMMMMMMMMMMMMMMMMMMM...',
      '..MMLMMMMMMMMMMMMMMMMMMMMMLMM...',
      '..MMMLMMMMMMMMMMMMMMMMMMMMLMM...',
      '...MMMMMMMMMMMMMMMMMMMMMMMMMM...',
      '...MMMMMMMMMMMMMMMMMMMMMMMMMM...',
      '...MMMEEEMMMMMMMMMMMMMMMEEEMM...',
      '...MMMEEEMMMMMMMMMMMMMMMEEEMM...',
      '...MMMMMMMMMMMMMMMMMMMMMMMMMM...',
      '...MMMMWWWWMMMMMMMMMMWWWWMMM....',
      '....MMMWWWWWWMMMMMMWWWWWWMMM....',
      '....MMMWWWWWWWWWWWWWWWWWWMM.....',
      '.....MMWWWWWWWWWWWWWWWWWWMM.....',
      '.....MMWWWWWWWWWWWWWWWWWWMM.....',
      '.....MWWWWWWWWWWWWWWWWWWMM......',
      '.....MWWWWWWWWWWWWWWWWWWMM......',
      '......MWWWWWWWWWWWWWWWWWMM......',
      '......MWWWWWWWWWWWWWWWWWMM......',
      '.......MWWWWWWWWWWWWWWWMM.......',
      '.......MWWWWWWWWWWWWWWMM........',
      '........MWWWWWWWWWWWWWMM........',
      '........MWWWWWWWWWWWWMM.........',
      '.........MWWWWWWWWWWMM..........',
      '..........MWWWWWWWWMM...........',
      '...........MWWWWWWMM............',
      '............MWWWWMM.............',
      '.............MWMMM..............',
    ]
  },

  // 大象：灰色大圆身 + 长鼻 + 大耳 + 象牙
  elephant: {
    palette: {
      ...BASE,
      M: '#90a4ae',  // 主灰
      S: '#546e7a',  // 暗灰
      L: '#cfd8dc',  // 亮灰
      W: '#ffffff',  // 象牙白
      K: '#1a1a1a'   // 鼻孔黑
    },
    pixels: [
      '................................',
      '................................',
      '....MMMMMM..............MMMM....',
      '...MMMMMMMM............MMMMMM...',
      '..MMMMMMMMMM..........MMMMMMMM..',
      '..MMMMMMMMMM..........MMMMMMMM..',
      '.MMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.',
      'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
      'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
      'MMMMLMMMMMMMMMMMMMMMMMMMMMMLMMM.',
      'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.',
      '.MMMMMEEEMMMMMMMMMMMMMMMEEEMMMM.',
      '.MMMMMEEEMMMMMMMMMMMMMMMEEEMMMM.',
      '.MMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.',
      '.MMMMWMMMMMMMMMMMMMMMMMMWMMMMM..',
      '..MMMMWMMMMMMMMMMMMMMMMMWMMMMM..',
      '...MMMMMMMMMMMMMMMMMMMMMMMMMM...',
      '...MMMMMMMMMMMMMMMMMMMMMMMMM....',
      '....MMMMMMMMMMMMMMMMMMMMMMMM....',
      '....MMMMMMMMMMMMMMMMMMMMMMM.....',
      '.....MMMMMMMMMMMMMMMMMMMMMM.....',
      '.....MMMMMMMMMMMMMMMMMMMMM......',
      '......MMMMMMMMMMMMMMMMMMMM......',
      '......MMMMMMMMMMMMMMMMMMM.......',
      '.......MMMMMMMMMMMMMMMMMM.......',
      '.......MMMMMMMMMMMMMMMMM........',
      '........MMMMMMMMMMMMMMMM........',
      '........MMMMMMMMMMMMMMM.........',
      '.........MMMMMMMMMMMMMM.........',
      '.........MMMMMMMMMMMMM..........',
      '..........MMMMMMMMMMMM..........',
      '..........MMMMMMMMMMM...........',
    ]
  },

  // 熊猫：白色圆胖 + 黑耳 + 黑眼圈 + 黑四肢
  panda: {
    palette: {
      ...BASE,
      M: '#fafafa',  // 主白
      S: '#e0e0e0',  // 阴影
      L: '#ffffff',  // 亮白
      K: '#1a1a1a'   // 黑色（耳、眼圈、四肢）
    },
    pixels: [
      '................................',
      '................................',
      '..KKKK....................KKKK..',
      '.KKKKKK..................KKKKKK.',
      '.KKKKKK..................KKKKKK.',
      'KKKKKKKK................KKKKKKK.',
      'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
      'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
      'KKMMMMMMKKKKKKKKKKKKKKKMMMMMMKK.',
      'KKMMMMMMKKKKKKKKKKKKKKKMMMMMMKK.',
      '.KKMMKKMMMKKKKKKKKKKKKKMMKKMMMK.',
      '.KKMMKKMMMKKKKKKKKKKKKKMMKKMMMK.',
      '.KKMMKKMMMKKKKKKKKKKKKKMMKKMMMK.',
      '.KKMMMMMMKKKKKKKKKKKKKKKMMMMMK..',
      '..KKMMMMKKKKKKKNWNNWKKKKKMMMMK..',
      '...KKKKKKKKKKKNNWWNNKKKKKKKKK...',
      '...KKKKKKKKKKKKKKKKKKKKKKKKK....',
      '....KKKKKKKKKKKKKKKKKKKKKKK.....',
      '.....KKKKKKKKKKKKKKKKKKKKK......',
      '.....KKKKKKKKKKKKKKKKKKKKK......',
      '......KKKKKKKKKKKKKKKKKKKK......',
      '......KKKKKKKKKKKKKKKKKKKK......',
      '......KKKKKKKKKKKKKKKKKKK.......',
      '......KKKKKKKKKKKKKKKKKKK.......',
      '.......KKKKKKKKKKKKKKKKKK.......',
      '........KKKKKKKKKKKKKKKK........',
      '........KKKKKKKKKKKKKKKK........',
      '.........KKKKKKKKKKKKKK.........',
      '..........KKKKKKKKKKKK..........',
      '...........KKKKKKKKKK...........',
      '............KKKKKKKK............',
      '.............KKKKKK.............',
    ]
  },

  // ============ 第4章 鸟类 ============

  // 火烈鸟：粉红 + 长腿 + S形长脖 + 弯嘴
  flamingo: {
    palette: {
      ...BASE,
      M: '#ec407a',  // 主粉红
      S: '#c2185b',  // 暗粉
      L: '#f48fb1',  // 亮粉
      N: '#1a1a1a',  // 嘴黑
      K: '#6d4c41'   // 腿棕
    },
    pixels: [
      '................................',
      '...............NN...............',
      '..............NNN...............',
      '..............NNN...............',
      '..............NNM...............',
      '..............NMM...............',
      '..............MMM...............',
      '..............MMML..............',
      '..............MMML..............',
      '..............MMML..............',
      '..............MMML..............',
      '..............MMML..............',
      '..............MMML..............',
      '..............MMML..............',
      '..............MMML..............',
      '..............MMML..............',
      '..............MMML..............',
      '..............MMM...............',
      '..............MMM...............',
      '..............MMM...............',
      '..............MMM...............',
      '..............MMM...............',
      '..............MMM...............',
      '..............MMM...............',
      '..............MMM...............',
      '..............MMM...............',
      '..............MMM...............',
      '..............MMM...............',
      '..............MMM...............',
      '..............MMM...............',
      '..............K.K...............',
      '..............K.K...............',
    ]
  },

  // 孔雀：青绿身 + 开屏尾羽（眼状图案）+ 金色羽冠
  peacock: {
    palette: {
      ...BASE,
      M: '#00acc1',  // 主青绿
      S: '#00838f',  // 暗青
      L: '#4dd0e1',  // 亮青
      T: '#1a237e',  // 尾羽眼深蓝
      C: '#ffd700',  // 尾羽金 + 羽冠金
      K: '#1a1a1a'   // 眼黑
    },
    pixels: [
      '...............CC...............',
      '..............CCCC..............',
      '..............CCCC..............',
      '...............CC...............',
      '...........TTTTTTTTTT...........',
      '...........TTCCTTCCTT...........',
      '.........TTCCTTCCTTCCT..........',
      '.........TTCCTTCCTTCCTT.........',
      '.......TTCCTTCCTTCCTTCCT........',
      '.......TTCCTTCCTTCCTTCCTT.......',
      '.....TTCCTTCCTTCCTTCCTTCCT......',
      '.....TTCCTTCCTTCCTTCCTTCCTT.....',
      '...TTCCTTCCTTCCTTCCTTCCTTCCT....',
      '...TTCCTTCCTTCCTTCCTTCCTTCCTT...',
      '.TTCCTTCCTTCCTTCCTTCCTTCCTTCCT..',
      '.TTCCTTCCTTCCTTCCTTCCTTCCTTCCTT.',
      '.TTCCTTCCTTCCTTCCTTCCTTCCTTCCTT.',
      '.TTMMMMMMTTMMMMMMTTMMMMMMTTMMMM.',
      '..TMMMMMMTTMMMMMMTTMMMMMMTTMMM..',
      '..TMMEEEMTTMMEEEMTTMMEEEMTTMM...',
      '....TMMMMMTTMMMMMTTMMMMMTTMM....',
      '....TMMMMMTTMMMMMTTMMMMMTTM.....',
      '.....TMMMMTTMMMMTTMMMMTTTM......',
      '.......TMMMTTMMMTTMMMTTTM.......',
      '........TMMTTMMTTMMTTTM.........',
      '..........TMTMTMTMTTM...........',
      '...........TMTMTMTTM............',
      '............TTTTTTM.............',
      '.............TTTTM..............',
      '..............TTM...............',
      '...............M................',
      '................................',
    ]
  },

  // 企鹅：深灰蓝背 + 白肚 + 橙嘴 + 橙脚
  penguin: {
    palette: {
      ...BASE,
      M: '#37474f',  // 主深灰蓝（背）
      S: '#263238',  // 暗灰
      L: '#546e7a',  // 亮灰
      W: '#ffffff',  // 白肚
      N: '#ff9800'   // 嘴橙
    },
    pixels: [
      '................................',
      '................................',
      '.............MMMMMM.............',
      '............MMMMMMMM............',
      '............MMMMMMMM............',
      '............MKMMKMMM............',
      '............MKMMKMMM............',
      '............MMMMMMMM............',
      '...........MMMMMMMMMM...........',
      '...........MMMWWWWMMM...........',
      '..........MMMWWWWWWMMM..........',
      '..........MMMWWWWWWMMM..........',
      '.........MMMWWWWWWWWMMM.........',
      '.........MMMWWWWWWWWMMM.........',
      '........MMMWWWWWWWWWWMMM........',
      '........MMMWWWWWWWWWWMMM........',
      '.......MMMWWWWWWWWWWWWMMM.......',
      '.......MMMWWWWWWWWWWWWMMM.......',
      '......MMMWWWWWWWWWWWWWWMMM......',
      '......MMMWWWWWWWWWWWWWWMMM......',
      '.....MMMWWWWWWWWWWWWWWWWMMM.....',
      '.....MMMWWWWWWWWWWWWWWWWMMM.....',
      '....MMMWWWWWWWWWWWWWWWWWWMMM....',
      '....MMMWWWWWWWWWWWWWWWWWWMMM....',
      '...MMMWWWWWWWWWWWWWWWWWWWWMMM...',
      '...MMMWWWWWWWWWWWWWWWWWWWWMMM...',
      '..MMMMWWWWWWWWWWWWWWWWWWWWMMMM..',
      '...MMMMMNNNNN.....NNNNNMMMMMM...',
      '......NNNNNN.......NNNNNN.......',
      '......NNNNN.........NNNNN.......',
      '.......NNN...........NNN........',
      '................................',
    ]
  },

  // 鹦鹉：蓝绿身 + 红头胸 + 黄翅 + 弯嘴
  parrot: {
    palette: {
      ...BASE,
      M: '#00897b',  // 主蓝绿（身）
      S: '#00695c',  // 暗蓝绿
      L: '#4db6ac',  // 亮蓝绿
      C: '#d32f2f',  // 头胸红
      T: '#fbc02d',  // 翅黄
      K: '#1a1a1a'   // 弯嘴黑
    },
    pixels: [
      '................................',
      '................................',
      '.............KKKKKK.............',
      '...........KCCCCCCCK............',
      '...........KCCCCCCCK............',
      '..........KCCCCCCCCCK...........',
      '..........KCCMMCCMMCK...........',
      '..........KCCMMCCMMCK...........',
      '..........KCCCCCCCCCK...........',
      '.........KCCCCCCCCCCCK..........',
      '........KCCCCCCCCCCCCCK.........',
      '.......KCCCCCCCCCCCCCCCK........',
      '......KCCCCMMMMMMMMCCCCCK.......',
      '.....KCCCCMMMMTTMMMMCCCCCK......',
      '....KCCCCMMMMTTTTMMMMCCCCCK.....',
      '...KCCCCMMMMMTTTTMMMMMCCCCCK....',
      '..KCCCCMMMMMMTTTTMMMMMMCCCCCK...',
      '..KCCCMMMMMMMTTTTMMMMMMMCCCCK...',
      '..KCCMMMMMMMMTTTTMMMMMMMMCCCK...',
      '...KCCMMMMMMMTTTTMMMMMMMCCCK....',
      '...KCCMMMMMMMTTTTMMMMMMMCCCK....',
      '....KCCMMMMMMTTTTMMMMMMCCCK.....',
      '.....KCCMMMMMTTTTMMMMMCCCK......',
      '......KCCMMMMTTTTMMMMCCCK.......',
      '........KCCMMMTTTMMMCCCK........',
      '.........KCCMMTTTMMCCCK.........',
      '..........KCCMTTMCCCK...........',
      '...........KCCMMCCCK............',
      '............KCCCCCK.............',
      '.............KCCCK..............',
      '..............KCK...............',
      '...............K................',
    ]
  },

  // ============ 第5章 海洋 ============

  // 小鱼：天蓝流线 + 三角尾鳍 + 鳞片
  fish: {
    palette: {
      ...BASE,
      M: '#42a5f5',  // 主天蓝
      S: '#1976d2',  // 暗蓝
      L: '#90caf9',  // 亮蓝
      T: '#0d47a1',  // 鳞片深蓝
      W: '#ffffff'   // 眼白
    },
    pixels: [
      '................................',
      '................................',
      '................................',
      '...............MM...............',
      '..............MMMM..............',
      '.............MMMMM..............',
      '.............MMMMMM.............',
      '..MMMMMMMMMMMMMMMMMMMMMMMMMMM...',
      '..MMLMMMMMMMMMMMMMMMMMMMMMMMMM..',
      '..MMLLMMMMMMMMMMMMMMMMMMMMMMMM..',
      '.MMLLTMMMMMMMMMMMMMMMMMMMMMMMM..',
      '.MMLLTTLMMMMMMMMMMMMMMMMMMMMMMM.',
      '.MMLLTTTLMMMMMMMMMMMMMMMMMMMMMM.',
      '.MMEEWMMMMMMMMMMMMMMMMMMMMMMMMM.',
      '.MMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.',
      '.MMMMMMMMMMMMMMMMMMMMMMMMMMMMM..',
      '..MMMMMMMMMMMMMMMMMMMMMMMMMMM...',
      '...MMMMMMMMMMMMMMMMMMMMMMMMM....',
      '....MMMMMMMMMMMMMMMMMMMMMMM.....',
      '.....MMMMMMMMMMMMMMMMMMMMM......',
      '......MMMMMMMMMMMMMMMMMMM.......',
      '.......MMMMMMMMMMMMMMMMM........',
      '........MMMMMMMMMMMMMMM.........',
      '.........MMMMMMMMMMMMM..........',
      '..........MMMMMMMMMMM...........',
      '...........MMMMMMMMM............',
      '............MMMMMMM.............',
      '.............MMMMM..............',
      '..............MMM...............',
      '...............M................',
      '................................',
      '................................',
    ]
  },

  // 鲸鱼：深蓝大椭圆 + 喷水 + 白肚
  whale: {
    palette: {
      ...BASE,
      M: '#1e88e5',  // 主深蓝
      S: '#1565c0',  // 暗蓝
      L: '#64b5f6',  // 亮蓝
      W: '#ffffff',  // 白肚
      H: '#81d4fa'   // 喷水蓝
    },
    pixels: [
      '................................',
      '..............HHH...............',
      '..........HOOOH.................',
      '..........HHOHH.................',
      '..........HHOH..................',
      '.........HHOH...................',
      '........HHOH....................',
      '.......HHOH.....................',
      '......HHOH......................',
      '............MMMMMMM.............',
      '...........MMMMMMMMMM...........',
      '..........MMLMMMMMMMMM..........',
      '.........MMLMMMMMMMMMMM.........',
      '.......MMLLMMMMMMMMMMMMM........',
      '......MMLLMMMMMMMMMMMMMMMM......',
      '.....MMEEWMMMMMMMMMMMMMMMM......',
      '.....MMMMMMMMMMMMMMMMMMMMM......',
      '.....MMMMWWMMMMMMMMMMMMMMM......',
      '.....MMMMWWWMMMMMMMMMMMMMM......',
      '......MMMWWWWMMMMMMMMMMMMM......',
      '......MMMWWWWWMMMMMMMMMMMM......',
      '......MMWWWWWWMMMMMMMMMMM.......',
      '.......MWWWWWWWMMMMMMMMMM.......',
      '.......MWWWWWWWMMMMMMMMM........',
      '........MWWWWWWWMMMMMMMM........',
      '........MWWWWWWWMMMMMMM.........',
      '.........MWWWWWWWMMMMMM.........',
      '.........MWWWWWWWMMMMM..........',
      '..........MWWWWWWWMMMM..........',
      '...........MWWWWWWMMM...........',
      '............MWWWWWMM............',
      '.............MWMMM..............',
    ]
  },

  // 章鱼：紫红圆头 + 8触手 + 吸盘
  octopus: {
    palette: {
      ...BASE,
      M: '#c2185b',  // 主紫红
      S: '#880e4f',  // 暗紫
      L: '#e91e63',  // 亮紫
      T: '#ff80ab',  // 吸盘粉
      E: '#1a1a1a'   // 眼黑
    },
    pixels: [
      '................................',
      '................................',
      '.............MMMMMM.............',
      '...........MMMMMMMMMM...........',
      '..........MMMMMMMMMMMM..........',
      '.........MMLMMMMMMMMLM..........',
      '.........MMLMMMMMMMMLM..........',
      '........MMMMMMMMMMMMMMM.........',
      '........MMMEEEMMMEEEMMM.........',
      '........MMMEEEMMMEEEMMM.........',
      '.......MMMMMMMMMMMMMMMMM........',
      '.......MMMMMMMMMMMMMMMMM........',
      '......MMMMMMMMMMMMMMMMMMM.......',
      '.....MMMMMMMMMMMMMMMMMMMMM......',
      '.....MMMMMMMMMMMMMMMMMMMMM......',
      '....MMMMMMMMMMMMMMMMMMMMMMM.....',
      '...MMMMTMMMMMMMMMMMMMMMMTMMMM...',
      '...MMMTTTMMMMMMMMMMMMMMTTTMMM...',
      '...MMTTTTTMMMMMMMMMMMMTTTTTMM...',
      '...MTTTTTTTMMMMMMMMMMTTTTTTTM...',
      '...MTTTTTTTTMMMMMMMMTTTTTTTTM...',
      '...MTTTTTTTTTMMMMMMTTTTTTTTTM...',
      '....MTTTTTTTTTMMMMTTTTTTTTTM....',
      '....MTTTTTTTTTTMMTTTTTTTTTTM....',
      '.....MTTTTTTTTTTTTTTTTTTTTM.....',
      '.....MTTTTTTTTTTTTTTTTTTTM......',
      '......MTTTTTTTTTTTTTTTTTM.......',
      '.......MTTTTTTTTTTTTTTTM........',
      '........MTTTTTTTTTTTTTM.........',
      '.........MTTTTTTTTTTTM..........',
      '..........MTTTTTTTTTM...........',
      '...........MMMMMMMMM............',
    ]
  },

  // 水母：淡紫钟形头 + 飘逸触须
  jellyfish: {
    palette: {
      ...BASE,
      M: '#ab47bc',  // 主淡紫
      S: '#8e24aa',  // 暗紫
      L: '#ce93d8',  // 亮紫
      T: '#ffffff',  // 触须白
      E: '#1a1a1a'   // 眼黑
    },
    pixels: [
      '................................',
      '................................',
      '.............MMMMMM.............',
      '...........MMLLLLLLM............',
      '..........MMLLLLLLLLM...........',
      '.........MMLLLLLLLLLLM..........',
      '........MMLLLLLLLLLLLLM.........',
      '.......MMLLLLLLLLLLLLLLM........',
      '.......MMLLLLEEELLEEELLLM.......',
      '.....MMLLLLLLEEELLEEELLLLM......',
      '.....MMLLLLLLLLLLLLLLLLLLM......',
      '....MMLLLLLLLLLLLLLLLLLLLLM.....',
      '....MMLLLLLLLLLLLLLLLLLLLLM.....',
      '...MMLLLLLLLLLLLLLLLLLLLLLLM....',
      '...MMLLLLLLLLLLLLLLLLLLLLLLM....',
      '..MMLLLLLLLLLLLLLLLLLLLLLLLLM...',
      '..MMLLLLLLLLLLLLLLLLLLLLLLLLM...',
      '..MMLLLLLLLLLLLLLLLLLLLLLLLLM...',
      '...MLLLLLLLLLLLLLLLLLLLLLLLM....',
      '....MLLLLLLLLLLLLLLLLLLLLLM.....',
      '.....MLLLLLLLLLLLLLLLLLLLLM.....',
      '......MLLLLLLLLLLLLLLLLLLM......',
      '.......MLLLLLLLLLLLLLLLLM.......',
      '.......MTTMTTMTTMTTMTTMTM.......',
      '......MTTTTTTTTTTTTTTTTTTM......',
      '.....MTTTTTTTTTTTTTTTTTTTTM.....',
      '....MTTTTTTTTTTTTTTTTTTTTTTM....',
      '...MTTTTTTTTTTTTTTTTTTTTTTTTM...',
      '...MTTTTTTTTTTTTTTTTTTTTTTTTM...',
      '....MTTTTTTTTTTTTTTTTTTTTTTM....',
      '.....MTTTTTTTTTTTTTTTTTTTTM.....',
      '......MTTTTTTTTTTTTTTTTTTM......',
    ]
  },

  // ============ 第1章 家畜 补 ============

  // 马：棕色方身 + 竖耳 + 鬃毛（深棕）+ 长脸
  horse: {
    palette: {
      ...BASE,
      M: '#8d6e63',  // 棕
      S: '#6d4c41',  // 暗棕
      L: '#a1887f',  // 亮棕
      T: '#4e342e'   // 鬃毛深棕
    },
    pixels: [
      '................................',
      '................................',
      '..........MMMMM.................',
      '.........MMTTTM.................',
      '.........MMTTTM.................',
      '........MMTTTMM.................',
      '........MMLTTMM.................',
      '.......MMLLTTMM.................',
      '.......MMEELLMM.................',
      '.......MMEELLMM.................',
      '.......MMMNMMM..................',
      '.......MMMMMMM..................',
      '......MMMMMMMMM.................',
      '......MMMMMMMMM.................',
      '.....MMMMMMMMMMM................',
      '.....MMLMMMMMMLMM...............',
      '....MMLMMMMMMMMMM...............',
      '....MMLMMMMMMMMMMM..............',
      '....MMLMMMMMMMMMMMM.............',
      '....MMMMMMMMMMMMMMMM............',
      '....MMMMMMMMMMMMMMMM............',
      '....MMMMMMMMMMMMMMMM............',
      '....MMMMMMMMMMMMMMMM............',
      '....MMMMMMMMMMMMMMMM............',
      '.....MMMMMMMMMMMMMM.............',
      '.....MMMMMMMMMMMMMM.............',
      '......MMMMMMMMMMMM..............',
      '......MMMM....MMMM..............',
      '......MMMM....MMMM..............',
      '......MMMM....MMMM..............',
      '.....MMMM......MMMM.............',
      '................................',
    ]
  },

  // 牛：黑白奶牛纹 + 粉色鼻 + 短角
  cow: {
    palette: {
      ...BASE,
      M: '#fafafa',  // 白
      S: '#e0e0e0',  // 暗白
      L: '#ffffff',  // 亮白
      T: '#1a1a1a',  // 斑块黑
      P: '#ffb3c1',  // 鼻粉
      K: '#1a1a1a'   // 角黑
    },
    pixels: [
      '................................',
      '................................',
      '.........KK......KK.............',
      '........KKKK....KKKK............',
      '........KKKK....KKKK............',
      '......MMMMMMLLMMMMMMM...........',
      '.....MMMMMMLLMMMMMMMM...........',
      '....MMMMMMLLMMMMMMMMMM..........',
      '....MMTEEMMMMMMMMTEEMM..........',
      '....MMTEEMMMMMMMMTEEMM..........',
      '....MMTPPPMMMMMMTPPPMM..........',
      '....MTPPPPMMMMMTPPPPMM..........',
      '....MTPPPPMMM..MMMMMM...........',
      '....MMMMTWWW..WTMMMMM...........',
      '.....MMMWWWWT..TWWWMMM..........',
      '.....MMMWWWWWWTWWWWMM...........',
      '.....MMTWWWWWWWWWWMM............',
      '.....MMMTWWWWWWWWWMM............',
      '......MMMTWWWWWWWWMM............',
      '......MMMMMWWWWWWMMM............',
      '.......MMMMMWWWWWMMM............',
      '........MMMMMMMMMMMM............',
      '........MMMMMMMMMMMM............',
      '.........MMMMMMMMMM.............',
      '.........MMMMMMMMMM.............',
      '..........MMMMMMMM..............',
      '..........MMMM.MMM..............',
      '..........MMMM.MMM..............',
      '..........MMMM.MMM..............',
      '.........MMMM...MMM.............',
      '........MMMM.....MMM............',
      '................................',
    ]
  },

  // ============ 第2章 野生 补 ============

  // 狼：深灰 + 尖耳 + 锐利黄眼 + 尖嘴
  wolf: {
    palette: {
      ...BASE,
      M: '#546e7a',  // 深灰
      S: '#37474f',  // 暗灰
      L: '#78909c',  // 亮灰
      W: '#e0e0e0',  // 嘴白
      E: '#ffd54f'   // 黄眼
    },
    pixels: [
      '................................',
      '................................',
      '.........MMMM...................',
      '........MMMMMM..................',
      '........MMMMMM..................',
      '.......MMMMMMMM.................',
      '......MMMMMMMMMM................',
      '......MMLMMMMMLMM...............',
      '.....MMEEMMMMMLLMM..............',
      '.....MMEEMMMMLLLMM..............',
      '.....MMNMMMMMLLLMM..............',
      '.....MMMMMMMMLMM................',
      '....MMMMMMMMMMM.................',
      '....MMMMMMMMMMMM................',
      '...MMLMMMMMMMMMLMM..............',
      '...MMLMMMMMMMMMMLMM.............',
      '...MMLMMMMMMMMMMMMM.............',
      '...MMLMMMMMMMMMMMMMM............',
      '...MMMMMMMMMMMMMMMMMM...........',
      '...MMMMMMMMMMMMMMMMMM...........',
      '...MMMMWWMMMMMMMMMMMM...........',
      '...MMMMWWMMMMMMMMMMMM...........',
      '....MMMWWWMMMMMMMMMM............',
      '....MMMWWWMMMMMMMMMM............',
      '.....MMMWWWMMMMMMMMM............',
      '......MMMWWWMMMMMMM.............',
      '.......MMWWWWMMMMM..............',
      '.......MMMWWWWMMM...............',
      '........MMMM..MMM...............',
      '........MMMM...MMM..............',
      '.......MMMM.....MMM.............',
      '................................',
    ]
  },

  // 鹰：深棕身 + 白首 + 黄弯嘴 + 展翅
  eagle: {
    palette: {
      ...BASE,
      M: '#5d4037',  // 深棕
      S: '#3e2723',  // 暗棕
      L: '#795548',  // 亮棕
      W: '#ffffff',  // 白头
      N: '#ffa000'   // 嘴金黄
    },
    pixels: [
      '................................',
      '................................',
      '......MLM......MLM..............',
      '.....MMMMM....MMMMM.............',
      '....MMMMMMM..MMMMMMM............',
      '...MMMMMMMM..MMMMMMMM...........',
      '..MMMMMMMMWWWWMMMMMMMM..........',
      '.MMMMMMMMWWWWWWWMMMMMMMM........',
      'MMMMMMMMWWWWWWWMMMMMMMMM........',
      'MMMMMWWWWWWWWWWWWWWWMMMMMMMM....',
      'MMMMWWWWWWWWWWWWWWWWWMMMMMMM....',
      'MMMWWWWWWWWWWWWWWWWWWWMMMMMM....',
      'MMMMWWWWWWWNNWWWWWWWWWMMMMMM....',
      '.MMMMWWWWWWNNNWWWWWWWWMMMMM.....',
      '.MMMMMMMMMEEENMMMMMMMMMMM.......',
      '.MMMMMMMMMEEENMMMMMMMMM.........',
      '..MMMMMMMMMMMMMMMMMMMMM.........',
      '...MMMMLMMMMMMMMMMMMMM..........',
      '...MMLLLMMMMMMMMMMMMM...........',
      '...MLMMMMLMMMMMMMMMMM...........',
      '...MMMMMMLMMMMMMMMMMM...........',
      '...MMMMMLLMMMMMMMMMMM...........',
      '...MMMMLLLLMMMMMMMMMM...........',
      '....MMMLLLLMMMMMMMMMM...........',
      '....MMMMMMMMMMMMMMMMM...........',
      '.....MMMMMMMMMMMMMMM............',
      '......MMMMMMMMMMMMM.............',
      '.......MMMMMMMMMMM..............',
      '........MMMMMMMMM...............',
      '........MMM...MMM...............',
      '.......MMM.....MMM..............',
      '................................',
    ]
  },

  // ============ 第3章 森林 补 ============

  // 猴：浅棕 + 圆耳 + 长尾 + 笑脸
  monkey: {
    palette: {
      ...BASE,
      M: '#a1887f',  // 浅棕
      S: '#795548',  // 暗棕
      L: '#bcaaa4',  // 亮棕
      P: '#ffb3c1'   // 脸粉
    },
    pixels: [
      '................................',
      '................................',
      '.........MMMM...................',
      '........MMMMMMM.................',
      '........MMMMMMM.................',
      '........MMMMMMM.................',
      '.......MMMMLMMMM................',
      '......MMPLLLPLLMM...............',
      '......MMPLLLLPLLMM..............',
      '.....MMEELLLLLLEEMM.............',
      '.....MMEELLLLLLEEMM.............',
      '.....MMMPLLLLLLPMMM.............',
      '......MMMPLLLLPMM...............',
      '......MMMMMPPMMMM...............',
      '......MMMMMMMMMM................',
      '.....MMMMMMMMMMMM...............',
      '.....MMLMMMMMMMMLMM.............',
      '....MMLMMMMMMMMMMLMM............',
      '....MMLMMMMMMMMMMMMM............',
      '....MMMMMMMMMMMMMMMM............',
      '....MMMMMMMMMMMMMMMM............',
      '....MMMMMMMMMMMMMMM.............',
      '.....MMMMMMMMMMMMM..............',
      '.....MMMMMMMMMMMMM..............',
      '......MMMMMMMMMMM...............',
      '......MMMMMMMMMMMMMMMMM.........',
      '......MMMMMMMMMMMMMMM...........',
      '.......MMMMMMMMMMMMMM........MM.',
      '........MMMMMMMMMMMMM........MM.',
      '.........MMMMMMMMMMMM.....MMM...',
      '.........MMM..MMMMM....MMM......',
      '..........M....MM.....MM........',
    ]
  },

  // 鹿：浅棕身 + 分叉角 + 白斑 + 长颈
  deer: {
    palette: {
      ...BASE,
      M: '#bf8f6a',  // 浅棕
      S: '#8d6e63',  // 暗棕
      L: '#d4a87c',  // 亮棕
      T: '#5d4037',  // 角棕
      W: '#ffffff'   // 白斑
    },
    pixels: [
      '................................',
      '................................',
      '.........TT...TT................',
      '........TTT..TTT................',
      '.........TTT.T..................',
      '........MMMMMMM.................',
      '.......MMMMMMMM.................',
      '.......MMMMMMMM.................',
      '.......MMMMMMMM.................',
      '.......MMEEMM...................',
      '.......MMEEMM...................',
      '.......MMPPMM...................',
      '.......MMMMMMMM.................',
      '.......MMMMMMMM.................',
      '.......MMMMMMMM.................',
      '.......MMMMMMMM.................',
      '......MMMMMMMMMM................',
      '......MMWMMMMWMM................',
      '......MMWMMMMWMM................',
      '......MMMMMMMMMMMM..............',
      '.....MWMMMMMMMMMWM..............',
      '....MMWMMMMMMMMMMWM.............',
      '....MMMMMMMMMMMMMMM.............',
      '....MMMMMMMMMMMMMMM.............',
      '....MMMMMMMMMMMMMMM.............',
      '....MMMMMMMMMMMMMMM.............',
      '.....MMMMMMMMMMMM...............',
      '.....MMMMMMMMMMMM...............',
      '......MMMM..MMMM................',
      '......MMMM..MMMM................',
      '.....MMMM....MMMM...............',
      '................................',
    ]
  },

  // ============ 第4章 鸟类 补 ============

  // 猫头鹰：灰棕身 + 大圆眼 + 圆脸盘 + 尖嘴
  owl: {
    palette: {
      ...BASE,
      M: '#795548',  // 灰棕
      S: '#5d4037',  // 暗棕
      L: '#a1887f',  // 亮棕
      W: '#fff3e0',  // 脸盘米白
      E: '#1a1a1a',  // 眼黑
      N: '#ff6f00'   // 嘴橙
    },
    pixels: [
      '................................',
      '................................',
      '.........MMMMMMM................',
      '........MMMMMMMMM...............',
      '........MMMMMMMMM...............',
      '.......MMMMMMMMMMM..............',
      '......MMMWWWWWWWMMMM............',
      '.....MMMWWWWWWWWWWMMM...........',
      '.....MMMWWWEEEEWWWMMMM..........',
      '....MMMWWWEEEEWWWWWMMM..........',
      '....MMWWWEEEEWWWWWWMM...........',
      '....MMWMWEEEEWWMMMMM............',
      '....MMMMMWNNWMMMMM..............',
      '....MMMMMMWWNMMMMM..............',
      '....MMMMMMMMMMMMMMM.............',
      '....MMLMMMMMMMMMMMM.............',
      '....MMLMMMMMMMMMMMM.............',
      '....MMLMMMMMMMMMMMMM............',
      '....MMLMMMMMMMMMMMMMM...........',
      '....MMMMMMMMMMMMMMMMMM..........',
      '....MMMMMMMMMMMMMMMMMM..........',
      '....MMMMMMMMMMMMMMMMMM..........',
      '.....MMMMMMMMMMMMMMMM...........',
      '.....MMMMMMMMMMMMMMMM...........',
      '......MMMMMMMMMMMMMM............',
      '.......MMMMMMMMMMMM.............',
      '.......MMMMMMMMMMMM.............',
      '........MMMMMMMMMM..............',
      '........MMMM..MMMM..............',
      '........MMMM..MMMM..............',
      '.......MMMM....MMMM.............',
      '................................',
    ]
  },

  // 天鹅：纯白身 + S形长颈 + 红弯嘴 + 翅尖微翘
  swan: {
    palette: {
      ...BASE,
      M: '#ffffff',  // 纯白
      S: '#e0e0e0',  // 阴影
      L: '#fafafa',  // 亮白
      N: '#d32f2f',  // 嘴红
      K: '#1a1a1a'   // 眼黑
    },
    pixels: [
      '................................',
      '................................',
      '................................',
      '..............NMN...............',
      '.............NNM................',
      '.............NMM................',
      '.............MMM................',
      '.............MMM................',
      '.............MMM................',
      '............MMMM................',
      '............MMMM................',
      '............MMMLM...............',
      '............MMMMM...............',
      '............MMMMM...............',
      '............MMMMM...............',
      '...........MMMMMMM..............',
      '..........MMMMMMMMM.............',
      '.........MMMMMMMMMMM............',
      '........MMMMMMMMMMMMM...........',
      '.......MMMMMMMMMMMMMMM..........',
      '......MMMEMMMMMMMMMMMMM.........',
      '......MMMKMMMMMMMMMMMMMMMM......',
      '......MMMMLMMMMMMMMMMMMMMMM.....',
      '......MMMMLMMMMMMMMMMMMMMMM.....',
      '......MMMMMMMMMMMMMMMMMMMM......',
      '......MMMMMMMMMMMMMMMMMMMM......',
      '.......MMMMMMMMMMMMMMMMMM.......',
      '........MMMMMMMMMMMMMMMM........',
      '.........MMMMMMMMMMMMM..........',
      '..........MMMMMMMMMMM...........',
      '................................',
      '................................',
    ]
  },

  // ============ 第5章 海洋 补 ============

  // 海豚：天蓝灰流线身 + 三角背鳍 + 笑脸弧嘴 + 尾鳍
  dolphin: {
    palette: {
      ...BASE,
      M: '#64b5f6',  // 天蓝灰
      S: '#42a5f5',  // 暗蓝
      L: '#90caf9',  // 亮蓝
      W: '#ffffff'   // 肚白
    },
    pixels: [
      '................................',
      '................................',
      '................................',
      '...............MMMM.............',
      '.............MMMMMMM............',
      '............MMMMMMMMM...........',
      '...........MMMMMMMMMMM..........',
      '..........LMMMMMMMMMMMM.........',
      '.........LMMMMMMMMMMMMMM........',
      '........LMMMMMMMMMMMMMMMM.......',
      '.......LMMMMMEEMMMMMMMMMM.......',
      '.......MMMMMEEMMMMMMMMMMM.......',
      '.......MMMMSMMMMMMMMMMMMM.......',
      '.......MMMMMMMMMMMMWWMMM........',
      '........MMMMMMWWWWWWWWMM........',
      '........MMMMMWWWWWWWWWMMM.......',
      '........MMMMWWWWWWWWWWWMM.......',
      '.........MMMWWWWWWWWWWMMM.......',
      '.........MMWWWWWWWWWWWMM........',
      '.........MMMMMMWWWWWWWMM........',
      '..........MMMMMMWWWWWMMM........',
      '..........MMMMMMMMMMMMM.........',
      '...........MMMMMMMMMMMM.........',
      '...........MMMMMMMMMMMM.........',
      '............MMMMMMMMMM..........',
      '............MMMMMMM.............',
      '.............MMMMMMM............',
      '............MMMM.MMMM...........',
      '...........MMMM...MMMM..........',
      '..........MMMM.....MMMM.........',
      '.........MMMM.......MMM.........',
      '..........M.....................',
    ]
  },

  // 海龟：深绿壳 + 浅绿头肢 + 龟壳纹理
  turtle: {
    palette: {
      ...BASE,
      M: '#2e7d32',  // 深绿壳
      S: '#1b5e20',  // 暗绿
      L: '#66bb6a',  // 亮绿头肢
      T: '#a5d6a7'   // 壳纹浅绿
    },
    pixels: [
      '................................',
      '................................',
      '................................',
      '.........LLL....................',
      '........LLLLL...................',
      '.......LLLLLLL..................',
      '......LLLLLLLLMMMMMMM...........',
      '.....LLLLLLLMMMMMMMMMMM.........',
      '....LLLLLLLMMMMMTTMMMMMMM.......',
      '..LLLMMMMMMMTTTMTTTMMMMMMM......',
      '.LLLLMMMMMTTTTMMTTTTMMMMMM......',
      '.LLLMMMMTTTTTMMTTTTTMMMMMMM.....',
      '...MMMMTTTTTTMMTTTTTMMMMMMM.....',
      '...MMMMTTTTTTMTTTTTTMMMMML......',
      '...MMMMTTTTTTMTTTTTTMMMMML......',
      '...MMMMTTTTTTMTTTTTTMMMLLL......',
      '....MMMMMTTTTMTTTTMMMMLLL.......',
      '....MMMMMMTTTTTTTMMMMLLL........',
      '.....MMMMMMTTTTTMMMMLLL.........',
      '......MMMMMMTTTMMMMLLL..........',
      '.......MMMMMTMMMMLLL............',
      '........LLLMMMMMMMML............',
      '.......LLLLLMMMMMMML............',
      '......LLLLLLLMMMMML.............',
      '.....LLLLLLLLLLMML..............',
      '....LLLLLLLLLLLLL...............',
      '.....LLLLLLLLLLLL...............',
      '.....LLLLL...LLLLL..............',
      '.....LLLLL...LLLLL..............',
      '....LLLLL.....LLLLL.............',
      '...LLLLL.......LLLLL............',
      '................................',
    ]
  }
}

/**
 * 绘制单个动物到 Canvas 上下文
 *
 * @param ctx Canvas 2D 上下文
 * @param animal 动物类型
 * @param frame 帧：'idle' | 'hover'
 * @param scale 缩放倍数（1 = 32px，2 = 64px...）
 * @param offsetX 画布内 x 偏移
 * @param offsetY 画布内 y 偏移
 */
export function drawAnimal(
  ctx: CanvasRenderingContext2D,
  animal: AnimalType,
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
}

/**
 * 获取动物的背景色（用于牌面背景）
 * 固定浅色背景，不跟随动物主色，避免同色融合看不出轮廓
 */
export function getAnimalBgColor(_animal: AnimalType): string {
  return '#f8f5ee'
}

/**
 * 动物中文名映射（30 种）
 */
export const ANIMAL_NAMES: Record<AnimalType, string> = {
  // 第1章 家畜
  sheep: '绵羊',
  pig: '小猪',
  chicken: '小鸡',
  dog: '小狗',
  horse: '小马',
  cow: '奶牛',
  // 第2章 野生
  tiger: '老虎',
  lion: '狮子',
  bear: '棕熊',
  fox: '狐狸',
  wolf: '灰狼',
  eagle: '雄鹰',
  // 第3章 森林
  frog: '青蛙',
  crocodile: '鳄鱼',
  elephant: '大象',
  panda: '熊猫',
  monkey: '猴子',
  deer: '小鹿',
  // 第4章 鸟类
  flamingo: '火烈鸟',
  peacock: '孔雀',
  penguin: '企鹅',
  parrot: '鹦鹉',
  owl: '猫头鹰',
  swan: '天鹅',
  // 第5章 海洋
  fish: '小鱼',
  whale: '鲸鱼',
  octopus: '章鱼',
  jellyfish: '水母',
  dolphin: '海豚',
  turtle: '海龟'
}

/** 绘制机制遮罩（在动物之上） */
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
      // 乌云遮罩 - 顶层深色
      ctx.fillStyle = '#37474f'
      ctx.beginPath()
      // jagged cloud shape
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
      // small lightning bolt
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
      // 绿色藤蔓缠绕
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
      // 叶片
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
      // ZZZ气泡 + 半透明暗色
      ctx.fillStyle = 'rgba(30,30,60,0.3)'
      ctx.fillRect(0, 0, s, s)
      // bubbles
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
      // 金色问号
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
      // 半透明气泡 + 内部模糊
      ctx.fillStyle = 'rgba(144,202,249,0.4)'
      ctx.beginPath()
      ctx.arc(half, half, half*0.85, 0, Math.PI*2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'
      ctx.lineWidth = 2
      ctx.stroke()
      // 高光
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
  // gold sparkle
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


