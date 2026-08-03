#!/usr/bin/env python3
"""Generate the complete pixel-animal.ts with all 30 redesigned 48x48 sprites.

Each pixel row is exactly 48 characters. Each sprite has exactly 48 rows.
Colors: '.'=transparent, 'K'=outline, 'W'=white, 'M'=main, 'S'=shadow, 'L'=light,
        'P'=pink, 'E'=eye, 'B'=red/comb, 'N'=orange/beak, 'T'=texture,
        'C'=decorative, 'H'=water/highlight
"""

import os

OUTPATH = r"D:\ai\beast\src\renderer\src\utils\pixel-animal.ts"

# Each sprite: (name, palette_overrides, pixel_rows)
# palette_overrides: dict of char->color to merge onto BASE
# pixel_rows: list of 48 strings, each exactly 48 chars

BASE_PALETTE = {
    'K': '#1a1a1a',
    'W': '#ffffff',
    'M': '#cccccc',
    'S': '#999999',
    'L': '#eeeeee',
    'P': '#ffb3c1',
    'E': '#1a1a1a',
    'B': '#c0392b',
    'N': '#ff6f00',
    'T': '#000000',
    'C': '#e91e63',
    'H': '#81d4fa',
}

# Helper: make a full row string
D = '.'
def row(s):
    """Pad or truncate to exactly 48 characters."""
    if len(s) < 48:
        s = s + '.' * (48 - len(s))
    return s[:48]

def sp(animal_key, comment, palette_overrides, pixel_rows):
    """Build the TypeScript sprite definition string."""
    pal = dict(BASE_PALETTE)
    pal.update(palette_overrides)
    pal_lines = [f"      {k}: '{v}'," for k, v in pal.items()]

    px_lines = []
    for i, r in enumerate(pixel_rows):
        comma = ',' if i < 47 else ''
        px_lines.append(f"      '{row(r)}'{comma}")

    return f"""  // {comment}
  {animal_key}: {{
    palette: {{
{chr(10).join(pal_lines)}
    }},
    pixels: [
{chr(10).join(px_lines)}
    ]
  }}"""


# ============================
# ALL 30 ANIMALS
# ============================

SPRITES = []

# --- Chapter 1: Farm Animals ---
SPRITES.append(sp('sheep', '绵羊：蓬松奶油白云朵身体 + 黑脸黑腿 + 粉色脸蛋 + 侧视图（面向右）', {
    'M': '#f5f0e8', 'S': '#d4cfc5', 'L': '#fffef9', 'K': '#2c2c2c', 'P': '#ffb3c1',
}, [
    D*48, D*48, D*48, D*48, D*48,
    '.....................MMMMMM.............................',
    '...................MMMMMMMMMM...........................',
    '.................MMMMMMMMMMMMMM.........................',
    '...............MMMMMMMMMMMMMMMMMMM......................',
    '..............MMMMMMMMMMMMMMMMMMMMM.....................',
    '............MMMMMMMMMMMMMMMMMMMMMMMMM...................',
    '..........MMMMMMMMMMMMMMMMMMMMMMMMMMMMM.................',
    '.........MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM................',
    '........MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM..............',
    '.......MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.............',
    '......MMMMMLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.............',
    '......MMMMLLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.............',
    '.....MMMMLLMMMKKKKKKMMMMMMMMMMMMMMLMMMMMMM..............',
    '....MMMMLLLMMKKKKKKKMMMMMMMMMMMMMLLLMMMMMMM.............',
    '....MMMMLLLMMKWWWWEEKMMMMMMMMMMMMLLLLMMMMMM.............',
    '....MMMMLLLLMKWWWWEEKMMMMMMMMMMMMMLLLLMMMMM.............',
    '....MMMMMLLLMMKPPPPPKKMMMMMMMMMMMMLLLLMMMMM.............',
    '....MMMMMLLLLMMKKKKKKKMMMMMMMMMMMMMLLLMMMMM.............',
    '.....MMMMLLLMMMMMMMMMMMMMMMMMMLMMMMMMMMMMMM.............',
    '.....MMMMLLLMMMMMMMMMMMMMMMMLLLMMMMMMMMMMMM.............',
    '......MMMMLLMMMMMMMMMMMMMMMMLLMMMMMMMMMMMM..............',
    '......MMMMMLLMMMMMMMMMMMMMMLLMMMMMMMMMMMMM..............',
    '.......MMMMMLLLMMMMMMMMMMLLLMMMMMMMMMMMMM...............',
    '........MMMMSSSSSMMMMMMSSSSSMMMMMMMMMMM.................',
    '.........MMMSSSSSSSSSSSSSSSSSMMMMMMMMM..................',
    '..........MMMMSSSSSSSSSSSSSSSSMMMMMMMM..................',
    '...........MMMSSSSSSSSSSSSSSSSMMMMMMM...................',
    '............MMMMSSSSSSSSSSSSSSSMMMMMM...................',
    '.............MMMMSSSSSSSSSSSSSMMMMM.....................',
    '..............MMMMSSSSSSSSSSSMMMM.......................',
    '...............MMMMMSSSSSSSSSMMM........................',
    '.................MMMMSSSSSSSMM..........................',
    '...................MMMMSSSMMM...........................',
    '....................MMMMSMMM............................',
    '.....................MMMMMM.............................',
    '.....................MM..MM.............................',
    '....................MM....MM............................',
    '...................MM......MM...........................',
    '..................MM........MM..........................',
    '.................MM..........MM.........................',
    '.................MM..........MM.........................',
    '................MM............MM........................',
]))

SPRITES.append(sp('pig', '小猪：粉红圆胖身体 + 大耳朵 + 突出圆鼻子 + 小卷尾 + 侧视图（面向右）', {
    'M': '#f8a4b8', 'S': '#e87890', 'L': '#ffd0da', 'P': '#ff8a80', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48,
    '.............MMMMM............MMMMM.................',
    '............MMMMMMM..........MMMMMMM................',
    '...........MMMMMMMMM........MMMMMMMMM...............',
    '..........MMLLMMMMMMM......MMLLMMMMMMM..............',
    '.........MMLLLMMMMMMM......MMLLLMMMMMMM.............',
    '.........MMLLLMMMMMMM......MMLLLMMMMMMM.............',
    '........MMMMMMMMMMMMM.......MMMMMMMMMMMM............',
    '.......MMMMLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.......',
    '......MMMLLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.......',
    '.....MMMLLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.......',
    '....MMMLLLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM......',
    '....MMMMMMMMWWEEEEWMMMMMMMMMMMMMMMMMMMMMMMMMMM......',
    '...MMMMMMMMMWWEEEEEWMMMMMMMMMMMMMMMMMMMMMMMMMM......',
    '...MMMMMMMMWWWWWEWWWMMMMMMMMMMMMMMMMMMMMMMMMMM......',
    '...MMMMMMWWWWWWWWWWWMMMMMMMMMMMMMMMMMMMMMMMMM.......',
    '...MMMMMMPPKKKWWWKKPPKKKKKKMMMMMMMMMMMMMMMMMM.......',
    '...MMMMMMPPKKKKWKKKPPKKKKKKKMMMMMMMMMMMMMMMM........',
    '...MMMMMMPPKKKKKPPKKKKKKKKKKMMMMMMMMMMMMMMMM........',
    '...MMMMMMPPPKKKPPPPPKKKKKKKKMMMMMMMMMMMMMMM.........',
    '...MMMMMMMPPPPPPPPKKPPKKKPPMMMMMMMMMMMMMMM..........',
    '....MMMMMMPPPPPPPPKPPKKPPPPPMMMMMMMMMMMMM...........',
    '....MMMMMMPPPPPPPPKPPPPPKKPMMMMMMMMMMMM.............',
    '.....MMMMMMPPPPPPPKKPPPKKPPMMMMMMMMMMM..............',
    '......MMMMMMPPPPPPKKPPKKKM.MMMMMMMMM................',
    '.......MMMMMMPPPPPPKPPKMM..MMMMMMM..................',
    '........MMMMMMPPPPPKKPMM..MMMMM.....................',
    '.........MMMMMMPPPPPPKM..MMMMMM.....................',
    '..........MMMMMMMPPPPMM.MMMMM.......................',
    '...........MMMMMMMPPPMMMMMM.........................',
    '............MMMMMMMPPMMMMMM.........................',
    '.............MMMMMMPMMMMMM..........................',
    '..............MMMMMMPMMMM...........................',
    '...............MMMMMPMM.............................',
    '................MMMMPMM.............................',
    '.................MMMMMM.............................',
    '..................MMM...............................',
    '..................MMM...............................',
    '.................MM.MMM.............................',
    '................MM...MMM............................',
    '................MM...MMM............................',
    '...............MM.....MMM...........................',
    '..............MM.......MMM..........................',
    '.............MM.........MMM.........................',
]))

SPRITES.append(sp('chicken', '小鸡：明黄圆身 + 大红冠 + 橙色小尖嘴 + 小翅膀 + 侧视图（面向右）', {
    'M': '#fff176', 'S': '#f9a825', 'L': '#ffffc5', 'B': '#e53935', 'N': '#ff8f00', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48,
    '......................BBBB..........................',
    '.....................BBBBBB.........................',
    '....................BBBBBBBB........................',
    '...................BBBBBBBBBB.......................',
    '..................BBBBBBBBBBBB......................',
    '.................BBBBBBBBBBBBBB.....................',
    '.................BBBBBBBBBBBBBB.....................',
    '.................BBBBBBBBBBBBBB.....................',
    '................BBBBBBBBBBBBBBBB....................',
    '................BBBBBBBBBBBBBBBB....................',
    '................BBBBBBBBBBBBBBBB....................',
    '...............BBBBBBBBBBBBBBBBBB...................',
    '..............BBBBBBBBBBBBBBBBBBBB..................',
    '.............BBBBBBBBBBBBBBBBBBBBBB............NNN.',
    '.............MMMMBBBBBBBBBBBBMMMMM...........NNNNN.',
    '............MMMMMMMBBBBBBBMMMMMM...........NNNNNNN.',
    '............MMMMMMMMMMMMMMM..............NNNNNNN...',
    '...........MMMMMMMMMMMMMMM.............NNNNNNNN....',
    '..........LMMMMMMMMMMMMMMM............NNNNNNNN.....',
    '.........LMMMMMMMMMMMMMMMMMM.........NNNNNNNNN.....',
    '........LMMMMMWWEEEWMMMMMMML........NNNNNNNNN......',
    '........MMMMMMWWEEEEWMMMMMML.......NNNNNNNN........',
    '........MMMMMMKKKWWMMMMMMML........NNNNNNN.........',
    '........MMMMMMKKKKKWMMMML...........................',
    '........MMMMMMKKKKKKWMMML...........................',
    '........MMMMMMKKKKKKWMML............................',
    '.........MMMMMMKKKKKKMML............................',
    '.........LMMMMMMKKKKMMML............................',
    '..........LMMMMMMKKKMMML............................',
    '...........LMMMMMMMMMMML............................',
    '............LMMMMMMMMML.............................',
    '.............LMMMMMMML..............................',
    '..............LMMMMMML..............................',
    '..............LMMMMMML..............................',
    '...............LMMMMML..............................',
    '................LMMMML..............................',
    '.................LMMML..............................',
    '..................LLL...............................',
    D*48,
    '...................NNN..............................',
    '..................NNNNNN............................',
    '.................NNNNNNNN...........................',
]))

