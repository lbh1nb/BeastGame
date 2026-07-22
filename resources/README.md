# 资源文件说明

本目录存放游戏运行所需的静态资源。打包时会被 electron-builder 复制到应用的 `resources/` 目录下。

## 目录结构

```
resources/
├── audio/          # 音频文件（BGM + 音效）
├── icon.png        # 应用图标（256x256 或更大）
└── README.md       # 本文件
```

## 音频文件清单

游戏启动时会优先用 Howler.js 加载以下音频文件，**文件缺失时回退到 ToneGenerator 程序化合成**，不影响游戏运行。

所有音频文件已随包提供，来源为 [Mixkit](https://mixkit.co/)（Mixkit License，免费商用，无需署名）。

### 背景音乐（BGM，循环播放）

| 文件名 | 用途 |
|---|---|
| `bgm_home.mp3` | 主菜单背景音乐 |
| `bgm_game.mp3` | 经典模式游戏中背景音乐 |
| `bgm_level.mp3` | 闯关模式背景音乐 |

### 音效（SFX，一次性播放）

| 文件名 | 用途 |
|---|---|
| `sfx_click.mp3` | 点击图案 |
| `sfx_match.mp3` | 消除成功 |
| `sfx_combo.mp3` | 连击触发（普通） |
| `sfx_fail.mp3` | 游戏失败 |
| `sfx_win.mp3` | 游戏胜利 |
| `sfx_prop_undo.mp3` | 使用撤回道具 |
| `sfx_prop_shuffle.mp3` | 使用洗牌道具 |
| `sfx_prop_hint.mp3` | 使用提示道具 |

### 连击夸赞音效（连击达阈值时播放，配合弹幕）

| 文件名 | 触发条件 | 夸赞文案 |
|---|---|---|
| `sfx_combo_good.mp3` | 连击 ≥ 3 | GOOD! |
| `sfx_combo_nice.mp3` | 连击 ≥ 5 | NICE! |
| `sfx_combo_great.mp3` | 连击 ≥ 7 | GREAT! |
| `sfx_combo_amazing.mp3` | 连击 ≥ 10 | AMAZING! |
| `sfx_combo_unbelievable.mp3` | 连击 ≥ 15 | UNBELIEVABLE! |
| `sfx_combo_godlike.mp3` | 连击 ≥ 20 | GOD LIKE! |

### 动物叫声（悬停时播放，每种动物一个文件）

| 文件名 | 动物 |
|---|---|
| `animal_sheep.mp3` | 绵羊 |
| `animal_chicken.mp3` | 小鸡 |
| `animal_cat.mp3` | 小猫 |
| `animal_dog.mp3` | 小狗 |
| `animal_rabbit.mp3` | 兔子 |
| `animal_hamster.mp3` | 仓鼠 |
| `animal_tiger.mp3` | 老虎 |
| `animal_bear.mp3` | 小熊 |
| `animal_fish.mp3` | 小鱼 |
| `animal_whale.mp3` | 鲸鱼 |
| `animal_duck.mp3` | 小鸭 |
| `animal_goose.mp3` | 白鹅 |

## 音频格式建议

- 格式：MP3（兼容性最好）
- BGM 时长：30-60 秒（循环播放）
- SFX 时长：0.3-1 秒
- 采样率：44100Hz
- 音量：归一化到 -3dB

## 应用图标

`icon.png` 为应用图标，建议尺寸 256x256 或 512x512，PNG 格式。
打包时 electron-builder 会自动使用此图标生成 .ico。
若文件不存在，将使用 Electron 默认图标。

## 动物图案

动物图案使用 Canvas 程序化绘制 24×24 像素风 Q 萌动物（在 `pixel-animal.ts` 中定义），无需额外图片素材。
12 种动物有独特体型轮廓+配色纹理：
- 绵羊(圆形蓬松+黑脸+卷毛)  小鸡(圆胖+橙尖嘴+三角冠)
- 小猫(椭圆+长尾+条纹)      小狗(方形+垂耳+红项圈)
- 兔子(高个+超长耳)         仓鼠(短胖+大颊囊+橙白双色)
- 老虎(椭圆+黑条纹+凶眉)    小熊(圆肚+米色胸+圆耳)
- 小鱼(流线型+三角尾鳍+鳞片) 鲸鱼(大椭圆+喷水+白肚)
- 小鸭(椭圆+扁嘴+翅膀)      白鹅(S形长脖+橙脚)

悬停时动物会弹跳+眨眼，并播放对应的动物叫声音效。

## 音频来源与许可

| 类别 | 来源 | 许可 |
|---|---|---|
| BGM（3首） | Mixkit Free Stock Music | Mixkit License（免费商用，无需署名） |
| SFX（14个） | Mixkit Free Sound Effects | Mixkit License（免费商用，无需署名） |
| 动物音效（12个） | Mixkit Free Sound Effects | Mixkit License（免费商用，无需署名） |

### 替代音效说明

Mixkit 无以下动物的真实录音，使用相近音效替代：

| 动物 | 替代音效 | 说明 |
|---|---|---|
| 绵羊 | 牛叫（cow moo） | 同为农场反刍动物 |
| 兔子 | 小鸟啁啾（bird chirp） | 小动物轻声 |
| 仓鼠 | 蟋蟀鸣叫（cricket） | 吱吱声 |
| 鲸鱼 | 海洋环境声（ocean） | 海洋氛围 |
| 老虎 | 狮子吼叫（lion roar） | 同为大型猫科 |
| 小鱼 | 水流声（water） | 水声氛围 |
