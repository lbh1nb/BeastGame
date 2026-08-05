/**
 * 兽了个兽 - 收藏品物品映射
 * 纯逻辑层，不依赖 vue / electron
 *
 * 每个动物对应一件"专属可爱物品"作为收藏品（id 仍为动物名，展示层映射到物品）。
 * 物品图片由 work 端生成，存放于 resources/collection/{animal}_item.png。
 */
import type { AnimalType } from './types'

/** 单件收藏物品定义 */
export interface CollectionItemDef {
  /** 物品中文名（收藏册/掉落弹窗展示） */
  name: string
  /** 物品图片文件名（resources/collection/ 下），如 sheep_item.png */
  img: string
}

/** 56 件收藏物品：动物 → 专属可爱物品 */
export const COLLECTION_ITEMS: Record<AnimalType, CollectionItemDef> = {
  // 第1章 家畜
  sheep: { name: '毛线球', img: 'sheep_item.png' },
  pig: { name: '存钱罐', img: 'pig_item.png' },
  chicken: { name: '黄金蛋', img: 'chicken_item.png' },
  cow: { name: '奶牛铃铛', img: 'cow_item.png' },
  horse: { name: '幸运蹄铁', img: 'horse_item.png' },
  goat: { name: '小草垛', img: 'goat_item.png' },
  duck: { name: '黄小鸭', img: 'duck_item.png' },
  rooster: { name: '小闹钟', img: 'rooster_item.png' },
  // 第2章 野兽
  tiger: { name: '条纹围巾', img: 'tiger_item.png' },
  lion: { name: '金色皇冠', img: 'lion_item.png' },
  bear: { name: '蜂蜜罐', img: 'bear_item.png' },
  wolf: { name: '弯月项链', img: 'wolf_item.png' },
  fox: { name: '魔法胡萝卜', img: 'fox_item.png' },
  zebra: { name: '斑马袜', img: 'zebra_item.png' },
  camel: { name: '沙漠水壶', img: 'camel_item.png' },
  giraffe: { name: '超长围巾', img: 'giraffe_item.png' },
  boar: { name: '巧巧橡果', img: 'boar_item.png' },
  cheetah: { name: '疾风跑鞋', img: 'cheetah_item.png' },
  // 第3章 森林
  monkey: { name: '香蕉串', img: 'monkey_item.png' },
  panda: { name: '鲜嫩竹笋', img: 'panda_item.png' },
  deer: { name: '幸运四叶草', img: 'deer_item.png' },
  moose: { name: '鹿角挂饰', img: 'moose_item.png' },
  kangaroo: { name: '育儿小包', img: 'kangaroo_item.png' },
  koala: { name: '桉叶香囊', img: 'koala_item.png' },
  squirrel: { name: '香脆榛果', img: 'squirrel_item.png' },
  raccoon: { name: '蒙面眼罩', img: 'raccoon_item.png' },
  meerkat: { name: '瞭望望远镜', img: 'meerkat_item.png' },
  hare: { name: '小怀表', img: 'hare_item.png' },
  // 第4章 小动物
  rabbit: { name: '白萝卜', img: 'rabbit_item.png' },
  cat: { name: '逗猫棒', img: 'cat_item.png' },
  dog: { name: '香喷喷骨头', img: 'dog_item.png' },
  otter: { name: '圆滑小石', img: 'otter_item.png' },
  badger: { name: '小铲子', img: 'badger_item.png' },
  beaver: { name: '圆木段', img: 'beaver_item.png' },
  hedgehog: { name: '红苹果', img: 'hedgehog_item.png' },
  skunk: { name: '香水瓶', img: 'skunk_item.png' },
  // 第5章 海洋
  fish: { name: '鱼食罐', img: 'fish_item.png' },
  whale: { name: '喷水花朵', img: 'whale_item.png' },
  dolphin: { name: '呼啦圈', img: 'dolphin_item.png' },
  octopus: { name: '墨水瓶', img: 'octopus_item.png' },
  jellyfish: { name: '水母小灯', img: 'jellyfish_item.png' },
  turtle: { name: '龟壳小包', img: 'turtle_item.png' },
  crab: { name: '贝壳胸针', img: 'crab_item.png' },
  seahorse: { name: '小锚挂件', img: 'seahorse_item.png' },
  shark: { name: '鲨鱼牙项链', img: 'shark_item.png' },
  crocodile: { name: '鳄鱼手袋', img: 'crocodile_item.png' },
  // 第6章 综合
  hippo: { name: '泡泡浴帽', img: 'hippo_item.png' },
  rhino: { name: '犀牛角号', img: 'rhino_item.png' },
  elephant: { name: '小喷水壶', img: 'elephant_item.png' },
  frog: { name: '荷叶伞', img: 'frog_item.png' },
  seal: { name: '沙滩球', img: 'seal_item.png' },
  owl: { name: '月亮眼镜', img: 'owl_item.png' },
  goose: { name: '洁白羽毛', img: 'goose_item.png' },
  penguin: { name: '红蝴蝶结', img: 'penguin_item.png' },
  flamingo: { name: '粉羽扇', img: 'flamingo_item.png' },
  ostrich: { name: '复古墨镜', img: 'ostrich_item.png' }
}

/** 收藏物品总数（56） */
export const COLLECTION_ITEM_TOTAL = Object.keys(COLLECTION_ITEMS).length

/** 取某动物的收藏物品定义（兜底） */
export function collectionItemOf(animal: AnimalType): CollectionItemDef {
  return COLLECTION_ITEMS[animal] ?? { name: '神秘物品', img: 'mystery_item.png' }
}