SPRITES.append(sp('dog', '小狗：暖棕圆身 + 垂耳朵 + 红项圈 + 可爱表情 + 侧视图（面向右）', {
    'M': '#c9956b', 'S': '#a06d45', 'L': '#e8bf98', 'W': '#ffffff', 'C': '#e53935', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48,
    '............MMMMMM...........MMMMMM.................',
    '...........MMMMMMMM.........MMMMMMMM................',
    '..........MMMMMMMMMM.......MMMMMMMMMM...............',
    '.........MMLLMMMMMMMM.....MMMMMMMMLMMM..............',
    '.........MMLLMMMMMMMMM...MMMMMMMMLLMMM..............',
    '.........MMLLLMMMMMMM.....MMMMMMLLLMMM..............',
    '........MMMMMMMMMMM.........MMMMMMMM................',
    '......MMMMLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.......',
    '.....MMMMLLMMMMWWEEEWMMMMMMMMMMMMMMMMMMM...........',
    '....MMMMLLMMMMMWWEEEEWMMMMMMMMMMMMMMMMMM...........',
    '....MMMMLMMMMMWWWWWWWMMMMMMMMMMMMMMMMMMM...........',
    '....MMMMMMMMMKKKWWWWWMMMMMMMMMMMMMMMMMMMM..........',
    '....MMMMMMMMMKKKKKWWMMMMMMMMMMMMMMMMMMMMMM.........',
    '....MMMMMMMMMKKKKKWWMMMMMMMMMMMMMMMMMMMMMM.........',
    '....MMMMMMMMMKKKKKKWWMMMMMMMMMMMMMMMMMMMMM.........',
    '.....MMMMMMMMKKKKKKKWMMMMMMMMMMMMMMMMMMMMM.........',
    '.....MMMMMMMMKKKKKKKKMMMMMMMMMMMMMMMMMMMM..........',
    '.....CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC.............',
    '.....CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC.............',
    '......MMMMMMMMMMMMMMMMMMMMMMMMMMMM..................',
    '......MMMLMMMMMMMMMMMMMMMMMMMMMMMMM................',
    '......MMMLLLMMMMMMMMMMMMMMMMMMMMMMM................',
    '......MMMMLLLMMMMMMMMMMMMMMMMMMMMMMM...............',
    '.......MMMMLLLMMMMMMMMMMMMMMMMMMMMMM...............',
    '........MMMMMMLMMMMMMMMMMMMMMMMMMMMM...............',
    '.........MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM...........',
    '.........MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM...........',
    '..........MMMMMMMMMMMMMMMMMMMMMMMMMMMM..............',
    '..........MMMMMMMMMMMMMMMMMMMMMMMMMMMM..............',
    '...........MMMMMMMMMMMMMMMMMMMMMMMMMM...............',
    '...........MMMMMMMMMMMMMMMMMMMMMMMMMM...............',
    '............MMMMMMMMMMMMMMMMMMMMMMMM................',
    '............MMMMMMMMMMMMMMMMMMMMMMMM................',
    '.............MMMMMMMMMMMMMMMMMMMMMM.................',
    '.............MMMMMMMMMMMMMMMMMMMMMM.................',
    '..............MMMMMMMMMMMMMMMMMMMM..................',
    '..............MMMMMMMMMMMMMMMMMMMM..................',
    '...............MMMMMMMMMMMMMMMMMM...................',
    '...............MMMMMMMMMMMMMMMMMM...................',
    '................MMMMMMMMMMMMMMMM....................',
    '.................MMMMMMMMMMMMMM.....................',
    '..................MMMMMMMMMMMM......................',
    '..................MMMMMMMMMMMM......................',
]))

SPRITES.append(sp('horse', '小马：棕色长方身体 + 竖耳朵 + 深色鬃毛 + 四条腿 + 侧视图（面向右）', {
    'M': '#b8956a', 'S': '#8b5e3c', 'L': '#dbc3a0', 'T': '#5d3a1a', 'K': '#2c2c2c', 'W': '#ffffff',
}, [
    D*48, D*48, D*48, D*48, D*48,
    '.................MMMM..............................',
    '................MMMMMM..............................',
    '...............MMMMMMM..............................',
    '...............MMMMMMM..............................',
    '..............MMMTTTTMM.............................',
    '..............MMTTTTTTM.............................',
    '.............MMLTTTTTTTM............................',
    '.............MMLLTTTTTTM............................',
    '............MMMLLLLTTTTTTM..........................',
    '............MMMLLLLLTTTTM...........................',
    '...........MMMMLLLLLLTTTTM..........................',
    '...........MMMMLLLLLLTTTTM..........................',
    '..........MMMMMLLLLLLLTTTTM.........................',
    '..........MMMMMLLLLLLLTTTTM.........................',
    '.........MMMMMMLLLLLLLTTTTTMM.......................',
    '........MMMMMMMLLLLLLLTTTTTTMM......................',
    '........MMMMMWWEEEWLLLLTTTTTTMMM....................',
    '.......MMMMMMWWEEEEWLLLTTTTTTTMMM...................',
    '.......MMMMMMWWWWWWWLLLTTTTTTMMMM...................',
    '.......MMMMMMKKKWWWWLLTTTTTTMMMMM...................',
    '.......MMMMMMMKKKWWWWLTTTTTMMMMMM...................',
    '.......MMMMMMMKKKKKWWWTTTTTMMMMMM...................',
    '........MMMMMMMKKKKKWWWTTTTMMMMMM...................',
    '........MMMMMMMKKKKKKWWWTTTMMMMMM...................',
    '.........MMMMMMMKKKKKKWWWTTMMMMMM...................',
    '.........MMMMMMMKKKKKKKWWWMMMMMMM...................',
    '..........MMMMMMMKKKKKKKWWMMMMMM....................',
    '...........MMMMMMMKKKKKKKMMMMMM.....................',
    '............MMMMMMMKKKKKMMMMMM......................',
    '.............MMMMMMMMMMMMMMM........................',
    '..............MMMMMMMMMMMMM.........................',
    '...............MMMMMMMMMMM..........................',
    '................MMMMMMMMMM..........................',
    '.................MMMMMMMMM..........................',
    '.................MMM...MM...........................',
    '.................MMM...MM...........................',
    '................MMM....MMM..........................',
    '................MMM....MMM..........................',
    '...............MMMM....MMMM.........................',
    '...............MMMM....MMMM.........................',
    '..............MMMM......MMMM........................',
    '..............MMMM......MMMM........................',
    '.............MMMM........MMMM.......................',
    '............MMMM..........MMMM......................',
]))

SPRITES.append(sp('cow', '奶牛：白身体 + 黑斑块 + 粉鼻子 + 小角 + 侧视图（面向右）', {
    'M': '#fefefe', 'S': '#e8e8e8', 'L': '#ffffff', 'T': '#1a1a1a', 'P': '#ffb3c1', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48,
    '...................KK...........KK..................',
    '..................KKKK.........KKKK.................',
    '.................KKKKKK.......KKKKKK................',
    '.................KKKKKK.......KKKKKK................',
    '..............MMMMMMM.......MMMMMMMMM...............',
    '.............MMMMMMMMMM.....MMMMMMMMMM..............',
    '............MMMMMMMMMMM.....MMMMMMMMMM..............',
    '...........MMMLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.',
    '...........MMMLLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.....',
    '..........MMMMLLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM....',
    '.........MMMLLLMMMMMWWEEEWMMMMMMMTTTTMMMMMMM........',
    '.........MMMMLLMMMMMWWEEEEWMMMMMMMTTTTMMMMMMMM......',
    '........MMMMMMLMMMMMWWWWWWWMMMMMMMTTTTMMMMMMMMMMM...',
    '........MMMMMMMMMMPPKKKPPPMMMMMMTTTTMMMMMMMMMMMMM...',
    '........MMMMMMMMMMPPKKKKPPPMMMMMMTTTMMMMMMMMMMMMM...',
    '........MMMMMMMMMMPPKKKKKPPMMMMMMTTTMMMMMMMMMMMM....',
    '........MMMMMMMMMMPPKKKKKPPMMMMMMTTMMMMMMMMMMMMM....',
    '........MMMMMMMMMMMPPPKKPPMMMWWWWWMMMMMMMMMMM.......',
    '.........MMMMMMMMMMPPPPPPPTTTTWWWWWWMMMMMMMMMM......',
    '.........MMMMMMMMMMPPPPPPPTTTTTTMWWWMMMMMMMMMM......',
    '..........MMMMMMMMMPPPPPPPTTTTTTTMWWWMMMMMMMMM......',
    '..........MMMMMMMMMPPPPPPPPTTTTTTMWWWMMMMMMMM.......',
    '..........MMMMMMMMMPPPPPPPPTTTTTTMWMMMMMMMMM........',
    '...........MMMMMMMMLPPPPPPTMTTTTTMMMMMMMMMMMM.......',
    '...........MMMMMMMMMLLPPPPMMMMMMMMMMMMMMM...........',
    '............MMMMMMMMMMMMMMMMMMMMMMMMMMMMM...........',
    '............MMMMMMMMMMMMMMMMMMMMMMMMMMMMM...........',
    '.............MMMMMMMMMMMMMMMMMMMMMMMMMMM............',
    '.............MMMMMMMMMMMMMMMMMMMMMMMMMMM............',
    '..............MMMMMMMMMMMMMMMMMMMMMMMMM.............',
    '...............MMMMMMMMMMMMMMMMMMMMMMMM.............',
    '...............MMMMMMMMMMMMMMMMMMMMMMMM.............',
    '................MMMMMMMMMMMMMMMMMMMMMM..............',
    '.................MMMMMMMMMMMM.MMMMMMM...............',
    '.................MMMMMMMMMMMM..MMMMMM...............',
    '.................MMMMMMMMMMMM...MMMMM...............',
    '.................MMMMMMMMMMMM....MMM................',
    '................MMMM.........MM..MMM................',
    '................MMMM.........MM...MMM...............',
    '...............MMMM..........MM...MMM...............',
    '...............MMMM..........MM...MMM...............',
    '..............MMMM...........MM....MM...............',
]))

# --- Chapter 2: Wild Animals ---
SPRITES.append(sp('tiger', '老虎：橙色圆身 + 黑色横条纹 + 白色面部肚皮 + 侧视图（面向右）', {
    'M': '#ff9800', 'S': '#e65100', 'L': '#ffcc80', 'T': '#1a1a1a', 'W': '#ffffff', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48,
    '..............MMMM.................MMMM..............',
    '.............MMMMMM...............MMMMMM.............',
    '............MMMMMMMM.............MMMMMMMM............',
    '...........MMLMMMMMMMM.........MMMMMMLMMM............',
    '...........MMLLMMMMMMM.......MMMMMMMMLLMM............',
    '..........MMMMLMMMMMMM.......MMMMMMMLMMMM............',
    '.........MMMLLLLLMMMMMM....MMMMMMMMLLLMMM............',
    '........MMMLLLLLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.',
    '......MMMMMLLLLLMMMMMMWWWEEEWWMMMMMMMMMMMMM.........',
    '......MMMMMLLLLLMMMMMMWWWEEEEWWMMMMMMMMMMMM.........',
    '......MMMMMMMMMMMMMMMWWWWWWWWWMMMMMMMMMMMMM.........',
    '......MMMMWWWMMMMMMMKKKWWWWWMMMMMMMMMMMMMMM.........',
    '......MMMWWWWWMMMMMMMKKKKKWWMMMMMMMMMMMMMMM.........',
    '.......MMWWWWWWMMMMMMKKKKKKWWMMMMMMMMMMMMM..........',
    '.......MMWWWWWWWMMMMMKKKKKKWWMMMMMMMMMMMMM..........',
    '.......MMMWWWWWWWWMMMMKKKKKKWWMMMMMMMMMMMM..........',
    '........MMMWWWWWWWWWWMMKKKKKWWMMMMMMMMMMMM..........',
    '.........MMMMTTTTTMMMMMMKKKKWWMMMMMMMMMMM...........',
    '..........MMMTTTTTMMMMMMMMMMMMMMMTTTTMMMM...........',
    '..........MMMTTTTTTTTMMMMMMMMMMTTTTTTTMMM...........',
    '..........MMMTTTTTTTTTTTTTTTTTTTTTTTTTMMM...........',
    '...........MMMTTTTTTTTTTTTTTTTTTTTTTTTMMM...........',
    '...........MMMTTTTTTTTTTTTTTTTTTTTTTTTMM............',
    '............MMMTTTTTTTTTTTTTTTTTTTTTTMM.............',
    '.............MMMTTTTTTTTTTTTTTTTTTTTMM..............',
    '..............MMMTTTTTTTTTTTTTTTTTTMM...............',
    '...............MMMTTTTTTTTTTTTTTTTMM................',
    '................MMMTTTTTTTTTTTTTTMM.................',
    '.................MMMTTTTTTTTTTTTMM..................',
    '..................MMTTTTTTTTTTTMM...................',
    '...................MTTTTTTTTTTTM....................',
    '....................TTTTTTTTTTT.....................',
    '.....................TTTTTTTTT......................',
    '.....................TTTTTTTTT......................',
    '......................TTTTTTT.......................',
    '.......................TTTTT........................',
    '.......................TTTTTT.......................',
    '.......................TTTTTT.......................',
    '......................TTTTTTTT......................',
    '......................TTTTTTTT......................',
    '.....................TTTTTTTTT......................',
    '....................TTTTTTTTTTT.....................',
    '...................TTTTTTTTTTTT.....................',
]))

