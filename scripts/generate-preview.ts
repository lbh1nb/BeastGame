/**
 * 生成 56 种动物的 HTML 预览页面（图片素材版）
 * 读取 resources/animals/static 下的图片，转 base64 内嵌，
 * 输出独立的 HTML 文件供 PureShowWidget 展示。
 */
import * as fs from 'fs'
import * as path from 'path'

const ANIMAL_LIST: Array<[string, string]> = [
  // 第1章 家畜
  ['sheep', '绵羊'], ['pig', '小猪'], ['chicken', '小鸡'], ['cow', '奶牛'],
  ['horse', '小马'], ['goat', '山羊'], ['duck', '小鸭'], ['rooster', '公鸡'],
  // 第2章 野兽
  ['tiger', '老虎'], ['lion', '狮子'], ['bear', '棕熊'], ['wolf', '灰狼'],
  ['fox', '狐狸'], ['zebra', '斑马'], ['camel', '骆驼'], ['giraffe', '长颈鹿'],
  ['boar', '野猪'], ['cheetah', '猎豹'],
  // 第3章 森林
  ['monkey', '猴子'], ['panda', '熊猫'], ['deer', '小鹿'], ['moose', '驼鹿'],
  ['kangaroo', '袋鼠'], ['koala', '考拉'], ['squirrel', '松鼠'], ['raccoon', '浣熊'],
  ['meerkat', '猫鼬'], ['hare', '野兔'],
  // 第4章 小动物
  ['rabbit', '兔子'], ['cat', '小猫'], ['dog', '小狗'], ['otter', '水獭'],
  ['badger', '獾'], ['beaver', '河狸'], ['hedgehog', '刺猬'], ['skunk', '臭鼬'],
  // 第5章 海洋
  ['fish', '小鱼'], ['whale', '鲸鱼'], ['dolphin', '海豚'], ['octopus', '章鱼'],
  ['jellyfish', '水母'], ['turtle', '海龟'], ['crab', '螃蟹'], ['seahorse', '海马'],
  ['shark', '鲨鱼'], ['crocodile', '鳄鱼'],
  // 第6章 综合
  ['hippo', '河马'], ['rhino', '犀牛'], ['elephant', '大象'], ['frog', '青蛙'],
  ['seal', '海豹'], ['owl', '猫头鹰'], ['goose', '白鹅'], ['penguin', '企鹅'],
  ['flamingo', '火烈鸟'], ['ostrich', '鸵鸟']
]

const staticDir = path.resolve(__dirname, '..', 'resources', 'animals', 'static')

// 读取图片并转 base64
function imageDataUrl(name: string): string {
  const file = path.join(staticDir, `${name}.jpg`)
  if (!fs.existsSync(file)) return ''
  const buf = fs.readFileSync(file)
  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

const cells = ANIMAL_LIST.map(([name, label]) => {
  const src = imageDataUrl(name)
  return `<div class="animal-cell">
  ${src ? `<img class="animal-img" src="${src}" alt="${label}"/>` : '<div class="animal-missing">缺图</div>'}
  <div class="animal-label">${label}</div>
</div>`
}).join('\n')

const html = `<style>
.animal-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;padding:10px;background:#1e1e2e;border-radius:8px}
.animal-cell{display:flex;flex-direction:column;align-items:center;gap:4px;background:#2a2a3c;border-radius:6px;padding:6px}
.animal-label{color:#e0e0e0;font-size:11px;font-family:sans-serif;font-weight:bold}
.animal-img{width:56px;height:56px;object-fit:contain;border-radius:4px;background:#f8f5ee}
.animal-missing{width:56px;height:56px;display:flex;align-items:center;justify-content:center;color:#ff6b6b;font-size:11px;background:#3a3a4c}
</style>
<div class="animal-grid" data-dynamic-ui-widget data-template="explanation-panel" data-mounted="true" id="ag">
${cells}
</div>`

const outDir = path.resolve(__dirname, '..', 'preview')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, 'animals-preview.html')
fs.writeFileSync(outPath, html, 'utf-8')
console.log(`HTML generated: ${outPath}`)
console.log(`Size: ${Buffer.byteLength(html, 'utf-8')} bytes`)
console.log(`Animals: ${ANIMAL_LIST.length}`)