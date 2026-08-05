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
  /** 物品简介（收藏详情弹窗展示） */
  desc: string
}

/** 56 件收藏物品：动物 → 专属可爱物品 */
export const COLLECTION_ITEMS: Record<AnimalType, CollectionItemDef> = {
  // 第1章 家畜
  sheep: { name: '毛线球', img: 'sheep_item.png', desc: '粉粉软软的毛线球，绵羊把它当宝贝，绕出的线头仿佛在织一朵云。' },
  pig: { name: '存钱罐', img: 'pig_item.png', desc: '粉嘟嘟的小猪存钱罐，塞满硬币就叮当作响，是贪吃猪的私房宝贝。' },
  chicken: { name: '黄金蛋', img: 'chicken_item.png', desc: '会发光的金色蛋，据说孵一孵就能孵出好运。' },
  cow: { name: '奶牛铃铛', img: 'cow_item.png', desc: '黑白奶牛纹的大铃铛，摇起来会发出哞哞的回响。' },
  horse: { name: '幸运蹄铁', img: 'horse_item.png', desc: '银光闪闪的蹄铁，挂在门口能带来一路顺风的好运。' },
  goat: { name: '小草垛', img: 'goat_item.png', desc: '一捆香喷喷的干草垛，是山羊最爱的午后零食。' },
  duck: { name: '黄小鸭', img: 'duck_item.png', desc: '圆滚滚的黄色小鸭，放进浴缸就会自己游泳。' },
  rooster: { name: '小闹钟', img: 'rooster_item.png', desc: '红色的小闹钟，每天清晨准时叫醒整座山谷。' },
  // 第2章 野兽
  tiger: { name: '条纹围巾', img: 'tiger_item.png', desc: '橙黑条纹的围巾，戴上它威风凛凛又暖乎乎的。' },
  lion: { name: '金色皇冠', img: 'lion_item.png', desc: '华丽的金色小皇冠，百兽之王的珍藏心头好。' },
  bear: { name: '蜂蜜罐', img: 'bear_item.png', desc: '盛满晶莹蜂蜜的圆木罐，滴下来的蜜香甜诱人。' },
  wolf: { name: '弯月项链', img: 'wolf_item.png', desc: '银色弯月吊坠，夜里会泛起淡淡的月光。' },
  fox: { name: '魔法胡萝卜', img: 'fox_item.png', desc: '发着橙光的魔法胡萝卜，里面藏着小狐狸的小心思。' },
  zebra: { name: '斑马袜', img: 'zebra_item.png', desc: '黑白条纹的毛线袜，穿上它瞬间变身小斑马。' },
  camel: { name: '沙漠水壶', img: 'camel_item.png', desc: '憨态可掬的卡通水壶，装满了沙漠里的甘泉。' },
  giraffe: { name: '超长围巾', img: 'giraffe_item.png', desc: '长到能绕脖子好几圈的围巾，是长颈鹿的骄傲。' },
  boar: { name: '巧巧橡果', img: 'boar_item.png', desc: '圆滚滚的棕色橡果，藏着野猪的机智小秘密。' },
  cheetah: { name: '疾风跑鞋', img: 'cheetah_item.png', desc: '黄底黑斑的跑鞋，穿上就能跑出一串残影。' },
  // 第3章 森林
  monkey: { name: '香蕉串', img: 'monkey_item.png', desc: '一串金黄的香蕉，猴子见了就乐开了花。' },
  panda: { name: '鲜嫩竹笋', img: 'panda_item.png', desc: '翠绿鲜嫩的竹笋，是熊猫嘎嘣脆的限量点心。' },
  deer: { name: '幸运四叶草', img: 'deer_item.png', desc: '翠绿的四叶草，遇见它就是好运的开始。' },
  moose: { name: '鹿角挂饰', img: 'moose_item.png', desc: '优雅的鹿角造型挂饰，挂满了森林的回忆。' },
  kangaroo: { name: '育儿小包', img: 'kangaroo_item.png', desc: '温暖的小袋，装满了袋鼠妈妈软软的温柔。' },
  koala: { name: '桉叶香囊', img: 'koala_item.png', desc: '散发着桉叶清香的香囊，闻一闻就忍不住想打盹。' },
  squirrel: { name: '香脆榛果', img: 'squirrel_item.png', desc: '香脆可口的榛果，是松鼠攒了一整个秋天的存粮。' },
  raccoon: { name: '蒙面眼罩', img: 'raccoon_item.png', desc: '酷酷的黑色眼罩，戴上它偷吃蜂蜜就不怕被抓包。' },
  meerkat: { name: '瞭望望远镜', img: 'meerkat_item.png', desc: '儿童望远镜，踮起脚尖就能看得又高又远。' },
  hare: { name: '小怀表', img: 'hare_item.png', desc: '古铜色的小怀表，滴答滴答记录着奔跑的时光。' },
  // 第4章 小动物
  rabbit: { name: '白萝卜', img: 'rabbit_item.png', desc: '水灵灵的大白萝卜，兔子一口咬下去咔嚓响。' },
  cat: { name: '逗猫棒', img: 'cat_item.png', desc: '缀着羽毛和铃铛的逗猫棒，猫咪永远追也追不够。' },
  dog: { name: '香喷喷骨头', img: 'dog_item.png', desc: '带着肉香的香骨头，是狗狗的终极奖赏。' },
  otter: { name: '圆滑小石', img: 'otter_item.png', desc: '被河水磨得圆滑的小石头，水獭能玩上一整天。' },
  badger: { name: '小铲子', img: 'badger_item.png', desc: '卡通小铲子，獾用它挖出藏在地下的美味。' },
  beaver: { name: '圆木段', img: 'beaver_item.png', desc: '结实的圆木段，是河狸筑大坝攒下的好建材。' },
  hedgehog: { name: '红苹果', img: 'hedgehog_item.png', desc: '红彤彤的大苹果，刺猬背着它慢悠悠地回家。' },
  skunk: { name: '香水瓶', img: 'skunk_item.png', desc: '精致的小香水瓶，臭鼬却用它装满香喷喷的味道。' },
  // 第5章 海洋
  fish: { name: '鱼食罐', img: 'fish_item.png', desc: '圆形的小鱼食罐，一摇就能撒出美味泡泡。' },
  whale: { name: '喷水花朵', img: 'whale_item.png', desc: '会喷出花型水柱的鲸鱼小摆件，咕噜咕噜冒泡泡。' },
  dolphin: { name: '呼啦圈', img: 'dolphin_item.png', desc: '彩色的呼啦圈，是海豚跃出水面的好道具。' },
  octopus: { name: '墨水瓶', img: 'octopus_item.png', desc: '墨水瓶，章鱼偷偷用它写海里的童话故事。' },
  jellyfish: { name: '水母小灯', img: 'jellyfish_item.png', desc: '发着柔光的小水母灯，为深海点亮一盏暖灯。' },
  turtle: { name: '龟壳小包', img: 'turtle_item.png', desc: '龟壳造型的小包，背着它慢慢走也不心慌。' },
  crab: { name: '贝壳胸针', img: 'crab_item.png', desc: '精致的贝壳胸针，螃蟹别在胸前神气活现。' },
  seahorse: { name: '小锚挂件', img: 'seahorse_item.png', desc: '闪闪的小锚挂件，海马也有远航的大梦想。' },
  shark: { name: '鲨鱼牙项链', img: 'shark_item.png', desc: '鲨鱼牙齿做的项链，酷劲十足又带点萌。' },
  crocodile: { name: '鳄鱼手袋', img: 'crocodile_item.png', desc: '鳄鱼皮纹小手袋，满满装着沼泽的小秘密。' },
  // 第6章 综合
  hippo: { name: '泡泡浴帽', img: 'hippo_item.png', desc: '泡泡浴帽，河马洗澡时最爱戴着它。' },
  rhino: { name: '犀牛角号', img: 'rhino_item.png', desc: '犀牛角号角，一吹就唤醒清晨的草原。' },
  elephant: { name: '小喷水壶', img: 'elephant_item.png', desc: '大象造型的喷水壶，能喷出一道彩虹水花。' },
  frog: { name: '荷叶伞', img: 'frog_item.png', desc: '荷叶造型的小伞，青蛙下雨天也不湿脚。' },
  seal: { name: '沙滩球', img: 'seal_item.png', desc: '红白蓝的沙滩球，海豹拍拍球就开心。' },
  owl: { name: '月亮眼镜', img: 'owl_item.png', desc: '圆框月亮眼镜，猫头鹰夜里看得清清楚楚。' },
  goose: { name: '洁白羽毛', img: 'goose_item.png', desc: '一片洁白的羽毛，是白鹅送给风的情书。' },
  penguin: { name: '红蝴蝶结', img: 'penguin_item.png', desc: '鲜红的蝴蝶结，企鹅戴上立马变得精神。' },
  flamingo: { name: '粉羽扇', img: 'flamingo_item.png', desc: '粉色羽毛扇，火烈鸟轻轻一扇就翩然起舞。' },
  ostrich: { name: '复古墨镜', img: 'ostrich_item.png', desc: '复古圆框墨镜，鸵鸟戴上超有范儿。' }
}

/** 收藏物品总数（56） */
export const COLLECTION_ITEM_TOTAL = Object.keys(COLLECTION_ITEMS).length

/** 取某动物的收藏物品定义（兜底） */
export function collectionItemOf(animal: AnimalType): CollectionItemDef {
  return COLLECTION_ITEMS[animal] ?? { name: '神秘物品', img: 'mystery_item.png', desc: '神秘的物品，猜猜它属于谁？' }
}