SPRITES.append(sp('lion', '狮子：金黄身体 + 棕色鬃毛环 + 尾端毛球 + 侧视图（面向右）', {
    'M': '#ffc107', 'S': '#ff8f00', 'L': '#ffe082', 'T': '#6d4c41', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48,
    '..............TTTTTTTTTTTTTTTTTTTT..................',
    '.............TTTTTTTTTTTTTTTTTTTTTT.................',
    '............TTTTTTTTTTTTTTTTTTTTTTTT................',
    '...........TTTTTTTTTTTTTTTTTTTTTTTTTT...............',
    '..........TTTTTTTTTTTTTTTTTTTTTTTTTTTT..............',
    '.........TTTTTMMMTTTTTTTTTTTTTMMMTTTTT..............',
    '.........TTTMMMMTTTTTTTTTTTTTTMMMMTTTT..............',
    '........TTTMMMMTTTTTTTTTTTTTTTTMMMMTTTT.............',
    '........TTTMMMMTTTTTKKKKKKTTTTTMMMMTTT..............',
    '........TTMMMMTTTTTKKWWWWEEKTTTMMMMTTTT.............',
    '.......TTTMMMMMTTTTKKWWWEEEWKTTTMMMMTTT.............',
    '.......TTTMMMMMTTTTKKKWWWWWKTTTMMMMMTTT.............',
    '.......TTTMMMMMMTTTTKKKKKKWKTTTMMMMMMTTT............',
    '.......TTMMMMMMMMTTTTTKKKKKKWKTTMMMMMMTTT...........',
    '.......TTTMMMMMMMMTTTTKKKKKKWKTTMMMMMMMMTT...........',
    '........TTMMMMMMMMMMMMMMMMMMMMMMMMMMMMTTT...........',
    '.........TTTMMMMMMMMMMMMMMMMMMMMMMMMTTTTT...........',
    '..........TTTMMMMMMMLMMMMMMMMMMMMMMMMTTTTT...........',
    '...........TTTMMMMMMLLLMMMMMMMMMMMMMMTTTTT..........',
    '............TTTMMMMLLLMMMMMMMMMMMMMMMTTTTT..........',
    '.............TTTMMMMLLLMMMMMMMMMMMMMTTTTTT..........',
    '..............TTTMMMMLLLMMMMMMMMMMMTTTTTT...........',
    '...............TTTMMMLLLMMMMMMMMMMTTTTTT............',
    '................TTTMMMMLLLMMMMMMMTTTTTT.............',
    '.................TTTMMMMLMMMMMMTTTTTT...............',
    '..................TTTMMMMMMMMMTTTTTT................',
    '...................TTTMMMMMTTTTTTT..................',
    '....................TTTTTTTTTTTT....................',
    '.....................TTTTTTTTT......................',
    '......................TTTTTTT.......................',
    '.......................TTTTT........................',
    '........................TTT.........................',
    '..........................T.........................',
    D*48, D*48, D*48,
    '.......................TT...........................',
    '......................TTTT..........................',
    '.....................TTTTTT.........................',
    '....................TTTTTTTT........................',
    '...................TTTTTTTTTT.......................',
    '..................TTTTTTTTTTTT......................',
    '.................TTTTTTTTTTTTT......................',
    '................TTTTTTTTTTTTTT......................',
]))

SPRITES.append(sp('bear', '棕熊：棕色圆胖身体 + 圆耳朵 + 米色V形胸斑 + 侧视图（面向右）', {
    'M': '#8b5e3c', 'S': '#5d3a1a', 'L': '#b8956a', 'W': '#fff8e1', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48, D*48, D*48,
    '..................MMMMM....MMMMM....................',
    '.................MMMMMM....MMMMMM...................',
    '................MMMMMMMM....MMMMMMMM.................',
    '...............MMMMMMMMM....MMMMMMMMM...............',
    '..............MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.',
    '.............MMMLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM......',
    '............MMMLLLMMMMMMMMMMMMMMMMMMMMMMMMMMMM......',
    '...........MMMMLLLLLMMMMMMMMMMMMMMMMMMMMMMMMMM......',
    '..........MMMLLLLLLLMMMMMMMMMMMMMMMMMMMMMMMMM.......',
    '.........MMMLLLLLLLMMMMMMMMMMMMMMMMMMMMMMMMMM.......',
    '.........MMMMMMMMMMMMMWWEEEEWMMMMMMMMMMMMMMM........',
    '.........MMMMMMMMMMMMMWWEEEEWMMMMMMMMMMMMMMMM.......',
    '........MMMMMMMMMMMMMWWWWWWWMMMMMMMMMMMMMMM.........',
    '........MMMMMMMMMMMMMKKKKKWWMMMMMMMMMMMMMM..........',
    '........MMMMMMMMMMMMMKKKKKWWMMMMMMMMMMMMMM..........',
    '........MMMMMMMMMMMMKKKKKKKWWMMMMMMMMMMMMM..........',
    '........MMMMMMMMMMMMKKKKKKKWWMMMMMMMMMMMMM..........',
    '........MMMMMMMMMMMWWWWWWWWMMMMMMMMMMMMM............',
    '.........MMMMMMMMMMWWWWWWWWMMMMMMMMMMMM.............',
    '.........MMMMMMMMMMWWWWWWWWWMMMMMMMMMM..............',
    '.........MMMMMMMMMMMWWWWWWWWWMMMMMMMM...............',
    '..........MMMMMMMMMMMWWWWWWWWWWWMMM.................',
    '..........MMMMMMMMMMMMMWWWWWWWWWWMMM................',
    '...........MMMMMMMMMMMMMMWWWWWWWWWWMM...............',
    '...........MMMMMMMMMMMMMMMMWWWWWWWWWMM..............',
    '............MMMMMMMMMMMMMMMMMWWWWWWWWWMM.............',
    '............MMMMMMMMMMMMMMMMMMWWWWWWWWWMM............',
    '.............MMMMMMMMMMMMMMMMMMMWWWWWWWWMM...........',
    '.............MMMMMMMMMMMMMMMMMMMMWWWWWWWWMM..........',
    '..............MMMMMMMMMMMMMMMMMMMMMWWWWWWWMM.........  ',
    '..............MMMMMMMMMMMMMMMMMMMMMMMWWWWMMM.........     ',
    '...............MMMMMMMMMMMMMMMMMMMMMMMMMMM...........',
    '...............MMMMMMMMMMMMMMMMMMMMMMMMMM............',
    '................MMMMMMMMMMMMMMMMMMMMMMMMM............',
    '.................MMM....MMMMMMM..MMMMMMM.............',
    '..................MMM....MMMMMM....MMMMMMM...........',
    '...................MMMMMMMMM..MMMMMMMMMMM............',
    '....................MMMMMMM...MMMMMMM................',
]))

SPRITES.append(sp('fox', '红狐狸：红橙色流线身体 + 尖耳朵 + 白色胸腹尾尖 + 侧视图（面向右）', {
    'M': '#e8523a', 'S': '#b71c1c', 'L': '#ff7961', 'W': '#ffffff', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48,
    '............MMMMMMM.................................',
    '...........MMMMMMMMMM................................',
    '..........MMMMMMMMMMM................................',
    '.........MMLLMMMMMMMMM...............................',
    '.........MMLLLMMMMMMMMMMMMMMMMMMMMMM...............',
    '........MMMLLLMMMMMMMMMMMMMMMMMMMMMMM..............',
    '........MMMMLLLMMMMMWWWEEEWWMMMMMMMMMMM............',
    '........MMMMMLLLMMMMWWWEEEEWWMMMMMMMMMM............',
    '........MMMMMMLLMMMMWWWWWWWWMMMMMMMMMM.............',
    '........MMMMMMMMMMKKKKWWWWWMMMMMMMMMMM.............',
    '........MMMMMMMMMMKKKKKWWMMMMMMMMMMMM..............',
    '........MMMMMMMMMKKKKKKWMMMMMMMMMMMM................',
    '........MMMMMMMMMMMMMMMMMMMMMMMMMMMMM...............',
    '........MMMMMMMMMMMMMMMMMMMMMMMMMMMMMM..............',
    '........MMMMWWWWWMMMMMMMMMMMMMMMMMMMMM.............',
    '.........MMMMWWWWWWMMMMMMMMMMMMMMMMMMMM............',
    '.........MMMMWWWWWWWMMMMMMMMMMMMMMMMMMMM...........',
    '..........MMMMWWWWWWWWMMMMMMMMMMMMMMMMMMM..........',
    '..........MMMMMWWWWWWWWMMMMMMMMMMMMMMMMMMM.........',
    '...........MMMMMWWWWWWWWWMMMMMMMMMMMMMMMMMM........',
    '............MMMMMMWWWWWWWWWMMMMMMMMMMMMMMM.........',
    '.............MMMMMMMWWWWWWWWWMMMMMMMMMMMMM.........',
    '..............MMMMMMMWWWWWWWWWWMMMMMMMMMM..........',
    '...............MMMMMMMMWWWWWWWWWWMMMMMMMMM.........',
    '................MMMMMMMMMWWWWWWWWWWMMMMMMM..........',
    '.................MMMMMMMMMMMMMMMMMMMMMMMMM.........',
    '..................MMMMMMMMMMMMMMMMMMMMMMMM.........',
    '...................MMMMMMMMMMMMMMMMMMMMMM..........',
    '....................MMMMMMMMMMMMMMMMMMMMM..........',
    '....................MMMMMMMMMMMMMMMMMMMMM..........',
    '.....................MMMMMMWWWWWMMMMMMM............',
    '......................MMMMMMWWWWWWMMMMM............',
    '.......................MMMMMWWWWWWMMMM.............',
    '........................MMMMMWWWWWMM...............',
    '.........................MMMMMWWWMM................',
    '..........................MMMMMWWMM................',
    '...........................MMMMMMM.................',
    '............................MMMMM..................',
    '.............................WMM...................',
    '.............................WW....................',
    '............................W......................',
    '...........................W.......................',
]))

SPRITES.append(sp('wolf', '灰狼：灰蓝调身体 + 浅色胸腹 + 金色眼睛 + 尖嘴 + 侧视图（面向右）', {
    'M': '#607d8b', 'S': '#37474f', 'L': '#90a4ae', 'W': '#e0e0e0', 'E': '#ffd54f', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48,
    '.............MMMMM..................................',
    '............MMMMMMM.................................',
    '...........MMMMMMMMM................................',
    '...........MMMMMMMMM................................',
    '..........MMMMMMMMMM................................',
    '.........MMMLLMMMMMMM...............................',
    '.........MMLLLMMMMMMMMMMMMMM.......................',
    '........MMMLLLMMMMMMMMMMMMMMM......................',
    '........MMMMLLLMMMMMWWWEEEEWMMMMMMMMM..............',
    '........MMMMMLLLMMMMWWWEEEEWMMMMMMMMM..............',
    '........MMMMMLLLLMMMWWWWWWWWMMMMMMMMMM.............',
    '........MMMMMMMLLLMMKKKKWWWMMMMMMMMMMM.............',
    '........MMMMMMMMMMMMKKKKKWWMMMMMMMMMMM.............',
    '........MMMMMMMMMMMMKKKKKWWMMMMMMMMMM..............',
    '........MMMMMMMMMMMMKKKKKWWMMMMMMMMM...............',
    '.........MMMMMMMMMMMKKKKKKWMMMMMMMMM...............',
    '.........MMMMMMMMMMMMMMMMMMMMMMMMMMM...............',
    '..........MMMMMMMMMMMMMMMMMMMMMMMMM................',
    '..........MMMMMMMMMWWWWWWWWMMMMMMMMM...............',
    '...........MMMMMMMMWWWWWWWWWWWMMMMMMMM.............',
    '............MMMMMMMMMWWWWWWWWWWWWMMMMMM............',
    '.............MMMMMMMMMMWWWWWWWWWWWMMMMM............',
    '..............MMMMMMMMMMMWWWWWWWWWWWMMMM...........',
    '...............MMMMMMMMMMMMMMMMMMMMMMMMM...........',
    '................MMMMMMMMMMMMMMMMMMMMMMMM...........',
    '.................MMMMMMMMMMMMMMMMMMMMMMM...........',
    '..................MMMMMMMMMMMMMMMMMMMMM............',
    '..................MMMMMMMMMMMMMMMMMMMMM............',
    '...................MMMMMMMMMMMMMMMMMMM.............',
    '....................MMMMMMMMMMMMMMMMMM.............',
    '....................MMMMMMMMMMMMMMMMMM.............',
    '.....................MMMMMMMMMMMMMMMMM.............',
    '.....................MMMMMMMMMMM...MMMM............',
    '......................MMMMMMMMMM...MMMM............',
    '.......................MMMMMMMMM...MMMM............',
    '........................MMMMMMMMM..MMMM............',
    '........................MMMMMMMM...MMMM............',
    '........................MMMMMM.....MMMM............',
    '.........................MMMMM.....MMMM............',
    '..........................MMMM......MMM............',
    '..........................MMM.......MMM............',
]))

SPRITES.append(sp('eagle', '雄鹰：展翅深棕色 + 白色头部 + 金色鹰钩嘴 + 利爪 + 正面展翅视图', {
    'M': '#5d4037', 'S': '#3e2723', 'L': '#8d6e63', 'W': '#ffffff', 'N': '#ffa000', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48,
    '.......MMMMM.........................MMMMM.........',
    '......MMMMMMM.......................MMMMMMM........',
    '.....MMMMMMMMM.....................MMMMMMMMM.......',
    '....MMMMMMMMMMM...................MMMMMMMMMMM......',
    '...MMMMMMMMMMMMM.................MMMMMMMMMMMMM.....',
    '...MMMMMWWWWWWWMMMM...........MMMMWWWWWWWMMMM.....',
    '..MMMMWWWWWWWWWWMMM.........MMMWWWWWWWWWWMMM......',
    '..MMMMWWWWWWWWWWWMMM.......MMMWWWWWWWWWWWMMM......',
    '...MMMMWWWWWWWWWWWWWMM....MMMWWWWWWWWWWWWWMM......',
    '...MMMMMWWWWWWWWWWWWWMMMMMMWWWWWWWWWWWWWMMMM......',
    '....MMMMMMWWWWWWWWWWWWWMMWWWWWWWWWWWWWWWMMMM......',
    '....MMMMMMMWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMMM......',
    '.....MMMMMMMMWWWWWNNNNNWWWWWWWNNNNNWWWWMMMM.......',
    '......MMMMMMMMWWWWNNNNNNNWWNNNNNNNNWWWWMMMMM......',
    '.......MMMMMMMMMMMMMMMMWWEEEEWWMMMMMMMMMMMMM......',
    '.......MMMMMMMMMMMMMMMWWEEEEEEWMMMMMMMMMMMMM......',
    '........MMMMMMMMMMMMMMKKKMMEEKKKKWMMMMMMMMMM......',
    '........MMMMMMMMMMMMMMKKKMMEEKKKKWMMMMMMMMMM......',
    '.........MMMMMMMMMMMMMKKKMMMMKKKKKWMMMMMMMMM......',
    '.........MMMMMMMMMMMMMWKKKKEEKKKKKWMMMMMMMMM......',
    '..........MMMMMMMMMMMMMWWKKKKKKKKWWMMMMMMMMM......',
    '..........MMMMMMMMMMMMMMMWWKKKKKKWWMMMMMMMM.......',
    '...........MMMMMMMMMMMMMMMWWKKKKWWWMMMMMMM........',
    '............MMMMMMMMMMMMMMMMMWWWWWWWWMMMMMM.......',
    '.............MMMMMMMMMMMMMMMMMMMMMMMMMMMM........',
    '..............MMMMMMMMMMMMMMMMMMMMMMMMMMMM.......',
    '...............MMMMMMMMMMMMMMMMMMMMMMMMMMM.......',
    '................MMMMMMMMMMMMMMMMMMMMMMMMM........',
    '.................MMMMMMMMMMMMMMMMMMMMMMM.........',
    '.................MMMMMMMMMMMMMMMMMMMMMMM.........',
    '..................MMMMMMMMMMMMMMMMMMMMM..........',
    '..................MMMMMMMMMMMMMMMMMMMMM..........',
    '...................MMMMMMMMMMMMMMMMMMM...........',
    '...................MMMMMMMMMMMMMMMMMMM...........',
    '....................MMMMMMMMM.MMMMMM.............',
    '....................MMMMMMMMM.MMMM..............',
    '...................MMMMM.....MMMMM..............',
    '...................NMMM.......NMMM..............',
    '..................N.MMM.......M.MN..............',
    '.................N...M..M...M..M...N............',
    '................N...................N...........',
    '..............N.......................N..........',
]))

# --- Chapter 3: Forest Animals ---
SPRITES.append(sp('frog', '青蛙：草绿蹲姿 + 凸起大眼睛 + 白色肚皮 + 侧视图（面向右）', {
    'M': '#66bb6a', 'S': '#388e3c', 'L': '#a5d6a7', 'W': '#ffffff', 'E': '#1a1a1a', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48, D*48, D*48,
    '.................WWEEWW......WWEEWW.................',
    '................WWEEEEWW....WWEEEEWW................',
    '...............KWWEEEEWWKK..KWWEEEEWWK..............',
    '..............KMMMMMMMMMMK..KMMMMMMMMMMK.............',
    '.............KMMMMMMMMMMMMKKMMMMMMMMMMMMK..........',
    '.............KMMLMMMMMMMMMMMMMMMMMMMMLMMK..........',
    '............KMMLLMMMMMMMMMMMMMMMMMMMMLLMMK.........',
    '...........KMMMLLLLMMMMMMMMMMMMMMMMLLLLMMMK........',
    '...........KMMMMMLLLMMMMMWWWWWWMMMMLLLMMMMK........',
    '..........KMMMMMMMLLMMMMWWWWWWWWWMMLLMMMMMMK.......',
    '..........KMMMMMWWWWWWWWWWWWWWWWWWWWWWWWMMMK.......',
    '.........KMMMMMWWWWWWWWWWWWWWWWWWWWWWWWWWMMK.......',
    '.........KMMMMWWWWWWWWWWWWWWWWWWWWWWWWWWWMMK.......',
    '........KMMMMWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMK.......',
    '........KMMMMWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMK.......',
    '.......KMMMMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMK.......',
    '.......KMMMMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMK.......',
    '.......KMMMMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMK.......',
    '.......KMMMMMWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMK.......',
    '.......KMMMMMWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMK.......',
    '........KMMMMMWWWWWWWWWWWWWWWWWWWWWWWWWMMMMK.......',
    '........KMMMMMMMMMMMMMMMMMWWWWWWWWMMMMMMMMK........',
    '.........KMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMK..........',
    '.........KMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMK..........',
    '..........KMMMMMMMMMMMMMMMMMMMMMMMMMMMMK...........',
    '..........KMMMMMMMMMMMMMMMMMMMMMMMMMMMMK...........',
    '...........KMMMMMMMK..KMMMMMMMK..KMMMMK............',
    '...........KMMMMMMMK..KMMMMMMMK..KMMMMK............',
    '............KMMMMMMK..KMMMMMMMK..KMMMMK............',
    '............KMMMMMMK..KMMMMMMMK..KMMMMK............',
    '.............KMMMMMK..KMMMMMMMK..KMMMK.............',
    '..............KMMMMK..KMMMMMMMK..KMMK..............',
    '..............KMMMMK..KMMMMMMK...KMMK..............',
    '...............KMMMK...KMMMMK....KMMK..............',
    '...............KMMMK...KMMMK.....KMMK..............',
    '................KMMK....KMMK......KMK..............',
    '................KMMK....KMMK......KMK..............',
]))

SPRITES.append(sp('crocodile', '鳄鱼：长扁深绿身体 + 锯齿背部 + 黄色肚皮 + 长嘴 + 侧视图（面向右）', {
    'M': '#2e7d32', 'S': '#1b5e20', 'L': '#4caf50', 'T': '#1a1a1a', 'W': '#fff9c4', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48, D*48, D*48, D*48, D*48, D*48,
    '............KKKK..KKKK..KKKK..KKKK..................',
    '...........KKKKKKKKKKKKKKKKKKKKKKKK.................',
    '..........KMMMMMMMMMMMMMMMMMMMMMMKKK................',
    '.........KMMMMMMMMMMMMMMMMMMMMMMMMMK................',
    '.........KMMLMMMMMMMMMMMMMMMMMMMMMMK................',
    '.........KMMLMMMMMMMMMMMMMMMMMMMMMMK................',
    '.........KMMMMEEMMMMMMMMMMMWWMMMMMMK................',
    '.........KMMMMEEMMMMMMMMMMWWWMMMMMMK................',
    '.........KMMMMWWWMMMMMMMWWWWWWMMMMMK................',
    '.........KMMMMWWWWWMMMMWWWWWWWWMMMMK................',
    '..........KMMMMWWWWWWWWWWWWWWWWWWMMMK...............',
    '..........KMMMMMWWWWWWWWWWWWWWWWWWMMK...............',
    '..........KMMMMMWWWWWWWWWWWWWWWWWWWMMK..............',
    '...........KMMMMWWWWWWWWWWWWWWWWWWWMMK..............',
    '...........KMMMMWWWWWWWWWWWWWWWWWWWWMMK.............',
    '...........KMMMMWWWWWWWWWWWWWWWWWWWWWMMK............',
    '............KMMMWWWWWWWWWWWWWWWWWWWWWMMK............',
    '............KMMMWWWWWWWWWWWWWWWWWWWWWWMMK...........',
    '............KMMMWWWWWWWWWWWWWWWWWWWWWWWMMK..........',
    '.............KMMMWWWWWWWWWWWWWWWWWWWWWWMMK..........',
    '.............KMMMWWWWWWWWWWWWWWWWWWWWWWWMMK.........',
    '.............KMMMMWWWWWWWWWWWWWWWWWWWWWWMMK.........',
    '.............KMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM......',
    '..............KMMMMMMMMMMMMMMMMMMMMMMMMMMMK.........     ',
    '...............KMMMMMMMMMMMMMMMMMMMMMMMMMK..........',
    '................KMMMMMMMMMMMMMMMMMMMMMMMK...........',
    '.................KMMMMMMMMMMMMMMMMMMMMMMK...........',
    '..................KMMMMMMMMMMMMMMMMMMMMK............',
    '...................KMMMMMMMMMMMMMMMMMMK.............',
    '...................KMMMM....KMM..KMM..KMMK..........',
    '....................KMMM....KMM..KMM..KMMK..........',
    '....................KMMM....KMM..KMM..KMMK..........',
    '.....................KMM.....KM...KM...KMK..........',
    '.....................K........K....K....KK..........',
    '.....................K........K....K....K...........',
    '....................K.........K....K.....K..........',
    '...................K.....................K..........',
    '..................K.......................K.........',
]))

SPRITES.append(sp('elephant', '大象：巨大灰色身体 + 长弯鼻子 + 大扇耳 + 白色象牙 + 侧视图（面向右）', {
    'M': '#90a4ae', 'S': '#546e7a', 'L': '#cfd8dc', 'W': '#ffffff', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48, D*48, D*48, D*48,
    '.....................KKKK...........................',
    '...................KKMMMMKK.........................',
    '..................KMMMMMMMMK........................',
    '.................KMMLMMMMMMK........................',
    '................KMMLMMMMMMEKK.......................',
    '...............KMMMMMMMMMEEKK.......................',
    '..............KMMMMMMMMMMPPK........................',
    '.............KMMMMWWWWWWWPK.........................',
    '............KMMMMMWWWWWWWPK.........................',
    '...........KMMMMMMMWWWWWWPK.........................',
    '..........KMMMMMMMMWWWWWWWPK........................',
    '..........KMMMMMWWWWWWWWWPK.........................',
    '.........KMMMMMMWWWWWWWWWWPK........................',
    '........KMMMMMWWWWWWWWWWWWWPK.......................',
    '........KMMMMMWWWWWWWWWWWWWWPK......................',
    '.......KMMMMMWWWWWWWWWWWWWWWPK......................',
    '.......KMMMMMWWWWWWWWWWWWWWWWPK.....................',
    '......KMMMMMWWWWWWWWWWWWWWWWWPK.....................',
    '......KMMMMWWWWWWWWWWWWWWWWWWPK.....................',
    '......KMMMMWWWWWWWWWWWWWWWWWWPK.....................',
    '.....KMMMMWWWWWWWWWWWWWWWWWWPK......................',
    '.....KMMMMMMMMMMMMMMMMMMMMMMMMMMK...................',
    '....KMMMMMMMMMMMMMMMMMMMMMMMMMMMMK..................',
    '...KMMMMMSSSSMMMMMMMMMMMMMMMMMMMMMK.................',
    '..KMMMMMMSSSSMMMMMMMMMMMMMMMMMMMMMMK................',
    '.KMMMMMMMSSSSMMMMMMMMMMMMMMMMMMMMMMMK...............',
    'KMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMK..............',
    'KMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMK.............',
    'KMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMK............',
    'KMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMK............',
    'KMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMK............',
    '.KMMMMMMMMMMM............MMMMMMMMMMMMK..............',
    '..KMMMMMMMMMM............MMMMMMMMMMMMK..............',
    '..KMMMMMMMMMM............MMMMMMMMMMMMK..............',
    '...KMMMMMMMMM............MMMMMMMMMMMMK..............',
    '...KMMMMMMMMM............MMMMMMMMMMMK...............',
    '....KMMMMMMMM............MMMMMMMMMMK................',
    '....KMMMMMMMM............MMMMMMMMMMK................',
    '.....KMMMMMMM............MMMMMMMMMK.................',
    '.....KMMMMMMM............MMMMMMMMMK.................',
]))

SPRITES.append(sp('panda', '熊猫：白色圆身 + 黑色耳朵眼圈四肢 + 侧视图（面向右）', {
    'M': '#fafafa', 'S': '#e0e0e0', 'L': '#ffffff', 'K': '#1a1a1a',
}, [
    D*48, D*48, D*48, D*48, D*48, D*48,
    '..................KKKKK..KKKKK......................',
    '.................KKKKKK..KKKKKK.....................',
    '.................KKKKKK..KKKKKK.....................',
    '................KKKKKKKKKKKKKKKK....................',
    '...............KKKKKKKKKKKKKKKKK....................',
    '..............KKKKKKKKKKKKKKKKKKK...................',
    '.............KKKKMMMMMMKKKKMMMMMMKKK................',
    '............KKKKMMMMMMMKKKKMMMMMMMKKK...............',
    '............KKKKMMKKKMMKKKKMMKKKMMKKK...............',
    '............KKKKMMKKKMMKKKKMMKKKMMKKK...............',
    '............KKKKMMKKKMMKKKKMMKKKMMKKK...............',
    '............KKKKMMMMMMMKKKKMMMMMMMMKKK..............',
    '.............KKKKKMMMMMMKKMMMMMMMKKK................',
    '.............KKKKKKKKKKKKKKKKKKKKKKK................',
    '..............KKKKKKKKKKKKKKKKKKKKK.................',
    '..............KKKKKKKKKKKKKKKKKKKKK.................',
    '...............KKKKKKKKKKKKKKKKKKK..................',
    '...............KKKKKKKKKKKKKKKKKKK..................',
    '................KKKKKKKKKKKKKKKKK...................',
    '.................KKKKKKKKKKKKKKKK...................',
    '.................KKKKKKKKKKKKKKKK...................',
    '..................KKKKKKKKKKKKKKK...................',
    '..................KKKKKKKKKKKKKKK...................',
    '...................KKKKKKKKKKKKKK...................',
    '...................KKKKKKKKKKKKKK...................',
    '....................KKKKKKKKKKKKK...................',
    '....................KKKKKKKKKKKKK...................',
    '.....................KKKKKKKKKKKK...................',
    '.....................KKKKKKKKKKKK...................',
    '......................KKKKKKKKKKK...................',
    '......................KKKKKKKKKKK...................',
    '.......................KKKKKKKKKK...................',
    '.......................KKKKKKKKKK...................',
    '........................KKKKKKKKK...................',
    '........................KKKKKKKKK...KK..............',
    '.........................KKKKKKK...KK...............',
    '.........................KKK.KKK..KK................',
    '..........................KK..KK..KK................',
    '..........................KK..KK..KK................',
    '.........................KK....KK.KK................',
    '.........................K......K.KK................',
    '........................K........KK.................',
]))

SPRITES.append(sp('monkey', '猴子：浅棕身体 + 圆头 + 粉色脸 + 长卷尾 + 侧视图（面向右）', {
    'M': '#a1887f', 'S': '#795548', 'L': '#bcaaa4', 'P': '#ffb3c1', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48, D*48, D*48,
    '.........................MMMM.......................',
    '........................MMMMMM......................',
    '.......................MMMMMMMM.....................',
    '.....................KMMMMMMMMMK....................',
    '....................KMMMPPPPPPMMK...................',
    '....................KMMPPPPPEPMMK...................',
    '....................KMMPPPPPEPMMK...................',
    '....................KMMPPPPPPMMK....................',
    '.....................KMMMMMMMMK.....................',
    '.....................KMMMMMMMMK.....................',
    '.....................KMMLMMMMMMK....................',
    '....................KMMLMMMMMMMMK...................',
    '...................KMMMMMMMMMMMMMK..................',
    '..................KMMMMMMMMMMMMMMMK.................',
    '.................KMMMMMMMMMMMMMMMMMMK...............',
    '................KMMMMMMMMMMMMMMMMMMMMMK.............',
    '...............KMMMMSSSSMMMMMMMMMMMMMMMK............',
    '...............KMMMSSSSMMMMMMMMMMMMMMMMMK...........',
    '..............KMMMSSSSMMMMMMMMMMMMMMMMMMK...........',
    '..............KMMMMMMMMMMMMMMMMMMMMMMMMMK...........',
    '..............KMMMMMMMMMMMMMMMMMMMMMMMMMK...........',
    '..............KMMMMMMMMMMMMMMMMMMMMMMMMMMK..........',
    '..............KMMMMMMMMMMMMMMMMMMMMMMMMMMK..........',
    '...............KMMMMMMMMMMMMMMMMMMMMMMMMMMK.........',
    '...............KMMMMMMMMMMMMMMMMMMMMMMMMMMK.........',
    '................KMMMMMMMMMMMMMMMMMMMMMMMMMK.........',
    '................KMMMMMMMMMMMMMMMMMMMMMMMMMK.........',
    '.................KMMMMMMMMMMMMMMMMMMMMMMMMK.........',
    '.................KMMMMMMMMMMMMMMMMMMMMMMMMK.........',
    '..................KMMMMMMMMMM......MMMMMMK..........',
    '..................KMMMMMMMMMM......MMMMMMK..........',
    '...................KMMMMMMMMM......MMMMMK...........',
    '...................KMMMMMMMMM......MMMMMK...........',
    '....................KMMMMMMMM......MMMMK............',
    '....................KMMMMMMMM......MMMMK............',
    '.....................KMMMMMM.......MMMMK............',
    '.....................KMMMMMM........MMMMK...........',
    '......................KMMMMM........MMMMK...........',
    '......................KMMMMM.........MMMK...........',
    '.......................KMMMM.........MMK............',
    '.......................KMMMM.........MMK............',
]))

SPRITES.append(sp('deer', '小鹿：浅棕优雅身体 + 分叉鹿角 + 白色斑点 + 细长腿 + 侧视图（面向右）', {
    'M': '#bf8f6a', 'S': '#8d6e63', 'L': '#d4a87c', 'T': '#5d4037', 'W': '#ffffff', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48,
    '................T.....T.............................',
    '...............TTT...TTT............................',
    '................T.TTT.T.............................',
    '................T..TTT..T...........................',
    '...............MMMMMMMMM............................',
    '..............KMMMMMMMMMK...........................',
    '.............KMMMMMMMMMMK...........................',
    '.............KMMMEEEEMMMK...........................',
    '.............KMMMEEEEMMMK...........................',
    '.............KMMMPPPPMMK............................',
    '..............KMMMMMMMMK............................',
    '..............KMMMMMMMMK............................',
    '..............KMMLMMMMMMK...........................',
    '.............KMMLMMMMMMMMK..........................',
    '............KMMMMMMMMMMMMMK.........................',
    '............KMMMMMWWWMMMMMMK........................',
    '............KMMMMWWWMWWMMMMMK.......................',
    '...........KMMMMMWWWWWWWMMMMMK......................',
    '..........KMMMMMMWWWWWWWWMMMMMK.....................',
    '..........KMMMMMMWWWWWWWWMMMMMMK....................',
    '.........KMMMMMMMMMMMMMMMMMMMMMMK...................',
    '.........KMMMMMMMMSSSSMMMMMMMMMMK...................',
    '........KMMMMMMMMMSSSSMMMMMMMMMMMK..................',
    '........KMMMMMMMMMSSSSMMMMMMMMMMMMK.................',
    '.........KMMMMMMMMMMMMMMMMMMMMMMMMK.................',
    '.........KMMMMMMMMMMMMMMMMMMMMMMMMK.................',
    '..........KMMMMMMMMMMMMMMMMMMMMMMK..................',
    '..........KMMMMMMMMMMMMMMMMMMMMMMK..................',
    '...........KMMMMMMMMMMMMMMMMMMMMK...................',
    '...........KMMMM..............MMMMK.................',
    '...........KMMMM..............MMMM..................',
    '...........KMMMM..............MMMM..................',
    '...........KMMMM..............MMMM..................',
    '..........KMMMM................MMMM.................',
    '..........KMMMM................MMMM.................',
    '..........KMMMM................MMMM.................',
    '.........KMMMM..................MMMM................',
    '.........KMMMM..................MMMM................',
    '.........KMMMM..................MMMM................',
    '........KMMMM....................MMMM...............',
    '........KMMMM....................MMMM...............',
    '........KMMMM....................MMMM...............',
    '.......KMMM.......................MMM...............',
]))

# --- Chapter 4: Birds ---
SPRITES.append(sp('flamingo', '火烈鸟：粉红S形颈 + 椭圆身体 + 细长腿 + 弯曲黑嘴 + 侧视图（面向右）', {
    'M': '#ec407a', 'S': '#c2185b', 'L': '#f48fb1', 'N': '#1a1a1a', 'K': '#6d4c41',
}, [
    D*48, D*48, D*48, D*48, D*48,
    '.......................NNN..........................',
    '.......................NMN..........................',
    '......................NNM...........................',
    '......................NMM...........................',
    '......................NMM...........................',
    '......................MMM...........................',
    '......................MMM...........................',
    '......................MMM...........................',
    '......................MMMM..........................',
    '.......................MMM..........................',
    '.......................MMM..........................',
    '.......................MMM..........................',
    '........................MMM.........................',
    '........................MMM.........................',
    '.........................MMM........................',
    '.........................MMM........................',
    '..........................MMMM......................',
    '...........................MMMM.....................',
    '..........................MMMMMMM...................',
    '.........................MMMMMMMMM..................',
    '........................MMMMMMMMMMM.................',
    '.......................MMMMMMMMMMMMMM...............',
    '......................MMMMMMMMMMMMMMM...............',
    '......................MMMMMMMMMMMMMMM...............',
    '......................MMMLMMMMMMMMMMMM..............',
    '.....................MMMLMMMMMMMMMMMMM..............',
    '.....................MMMMMMMMMMMMMMMMMM.............',
    '......................MMMMMMMMMMSSSMMMMM............',
    '.......................MMMMMMMMMSSSMMMMM............',
    '........................MMMMMMMMMMMMMMM.............',
    '.........................MMMMMMMMMMMMM..............',
    '..........................MMMMMMMMMMM...............',
    '..........................MMMMMMMMMMM...............',
    '...........................MMMMMMMMM................',
    '...........................MMMMMMMMM................',
    '............................MMMMMMM.................',
    '............................K...K...................',
    '...........................K.....K..................',
    '...........................K.....K..................',
    '..........................K.......K.................',
    '..........................K.......K.................',
    '.........................K.........K................',
    '........................K...........K...............',
]))

SPRITES.append(sp('peacock', '孔雀：青绿身体 + 巨大扇形尾屏 + 金色眼纹 + 侧视图（面向右）', {
    'M': '#00acc1', 'S': '#00838f', 'L': '#4dd0e1', 'T': '#1a237e', 'C': '#ffd700', 'K': '#1a1a1a',
}, [
    D*48, D*48, D*48,
    '......................CC............................',
    '....................CCCCCC..........................',
    '....................CCCCCC..........................',
    '......................CC............................',
    D*48,
    '................TTTTTTTTTTTTTTT.....................',
    '...............TTCCTTCCTTCCTTCCTT...................',
    '..............TTCCTTCCTTCCTTCCTTCCT.................',
    '.............TTCCTTCCTTCCTTCCTTCCTTC................',
    '............TTCCTTCCTTCCTTCCTTCCTTCCTT..............',
    '...........TTCCTTCCTTCCTTCCTTCCTTCCTTCCT............',
    '..........TTCCTTCCTTCCTTCCTTCCTTCCTTCCTTC...........',
    '...........TTCCTTCCTTCCTTCCTTCCTTCCTTCCT............',
    '.............TTCCTTCCTTCCTTCCTTCCTTCCT..............',
    '............TTCCTTCCTTCCTTCCTTCCTTCCTTC.............',
    '...........TTCCTTCCTTCCTTCCTTCCTTCCTTCCT............',
    '...........TTCCTTCCTTCCTTCCTTCCTTCCTTCCT............',
    '..........TTCCTTCCTTCCTTCCTTCCTTCCTTCCTTC...........',
    '..........MMMCMMMMCMMMMCMMMMCMMMMCMMMMCMM...........',
    '.........MMMMCMMMMCMMMMCMMMMCMMMMCMMMMCMM...........',
    '.........MMMEEECMMMECMMMECMMMECMMMECMMMC............',
    '..........MMMMCMMMMCMMMMCMMMMCMMMMCMMMM.............',
    '...........MMMCMMMCMMMCMMMCMMMCMMMCMMM..............',
    '............MMMCMMMCMMMCMMMCMMMCMMM.................',
    '..............MMMCMMMCMMMCMMMCMM....................',
    '................MMCMMCMMCMMCMM......................',
    '.................MCMMCMMCMMC........................',
    '..................CMMCMMCMM.........................',
    '...................MCMMCM...........................',
    '....................CMMC............................',
    '.....................CCM............................',
    '.....................CMM............................',
    '.....................CMM............................',
    '....................CMMMM...........................',
    '...................CMM..MM..........................',
    '...................CMM..MM..........................',
    '..................CMM...MM..........................',
    '.................CMM.....MM.........................',
    '................CMM.......MM........................',
    '...............CMM.........MM.......................',
    '..............CMM...........MM......................',
    '.............CMM.............MM.....................',
    '............CMM...............MM....................',
    '...........CMM.................MM...................',
    '............MM.................MM...................',
]))

SPRITES.append(sp('penguin', '企鹅：直立黑白 + 白色肚皮 + 橙色嘴脚 + 侧视图（面向右）', {
    'M': '#37474f', 'S': '#263238', 'L': '#546e7a', 'W': '#ffffff', 'N': '#ff9800', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48, D*48, D*48, D*48,
    '...................MMMMMMM..........................',
    '..................MMMMMMMMMM........................',
    '.................KMMMMMMMMMMK.......................',
    '.................KMMNMMMMMMK........................',
    '.................KMMNMMMMMMK........................',
    '................KMMMMMMMMMMK........................',
    '................KMMLMMMMMMMK........................',
    '...............KMMLMMMMMMMMMK.......................',
    '..............KMMMMMMMMMMMMMMK......................',
    '..............KMMMWWWWWWMMMMMMK.....................',
    '.............KMMMMWWWWWWWWMMMMMK....................',
    '.............KMMMMWWWWWWWWWMMMMK....................',
    '............KMMMMWWWWWWWWWWWMMMMK...................',
    '...........KMMMMMWWWWWWWWWWWWMMMMK..................',
    '...........KMMMMMWWWWWWWWWWWWMMMMK..................',
    '..........KMMMMMWWWWWWWWWWWWWWMMMMK.................',
    '.........KMMMMMWWWWWWWWWWWWWWWWMMMMK................',
    '.........KMMMMMWWWWWWWWWWWWWWWWMMMMK................',
    '........KMMMMMWWWWWWWWWWWWWWWWWWMMMMK...............',
    '........KMMMMMWWWWWWWWWWWWWWWWWWMMMMK...............',
    '.......KMMMMMWWWWWWWWWWWWWWWWWWWWMMMMK..............',
    '.......KMMMMMWWWWWWWWWWWWWWWWWWWWMMMMK..............',
    '......KMMMMMWWWWWWWWWWWWWWWWWWWWWWMMMMK.............',
    '......KMMMMMWWWWWWWWWWWWWWWWWWWWWWMMMMK.............',
    '......KMMMMMWWWWWWWWWWWWWWWWWWWWWWWMMMMK............',
    '......KMMMMMWWWWWWWWWWWWWWWWWWWWWWWMMMMK............',
    '.......KMMMMWWWWWWWWWWWWWWWWWWWWWWWMMMMK............',
    '.......KMMMMWWWWWWWWWWWWWWWWWWWWWWWMMMMK............',
    '........KMMMMNNNNNNN.......NNNNNNMMMMK..............',
    '........KMMMMNNNNNNN.......NNNNNNMMMMK..............',
    '.........KMMMMMNNNNNN.....NNNNNNMMMMK...............',
    '..........KMMMMMMNNN.......NNNMMMMMMK...............',
    '...........KMMMMMMMN.......NMMMMMMMK................',
    '............KMMMMMM.........MMMMMMK.................',
    '............KMMMMM...........MMMMMK.................',
    '...........KMMMMM.............MMMMMK................',
    '..........KMMMMM...............MMMMMK...............',
    '.........KMMMMM.................MMMMMK..............',
    '........KMMMMM...................MMMMMK.............',
    '.......KMMMMM.....................MMMMMK............',
]))

SPRITES.append(sp('parrot', '鹦鹉：红色头胸 + 蓝绿身体 + 黄色翅膀 + 黑色弯嘴 + 侧视图（面向右）', {
    'M': '#00897b', 'S': '#00695c', 'L': '#4db6ac', 'C': '#d32f2f', 'T': '#fbc02d', 'K': '#1a1a1a',
}, [
    D*48, D*48, D*48, D*48, D*48, D*48, D*48, D*48,
    '.................KKKKK..............................',
    '................KCCCCCK.............................',
    '................KCCCCCK.............................',
    '................KCCCCCK.............................',
    '...............KCCMMMMCCK...........................',
    '...............KCCMMMMCCK...........................',
    '..............KCCMMMMMMCCK..........................',
    '.............KCCMMMMMMMMCCK.........................',
    '............KCCMMMMMMMMMMCCK........................',
    '............KCCCMMMMMMMMMMCCK.......................',
    '...........KCCCCMMMMMMMMMMMMCCK.....................',
    '..........KCCCCCMMMMTTMMMTTTCCCCK...................',
    '.........KCCCCCCCMMMTTTTMMMTTTCCCCK.................',
    '.........KCCCCCCMMMTTTTTTMMMTTTCCCCK................',
    '........KCCCCCCCMMTTTTTTTTTTTTTCCCCK................',
    '........KCCCCCCCMMTTTTTTTTTTTTTCCCCK................',
    '.........KCCCCCCCMMMTTTTTTTTTTCCCCK.................',
    '..........KCCCCCCCMMMTTTTTTTTCCCCK..................',
    '...........KCCCCCCCMMMTTTTTTCCCCK...................',
    '............KCCCCCMMMMTTTTTTCCCCK...................',
    '.............KCCCCCMMMTTTTCCCCK.....................',
    '..............KCCCCCMMTTCCCCK.......................',
    '...............KCCCCCCCCCCK.........................',
    '................KCCCCCCCK...........................',
    '.................KCCCCK.............................',
    '..................KCCK..............................',
    '...................KK...............................',
    D*48, D*48,
    '...................MMMM.............................',
    '..................MM..MM............................',
    '..................M....M............................',
    '.................M......M...........................',
    '.................M......M...........................',
    '................M........M..........................',
    '...............M..........M.........................',
    '..............M............M........................',
    '.............M..............M.......................',
    '............M................M......................',
    '...........M..................M.....................',
]))

SPRITES.append(sp('owl', '猫头鹰：灰棕身体 + 大圆脸盘 + 大圆眼 + 橙色尖嘴 + 正视图', {
    'M': '#795548', 'S': '#5d4037', 'L': '#a1887f', 'W': '#fff3e0', 'E': '#1a1a1a', 'N': '#ff6f00', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48, D*48, D*48, D*48, D*48, D*48, D*48, D*48,
    '....................MMMMMM..........................',
    '...................MMMMMMMM.........................',
    '.................KMMMMMMMMMMK.......................',
    '................KMMMWWWWWWMMMK......................',
    '...............KMMMWWWWWWWWMMMK.....................',
    '..............KMMMWWEEEEWWWWMMMK....................',
    '..............KMMMWEEEEWWWWWMMMK....................',
    '..............KMMWWWEEEWWWMMMMK.....................',
    '..............KMMMWWNNNWWMMMMK......................',
    '..............KMMMMWWNNWWWMMMMK.....................',
    '..............KMMMMMMMMMMMMMMMMK....................',
    '.............KMMMMMMMMMMMMMMMMMMK...................',
    '.............KMMLMMMMMMMMMMMMMMMMK..................',
    '............KMMLMMMMMMMMMMMMMMMMMK..................',
    '...........KMMLMMMMMMMMMMMMMMMMMMK..................',
    '...........KMMMMMMMMMMMMMMMMMMMMMMK.................',
    '............KMMMMMMMMMMMMMMMMMMMMK..................',
    '............KMMMMMMMMMMMMMMMMMMMMK..................',
    '.............KMMMMMMMMMMMMMMMMMMK...................',
    '.............KMMMMMMMMSSSSMMMMMMK...................',
    '..............KMMMMMMMSSSSMMMMMMMMK.................',
    '..............KMMMMMMMMMMMMMMMMMMMMK................',
    '...............KMMMMMMMMMMMMMMMMMMK.................',
    '...............KMMMMMMMMMMMMMMMMMMK.................',
    '................KMMMMMMMMMMMMMMMMK..................',
    '.................KMMMMMMMMMMMMMMK...................',
    '.................KMMMMMMMMMMMMMMK...................',
    '..................KMMMMMMMMMMMMK....................',
    '..................KMMMMMMMMMMMMK....................',
    '...................KMMMM..MMMMK.....................',
    '...................KMMMM..MMMMK.....................',
    '..................KMMMM....MMMMK....................',
    '..................KMMMM....MMMMK....................',
    '.................KMMMM......MMMMK...................',
    '................KMMMM........MMMMK..................',
    '...............KMMMM..........MMMMK.................',
]))

SPRITES.append(sp('swan', '天鹅：纯白S形长颈 + 红色嘴 + 翅膀尖端微翘 + 侧视图（面向右）', {
    'M': '#ffffff', 'S': '#e0e0e0', 'L': '#fafafa', 'N': '#d32f2f', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48, D*48,
    '............................NNN.....................',
    '...........................NMN......................',
    '...........................NMM......................',
    '..........................NMM.......................',
    '..........................NMM.......................',
    '..........................MMM.......................',
    '..........................MMM.......................',
    '.........................MMMM.......................',
    '.........................MMMM.......................',
    '..........................MMMM......................',
    '..........................MMMM......................',
    '...........................MMMM.....................',
    '...........................MMMM.....................',
    '............................MMMM....................',
    '............................MMMM....................',
    '.............................MMMM...................',
    '.............................MMMMM..................',
    '............................MMMMMMMM................',
    '..........................MMMMMMMMMM................',
    '.........................MMMMMMMMMMMM...............',
    '........................MMMMMMMMMMMMMM..............',
    '.......................MMMMMMMMMMMMMMMM.............',
    '.......................MMLMMMMMMMMMMMMM.............',
    '......................MMLMMMMMMMMMMMMMM.............',
    '......................MMMMMMMMMEEMMMMMMMM...........',
    '......................MMMMMMMMMKKMMMMMMMM...........',
    '......................MMMMMMMMSSSMMMMMMMM...........',
    '......................MMMMMMMMMMMMMMMMMMM...........',
    '......................MMMMMMMMMMMMMMMMMMM...........',
    '.......................MMMMMMMMMMMMMMMMM............',
    '........................MMMMMMMMMMMMMMMM............',
    '........................MMMMMMMMMMMMMM..............',
    '.........................MMMMMMMMMMMM...............',
    '..........................MMMMMMMMMM................',
    '...........................MMMMMMMM.................',
    '............................MMMMMM..................',
    D*48, D*48, D*48,
    '.............HHHHHHHHHHHHHHHHHHHHHHH................',
    '.............HHHHHHHHHHHHHHHHHHHHHHH................',
    '.............HHHHHHHHHHHHHHHHHHHHHHH................',
]))

# --- Chapter 5: Ocean Animals ---
SPRITES.append(sp('fish', '小鱼：天蓝色流线椭圆身体 + 鳞片纹理 + 大白眼睛 + 三角尾鳍背鳍 + 红嘴 + 侧视图（面向右）', {
    'M': '#42a5f5', 'S': '#1976d2', 'L': '#90caf9', 'T': '#0d47a1', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48, D*48,
    '......................SS............................',
    '....................SSSSSS..........................',
    '..................SSSSSSSSSS........................',
    '................SSSSSSSSSSSSSS......................',
    '..............SSSSSMMMMMMMSSSSS.....................',
    '............SSSSSMMMMMMLLLMMMMSSSS..................',
    '..........SSSMMMMMMMLLLMMMMMMMSSS...................',
    '........SSSMMMMMMMLLLTTMMMMMMMS.....................',
    '......KSSMMMMMMMLLLTTTMMMMMMMSS.....................',
    '.....KKSMMMMMMLLLTTTTTMMMMMMMSS.....................',
    '....KKKMMMMMLLLTTTTTTTMMMMMMM.......................',
    '...KKKKMMMMLLLTTTTTTTTTMMMMMMMMMMMMMMMMM............',
    '..KKKKKMMMLLLTTTTTTTTTMMMMWWWWWEMMMMMMMM............',
    '.KKKKKKMMLLLTTTTTTTTTMMMMMWEEEEEWMMMMMMMM...........',
    '.KKKKKKMMLLLTTTTTTTTTMMMMMWWEEEEWMMMMMMMM...........',
    '.KKKKKKMMLLLTTTTTTTTTMMMMMMWWWWWWMMMMMMMMM..........',
    '.KKKKKKMMMLLTTTTTTTTTMMMMMMBBMMMMMMMMMMMMM..........',
    '.KKKKKKMMMLLTTTTTTTTTMMMMMMMBBMMMMMMMMMMM...........',
    '.KKKKKKMMMLTTTTTTTTTTMMMMMMMSSSMMMMMMMMM............',
    '..KKKKKMMMLLTTTTTTTTTMMMMMMSSSSSMMMMMMMM............',
    '...KKKKMMMLLLTTTTTTTTMMMMMMSSSSSMMMMMMM.............',
    '....KKKMMMLLLTTTTTTTTTMMMMMSSSSSMMMMMM..............',
    '.....KKKMMMMMLLLTTTTTTTTMMMMSSSSSMMM................',
    '......KKKMMMMMMMMMLLTTTTTTTMMSSSSSM.................',
    '.......KKKMMMMMMMMMMMMTTTTTTMMMMSSS.................',
    '........KKKKMMMMMMMMMMMMMTTTTMMSSSS.................',
    '.........KKKKKMMMMMMMMMMMMMTTTMSSSSS................',
    '..........KKKKKKSSSSSSSMMMMMMSSSSS..................',
    '............KKKKKSSSSSSSSSSSSSSSS...................',
    '.............KKKSSSSSSSSSSSSSSSSS...................',
    '..............KSSSSSSSSSSSSSSSSSSS..................',
    '.............KSSSSSSSSSSSSSSSSSSSSS.................',
    '............KSSSSSSSSSSSSSSSSSSSSSSS................',
    '...........KSSSSSSSSSSSSSSSSSSSSSSSSS...............',
    '..........KSSSSSSSSSSSSSSSSSSSSSSSSS................',
    '.........KSSSSSSSSSSSSSSSSSSSSSSSSS.................',
    '........KSSSSSSSSSSSSSSSSSSSSSSSSS..................',
    '.......KSSSSSSSSSSSSSSSSSSSSSSSSS...................',
    '......KSSSSSSSSSSSSSSSSSSSSSSSS.....................',
    '.....KSSSSSSSSSSSSSSSSSSSSSSSS......................',
    '....KSSSSSSSSSSSSSSSSSSSSSSS........................',
    '...KSSSSSSSSSSSSSSSSSSSSSS..........................',
]))

SPRITES.append(sp('whale', '鲸鱼：深蓝色椭圆巨身 + 头顶喷水柱水沫 + 白色肚皮 + 宽大尾鳍 + 侧视图（面向右）', {
    'M': '#1e88e5', 'S': '#1565c0', 'L': '#64b5f6', 'W': '#ffffff', 'H': '#81d4fa', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48,
    '.......................HHH..........................',
    '......................HHHHHH........................',
    '.....................HHHHHHHH.......................',
    '....................HHHWWHHHH.......................',
    '...................HHHWWWWHHHH......................',
    '..................HHHWWWWWWHHH......................',
    '.................HHHHWWWWWWHHH......................',
    '..................HHHWWWWWWHH.......................',
    '...................HHHWWWHHH........................',
    '....................HHHHHH..........................',
    D*48, D*48, D*48, D*48,
    '.................MMMMMMMMMMMMMM.....................',
    '...............MMMMMMMMMMMMMMMMM....................',
    '.............MLMMMMMMMMMMMMMMMMMMM..................',
    '............MMLMMMMMMMMMMMMMMMMMMMMM................',
    '...........MMLLMMMMMMMMMMMMMMMMMMMMMMM..............',
    '.........MMMLLLMMMMMMMMMMMMMMMMMMMMMMMMM............',
    '.........MMLLLMMMMMMMMMMMMMMMMMMMMMMMMMMM...........',
    '........MMLLLLMMMMMWWEEEMMMMMMMMMMMMMMMMM...........',
    '........MMLLLLLMMMMMMMMMMWWWWMMMMMMMMMMMM...........',
    '.......MMMLLLLLMMMMMMMMMMMWWWWWWMMMMMMMMMM..........',
    '.......MMMLLLLLMMMMMMMMMMMMWWWWWWMMMMMMMMMM.........',
    '.......MMMMLLLLMMMMMMMMMMMMMWWWWWWMMMMMMMMM.........',
    '.......MMMMLLLLMMMMMMMMMMMMMMMMWWWWWMMMMMMMM........',
    '........MMMMLLLMMMMMMMMMMMMMMMMMWWWWWMMMMMMMMM......',
    '.........MMMMMMLMMMMMMMMMMMMMMMMMWWWWWMMMMMMMMM.....',
    '.........MMMMMMLMMMMMMMMMMMMMMMMMMWWWWWMMMMMMMMM....',
    '..........MMMMMMLMMMMMMMMMMMMMMMMMMWWWWWMMMMMMM.....',
    '...........MMMMMMLMMMMMMMMMMMMMMMMMMMWWWWMMMMM......',
    '...........MMMMMMMLLLMMMMMMMMMMMMMMMMMMMMMMM........',
    '............MMMMMMMMMLLLMMMMMMMMMMMMMMMMMMM.........',
    '.............MMMMMMMMMMMLLLMMMMMMMMMMMMMMM..........',
    '..............MMMMMMMMMMMMMMLLLMMMMMMMMMM...........',
    '...............MMMMMMMMMMMMMMMLLLMMMMMMMM...........',
    '.................MMMMMMMMMMMMMMMLLLLLL..............',
    '...................MMMMMMMMMMMMMMMLLL...............',
    '.....................MMMMMMMMMMMMM..................',
    '.........................MMMMMMM....................',
    '..........................MMMMMM....................',
    '..........................MMMMMM....................',
    '.........................MMMMMMMM...................',
    '.........................MMMMMMMM...................',
    '........................MMMMMMMMM...................',
    '........................MMMMMMMMM...................',
]))

SPRITES.append(sp('octopus', '章鱼：紫红色圆头 + 两只大眼 + 8条弯曲触手 + 粉色吸盘 + 正视图', {
    'M': '#c2185b', 'S': '#880e4f', 'L': '#e91e63', 'T': '#ff80ab', 'P': '#ff80ab', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48,
    '.................MMMMMMMMMMM........................',
    '...............MMMMMMMMMMMMMMMM.....................',
    '..............MMMMMMMMMMMMMMMMMM....................',
    '.............MMLMMMMMMMMMMMMMMLMM...................',
    '............MMMLLLLLMMMMMMLLLLLMMM..................',
    '...........MMMMMLLLLLMMMMLLLLLMMMMM.................',
    '...........MMMMMMMLLLLLMMLLLLLMMMMMM................',
    '..........MMMMMMMEELLLMMLLLEEMMMMMMM................',
    '..........MMMMMMMEELLLMMLLLEEMMMMMMM................',
    '.........MMMMMMMMELLLMMLLLEEMMMMMMMMM...............',
    '.........MMMMMMMMMLLLMMLLLMMMMMMMMMM................',
    '........MMMMMMMMMMMMMMMMMMMMMMMMMMMMM...............',
    '........MMMMMMMMMMMMMMMMMMMMMMMMMMMMM...............',
    '.......MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM..............',
    '.......MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM..............',
    '.......MMMMMMMTMMMMMMMMMMMMMMMMTMMMMMM..............',
    '........MMMMMTTTMMMMMMMMMMMMMMTTTMMMMM..............',
    '.........MMMMMTTTTTTMMMMMMTTTTTTMMMMM...............',
    '..........MMMMMTTTTTTTTTTTTTTTTMMMMM................',
    '...........MMMMTTTTTTTTTTTTTTTMMMMM.................',
    '............MMMMMTTTTTTTTTTTTMMMMM..................',
    '.............MMMMMTTTTTTTTTTMMMM....................',
    '..............MMMMMTTTTTTTTMM.......................',
    '...............MMMMMTTTTTTMMMM......................',
    '................MMMMTTTTTTMMMM......................',
    '................MMMMPTTTTPMMMM......................',
    '...............MMMMMPTTTPMMMMM......................',
    '...............MMMMMPTTTPMMMMM......................',
    '..............MMMMMMPTTPMMMMMM......................',
    '..............MMMMMMMTTMMMMMMMM.....................',
    '.............MMMMMMMPPMMMMMMMM......................',
    '.............MMMMMMMTTMMMMMMMM......................',
    '............MMMMMMMPPMMMMMMMMMMM....................',
    '............MMMMMMMTTMMMMMMM.MMMM...................',
    '...........MMMMMMPPMMMMMMMMM..MMMM..................',
    '...........MMMMMMTTMMMMMMM....MMMMM.................',
    '..........MMMMMMPPMMMMMMM......MMMMM................',
    '.........MMMMMMTTMMMMMM.........MMMMM...............',
    '........MMMMMMPPTMMMMM...........MMMMM..............',
    '........MMMMMTTMMMMMM.............MMM...............',
    '.......MMMMMPPMMMMMM...............MM...............',
    '......MMMMMTTMMMMM..................MM..............',
    '.....MMMMPPMMMMMM...................M...............',
]))

SPRITES.append(sp('jellyfish', '水母：淡紫色钟形伞盖 + 小黑眼睛 + 飘逸白色波浪触须 + 正视图', {
    'M': '#ab47bc', 'S': '#8e24aa', 'L': '#ce93d8', 'T': '#ffffff', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48,
    '...................MMMMMMM..........................',
    '.................MMMMMMMMMMM........................',
    '................MLLMMMMMMMMML.......................',
    '...............MLLLMMMMMMMMMLL......................',
    '..............MMLLLMMMMMMMMMLLM.....................',
    '.............MMMLLLMMMMMMMLLLMMM....................',
    '............MMMMLLLLMMMMMLLLLMMMM...................',
    '............MMMMLLLLMMMMMLLLLMMMM...................',
    '...........MMMMMMMMLLLLLLLMMMMMMMM..................',
    '..........MMLMMMMMMMLLLMMMMMMMMLMM..................',
    '..........MMLLMMMMMLLLLMMMMMMMMLLM..................',
    '.........MMMLLLMMMMMEELLEEMMMMLLLMMM................',
    '.........MMMMLLLMMMMEELLEEMMMMLLLMMM................',
    '........MMMMMLLLLLLLLEELLEELLLLLLLMMM...............',
    '.......MMMMMMMMLLLLLLLLLLLLLLLMMMMMMMMM.............',
    '.......MMMMMMMMLLLLLLLLLLLLLLLMMMMMMMMM.............',
    '......MMMMMMMMMMLLLLLLLLLLLLLMMMMMMMMMMM............',
    '......MMMMMMMTTTMTTLLLLLLLTTMTTMMMMMMM..............',
    '.....MMMMMTTTTTTTTTTTTTTTTTTTTTTTTTMMMMMM...........',
    '......MMMTTTTTTTTTTTTTTTTTTTTTTTTTTTMMMM............',
    '.......MMTTTTTTTTTTTTTTTTTTTTTTTTTTTTMM.............',
    '........MTTTTTTTTTTTTTTTTTTTTTTTTTTTTTM.............',
    '........MTTTTTTTTTTTTTTTTTTTTTTTTTTTTTM.............',
    '........MTTTTTTTTTTTTTTTTTTTTTTTTTTTTTM.............',
    '.........MTTTTTTTTTTTTTTTTTTTTTTTTTTTM..............',
    '.........MTTTTTTTTTTTTTTTTTTTTTTTTTTTM..............',
    '..........MTTTTTTTTTTTTTTTTTTTTTTTTTM...............',
    '..........MTTTTTTTTTTTTTTTTTTTTTTTTTM...............',
    '...........MTTTTTTTTTTTTTTTTTTTTTTTM................',
    '...........MTTTTTTTTTTTTTTTTTTTTTTTM................',
    '............MTTTTTTTTTTTTTTTTTTTTTM.................',
    '.............MTTTTTTTTTTTTTTTTTTTM..................',
    '.............MTTTTTTTTTTTTTTTTTTTM..................',
    '..............MTTTTTTTTTTTTTTTTTM...................',
    '..............MTTTTTTTTTTTTTTTTTM...................',
    '...............MTTTTTTTTTTTTTTTM....................',
    '................MTTTTTTTTTTTTTM.....................',
    '................MTTTTTTTTTTTTTM.....................',
    '.................MTTTTTTTTTTTM......................',
    '.................MTTTTTTTTTTTM......................',
    '..................MTTTTTTTTTM.......................',
    '..................MTTTTTTTTTM.......................',
    '...................MTTTTTTTM........................',
    '...................MTTTTTTTM........................',
    '....................MTTTTTM.........................',
]))

SPRITES.append(sp('dolphin', '海豚：蓝灰弧线流线身体 + 三角形背鳍 + 微笑弧线嘴 + 白色肚皮 + 叉形尾鳍 + 侧视图（面向右）', {
    'M': '#64b5f6', 'S': '#42a5f5', 'L': '#90caf9', 'W': '#ffffff', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48, D*48, D*48,
    '.......................SSSS.........................',
    '.....................SSSSSSSS.......................',
    '...................SSSSSSSSSS.......................',
    '.................SSSSSSSSSSSSSS.....................',
    '..............SSSSMMMMMMMMMSSSSS....................',
    '............SSSMMMMMMMLLLMMMMMMSSS..................',
    '..........SSMMMMMMMLLLMMMMMMMSSS....................',
    '........SSMMMMMMMLLLTTMMMMMMMS......................',
    '......KKSMMMMMMLLLTTTTTMMMMMMSS.....................',
    '.....KKKMMMMMMLLLTTTTTTTMMMMMM......................',
    '....KKKKMMMMLLLTTTTTTTTTMMMMMMM.....................',
    '...KKKKKMMMLLLTTTTTTTTTMMMMWWWWWMMMMMMMM............',
    '..KKKKKMMMLLLTTTTTTTTTTMMMWEEEEEWMMMMMMMMM..........',
    '.KKKKKKMMLLLTTTTTTTTTTTMMMWWEEEEWMMMMMMMMMM..........',
    '.KKKKKMMMLLLTTTTTTTTTTTMMMWWEEEEWMMMMMMMMMM..........',
    '.KKKKKMMMMLLTTTTTTTTTTTMMMWWWWWWMMMMMMMMMMM..........',
    '.KKKKKMMMMLLTTTTTTTTTTTMMMKKMMMMMMMMMMMMMMM..........',
    '.KKKKKMMMMMLTTTTTTTTTTTMMMMKKMMWWMMMMMMMMMM..........',
    '.KKKKKMMMMMLTTTTTTTTTTTMMMMMMMWWWWMMMMMMMMM..........',
    '..KKKKMMMMMMLTTTTTTTTTTTMMMMMWWWWWWMMMMMMMM..........',
    '...KKKMMMMMMLLTTTTTTTTTTMMMMMWWWWWWWWMMM............',
    '....KKKMMMMMMLLLTTTTTTTTMMMMMWWWWWWWWMM.............',
    '.....KKKMMMMMMMMMLLTTTTTTTMMMWWWWWWWWMMM............',
    '......KKKMMMMMMMMMMMMTTTTTTTMMWWWWWWWMMM............',
    '.......KKKKKMMMMMMMMMMMMTTTTTTTMMMMMMMM.............',
    '.........KKKKKKKMMMMMMMMMMMMMTTTSSSSSSS.............',
    '............KKKKKKSSSSSSSSSSSSSSSSSSSSS.............',
    '..............KKKSSSSSSSSSSSSSSSSSSSSSS.............',
    '..............KKSSSSSSSSSSSSSSSSSSSSSSS.............',
    '.............KSSSSSSSSSSSSSSSSSSSSSSSSS.............',
    '............KSSSSSSSSSSSSSSSSSSSSSSSSSS.............',
    '...........KSSSSSSSSSSSSSSSSSSSSSSSSSSS.............',
    '..........KSSSSSSSSSSSSSSSSSSSSSSSSSSS..............',
    '.........KSSSSSSSSSSSSSSSSSSSSSSSSSSS...............',
    '........KSSSSSSSSSSSSSSSSSSSSSSSSSSS................',
    '.......KSSSSSSSSSSSSSSSSSSSSSSSSSSS.................',
    '......KSSSSSSSSSSSSSSSSSSSSSSSSSS...................',
    '.....KSSSSSSSSSSSSSSSSSSSSSSSSS.....................',
    '....KSSSSSSSSSSSSSSSSSSSSSSSSS......................',
    '...KSSSSSSSSSSSSSSSSSSSSSSSS........................',
    '..KSSSSSSSSSSSSSSSSSSSSSSS..........................',
]))

SPRITES.append(sp('turtle', '海龟：深绿六角龟壳 + 浅绿壳纹格子 + 绿色圆头 + 小黑眼睛 + 四鳍状肢 + 侧视图（面向右）', {
    'M': '#2e7d32', 'S': '#1b5e20', 'L': '#66bb6a', 'T': '#a5d6a7', 'K': '#2c2c2c',
}, [
    D*48, D*48, D*48, D*48, D*48, D*48, D*48, D*48, D*48, D*48, D*48, D*48,
    '..........LLLLL.....................................',
    '.........LLLLLLL....................................',
    '........LLLWWEELLL..................................',
    '.......LLLLWWEELLLLM................................',
    '......LLLLLWWWLLLLLMTMMMMMMMMMMMMMMMMM..............',
    '.....LLLLLLLWWLLLLLTMTMMMMMMMMMMMTTMMMMMMMMMM.......',
    '....LLLLLLLLLLLLLLLMTMTMMMMMMMMMTTTTMMMMMTTMMMM.....',
    '....LLLLLLLLLLLLLLMTMTMTMMMMMMMTTTTTTMMMTTTMMMM.....',
    '....LLLLLLLLLLLLLLMTMTMTMMMMMMTTTTTTTTTTTTMMMM......',
    '.....LLLLLLLLLLLLMTMTMTMTMMMMTTTTTTTTTTTTTMMMM......',
    '......LLLLLLLLLLMTMTMTMTMMMTTTTTTTTTTTTTTMMMM.......',
    '.......LLLLLLLLMTMTMTMTMTMTTTTTTTTTTTTTTMMMMM.......',
    '........LLLLLLMTMTMTMTMTMTTTTTTTTTTTTTTMMMMMM.......',
    '.........LLLLLMMMMMTMTMTTTTTTTTTTTTTTMMMMLLLL.......',
    '..........LLLLLLLMMMMMTMTTTTTTTTTTTTMMMMLLLLL.......',
    '...........LLLLLLLLLMMMMTTTTTTTTTTTMMMMLLLLLL.......',
    '.............LLLLLLLLLLMMMMTTTTTTTMMMMLLLLLLL.......',
    '...............LLLLLLLLLLLMMMMTTMMMMMMMMLLLLL.......',
    '................LLLLLLLLLLLLLMMMMMMMMMMLLLL.........          ',
    '..................LLLLLLLLLLLLLLLMMMMMMLLL..........',
    '....................LLLLLLLLLLLLLLLLMMML............',
    '.....................LLLLLLLLLLLLLLLLLL.............',
    '......................LLLLLLLLLLLLLLLLL.............',
    '.......................LLLLLLLLLLLLLLL..............',
    '........................LLLLLLLLLLLLL...............',
    '.........................LLLLLLLLLLL................',
    '..........................LLLLLLLLL.................',
    '...........................LLLLLLL..................',
    '............................LLLLL...................',
    '.............................LLL....................',
    D*48, D*48, D*48, D*48, D*48, D*48,
]))


# =============================================
# Generate the output file
# =============================================

def generate_file():
    sprite_str = ',\n'.join(SPRITES)

    return f'''/**
 * 像素风 Q 萌动物绘制系统（48×48 扁平方块版）
 * 纯逻辑层，用 Canvas API 程序化绘制 30 种动物
 *
 * v8 改动：
 *  - 所有 30 种动物完全重新设计，参考高品质像素风动物素材
 *  - 统一设计规范：清晰轮廓K + 主色M + 暗影S + 高光L
 *  - 可爱比例：大头+大眼+圆润轮廓，Q萌风格
 *  - 每种动物有独特识别特征，一眼可辨
 *
 * 像素字符含义：
 *  '.' 透明
 *  'K' 黑/轮廓  'W' 白  'M' 主色  'S' 暗影  'L' 高光
 *  'P' 粉色  'E' 眼睛  'B' 嘴红/冠红  'N' 嘴橙/喙色  'T' 纹理/暗纹
 *  'C' 装饰色(项圈/羽冠等)  'H' 喷水/高光色
 */
import type {{ AnimalType }} from '@game/types'

/** 像素尺寸 */
export const PIXEL_SIZE = 48

/** 调色板：字符 -> 颜色 */
export interface Palette {{
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
}}

/** 动物像素图定义 */
interface AnimalSprite {{
  palette: Palette
  pixels: string[]
}}

/** 通用调色板基础色（M/S/L 由各动物单独覆盖） */
const BASE: Palette = {{
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
}}

/**
 * 30 种动物的像素图（48×48 扁平方块）
 * 按章节分组，全身体型侧视图，标志性颜色
 * v8: 全部重新设计，参考高品质像素风动物素材
 */
const SPRITES: Record<AnimalType, AnimalSprite> = {{
{sprite_str}
}}

/**
 * 绘制单个动物到 Canvas 上下文
 *
 * @param ctx Canvas 2D 上下文
 * @param animal 动物类型
 * @param frame 帧：'idle' | 'hover'
 * @param scale 缩放倍数（1 = 48px，2 = 96px...）
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
): void {{
  const sprite = SPRITES[animal]
  if (!sprite) return

  const pal = sprite.palette

  // hover 帧：整体上移 2px（弹跳效果更明显）
  const bounceY = frame === 'hover' ? -2 : 0

  // 绘制像素图
  for (let row = 0; row < PIXEL_SIZE; row++) {{
    const line = sprite.pixels[row]
    if (!line) continue
    for (let col = 0; col < PIXEL_SIZE; col++) {{
      const ch = line[col]
      if (ch === '.' || ch === ' ') continue

      let color: string | undefined
      switch (ch) {{
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
      }}
      if (!color) continue

      // hover 帧眼睛变成 ^^（开心眼，用粉色）
      if (frame === 'hover' && ch === 'E') {{
        color = pal.P
      }}

      ctx.fillStyle = color
      ctx.fillRect(
        offsetX + col * scale,
        offsetY + (row + bounceY) * scale,
        scale,
        scale
      )
    }}
  }}
}}

/**
 * 获取动物的背景色（用于牌面背景）
 * 固定浅色背景，不跟随动物主色，避免同色融合看不出轮廓
 */
export function getAnimalBgColor(_animal: AnimalType): string {{
  return '#f8f5ee'
}}

/**
 * 动物中文名映射（30 种）
 */
export const ANIMAL_NAMES: Record<AnimalType, string> = {{
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
}}

/** 绘制机制遮罩（在动物之上） */
export function drawMechanicOverlay(
  ctx: CanvasRenderingContext2D,
  mechanicType: string,
  canvasSize: number
): void {{
  const s = canvasSize
  const half = s / 2
  ctx.globalAlpha = 0.55

  switch (mechanicType) {{
    case 'moody': {{
      // 乌云遮罩 - 顶层深色
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
    }}
    case 'vine': {{
      // 绿色藤蔓缠绕
      ctx.fillStyle = '#388e3c'
      const cx = half, cy = half
      for (let i = 0; i < 5; i++) {{
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
      }}
      const cx2 = half
      const cy2 = half
      ctx.fillStyle = '#66bb6a'
      for (let i = 0; i < 3; i++) {{
        const angle = (i * 120) * Math.PI / 180
        const bx = cx2 + Math.cos(angle) * half * 0.6
        const by = cy2 + Math.sin(angle) * half * 0.6
        ctx.beginPath()
        ctx.ellipse(bx, by, 6, 3, angle, 0, Math.PI * 2)
        ctx.fill()
      }}
      break
    }}
    case 'sleepy': {{
      // ZZZ气泡 + 半透明暗色
      ctx.fillStyle = 'rgba(30,30,60,0.3)'
      ctx.fillRect(0, 0, s, s)
      // bubbles
      ctx.fillStyle = '#e3f2fd'
      ctx.globalAlpha = 0.7
      ;[[s*0.65, s*0.25, 6],[s*0.78, s*0.12, 8],[s*0.88, s*0.02, 5]].forEach(([x,y,r]) => {{
        ctx.beginPath()
        ctx.arc(x as number, y as number, r as number, 0, Math.PI*2)
        ctx.fill()
      }})
      ctx.globalAlpha = 0.55
      break
    }}
    case 'hidden': {{
      // 金色问号
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, s, s)
      ctx.fillStyle = '#ffd700'
      ctx.font = `bold ${{s*0.6}}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('?', half, half)
      break
    }}
    case 'bubble': {{
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
    }}
  }}
  ctx.globalAlpha = 1
}}

/** 绘制机制解除后的效果 */
export function drawMechanicResolved(
  ctx: CanvasRenderingContext2D,
  mechanicType: string,
  canvasSize: number
): void {{
  if (mechanicType !== 'moody' && mechanicType !== 'sleepy') return
  const s = canvasSize
  const half = s / 2
  // gold sparkle
  ctx.fillStyle = '#ffd700'
  ctx.globalAlpha = 0.6
  for (let i = 0; i < 4; i++) {{
    const angle = (i * 90) * Math.PI / 180
    const x = half + Math.cos(angle) * half * 0.35
    const y = half + Math.sin(angle) * half * 0.35
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI*2)
    ctx.fill()
  }}
  ctx.globalAlpha = 1
}}
'''

# Write the file
with open(OUTPATH, 'w', encoding='utf-8', newline='\n') as f:
    f.write(generate_file())

print(f"Generated {OUTPATH}")

# Verify all sprites have exactly 48 rows of exactly 48 chars
import re
with open(OUTPATH, 'r', encoding='utf-8') as f:
    text = f.read()

# Check each pixels block
idx = 0
count = 0
while True:
    idx = text.find('pixels:', idx)
    if idx == -1:
        break
    count += 1
    bracket = text.index('[', idx)
    depth = 0
    end = bracket
    in_str = False
    for i in range(bracket, len(text)):
        ch = text[i]
        if ch == "'" and (i == 0 or text[i-1] != '\\'):
            in_str = not in_str
        if not in_str:
            if ch == '[':
                depth += 1
            elif ch == ']':
                depth -= 1
                if depth == 0:
                    end = i
                    break
    block = text[bracket:end+1]
    rows = [l for l in block.split('\n') if re.match(r"\s*'[^']*',?\s*$", l)]
    if len(rows) != 48:
        print(f"  ERROR: Block {count} has {len(rows)} rows")
    else:
        bad_rows = [i for i,r in enumerate(rows) if len(re.match(r"\s*'([^']*)'", r).group(1)) != 48]
        if bad_rows:
            print(f"  ERROR: Block {count} has bad widths at rows:", bad_rows[:5])
    idx = end + 1

print(f"Verified {count} pixel array blocks")
print("Done!")
