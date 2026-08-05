/**
 * 星级判定（分数主导乘数式）验证脚本
 * 运行：npx tsx scripts/verify-stars.ts
 * 结果为 DONE 时全部用例通过。
 */
import {
  calcStars,
  SCORE_PER_TILE,
  CLICK_FULL,
  PROPS_SATURATION,
  BASE,
  WEIGHT_TIME,
  WEIGHT_PROPS,
  WEIGHT_CLICK,
  STAR_3_THRESHOLD,
  STAR_2_THRESHOLD,
  STAR_1_THRESHOLD,
  type StarInput,
} from '../src/game/stars'

const TILE_COUNT = 56
const MAX_SLOTS = 7
const TIME_LIMIT = 420
const FULL_SCORE = TILE_COUNT * SCORE_PER_TILE // 672

function makeBase(score: number, timeLeft: number, propsUsed: number, clickLeft: number): StarInput {
  return {
    score,
    timeLeft,
    propsUsed,
    clickLeft,
    timeLimit: TIME_LIMIT,
    tileCount: TILE_COUNT,
    maxSlots: MAX_SLOTS,
  }
}

/** 依据实际公式计算理论 starScore，用于边界用例索引用 */
function starScoreOf(input: StarInput): number {
  const fScore = Math.min(1, input.score / (input.tileCount * SCORE_PER_TILE))
  const fTime = Math.min(1, input.timeLeft / input.timeLimit)
  const fProps = Math.max(0, 1 - input.propsUsed / PROPS_SATURATION)
  const fClick =
    input.clickLeft < 0 ? 1 : Math.min(1, input.clickLeft / CLICK_FULL)
  return (
    fScore *
    (BASE + WEIGHT_TIME * fTime + WEIGHT_PROPS * fProps + WEIGHT_CLICK * fClick)
  )
}

let passed = 0
let failed = 0

function check(name: string, input: StarInput, expected: number) {
  const actual = calcStars(input)
  const s = starScoreOf(input).toFixed(6)
  const ok = actual === expected
  if (ok) passed++
  else failed++
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  [${name}]  starScore=${s}  =>  ${actual}  (期望 ${expected})`,
  )
}

console.log(`满分 = ${FULL_SCORE}`)
console.log('---')

// 1. 高分+满时间+无用道具+满点击 → 3星
check('1 高分+满时间+无用道具+满点击', makeBase(FULL_SCORE, TIME_LIMIT, 0, CLICK_FULL), 3)

// 2. 低分(半途)+满时间+无用道具 → 1星 (starScore=0.5)
check('2 低分+满时间+无用道具', makeBase(FULL_SCORE / 2, TIME_LIMIT, 0, CLICK_FULL), 1)

// 3. 高分但用满3道具 → 2星 (starScore=0.8)
check('3 高分但用满3道具', makeBase(FULL_SCORE, TIME_LIMIT, PROPS_SATURATION, CLICK_FULL), 2)

// 4. 高分+时间耗尽(timeLeft=0) → 2星 (starScore=0.8)
check('4 高分+时间耗尽', makeBase(FULL_SCORE, 0, 0, CLICK_FULL), 2)

// 5. 藤蔓关 clickLeft=0 → 2星 (最高2星)
check('5 藤蔓关点击0', makeBase(FULL_SCORE, TIME_LIMIT, 0, 0), 2)

// 6. 无 timeLimit 关（challenge 也算有）→ 基准归一化 → 3星
check('6 基准归一化满分', makeBase(FULL_SCORE, TIME_LIMIT, 0, CLICK_FULL), 3)

// 7. 分数=0 → 0星
check('7 分数为0', makeBase(0, TIME_LIMIT, 0, CLICK_FULL), 0)

// 8. 满分+满时间+0道具+满点击 → 3星
check('8 全满满分', makeBase(FULL_SCORE, TIME_LIMIT, 0, CLICK_FULL), 3)

// 9. timeLeft 极少 → 2星（强降星）
check('9 时间极少', makeBase(FULL_SCORE, 1, 0, CLICK_FULL), 2)

// 10. 边界阈值精确映射（基于实际公式 starScore=fScore*1.0）
//    - 3星：score=572 → 0.8512 ≥ 0.85
//    - 2星：score=404 → 0.6012 ≥ 0.6
//    - 1星：score=302 → 0.4494 ≥ 0.3
//    - 0星：score=201 → 0.2991 < 0.3
check('10a 恰在√3星阈值上方', makeBase(572, TIME_LIMIT, 0, CLICK_FULL), 3)
check('10b 恰在2星阈值上方', makeBase(404, TIME_LIMIT, 0, CLICK_FULL), 2)
check('10c 一星区间中部', makeBase(302, TIME_LIMIT, 0, CLICK_FULL), 1)
check('10d 恰在1星阈值下方', makeBase(201, TIME_LIMIT, 0, CLICK_FULL), 0)

console.log('--- 防御分支 ---')
// 11. tileCount <= 0 → 0星
check('11 tileCount=0', { ...makeBase(FULL_SCORE, TIME_LIMIT, 0, CLICK_FULL), tileCount: 0 }, 0)
// 12. timeLimit <= 0 → 0星
check('12 timeLimit=0', { ...makeBase(FULL_SCORE, TIME_LIMIT, 0, CLICK_FULL), timeLimit: 0 }, 0)
// 13. 负分数 → 钳制为 0 → 0星
check('13 score 为负', makeBase(-100, TIME_LIMIT, 0, CLICK_FULL), 0)
// 14. propsUsed 远超饱和 → fProps 钳制为 0
check('14 propsUsed 用满远超3', makeBase(FULL_SCORE, TIME_LIMIT, 10, CLICK_FULL), 2)
// 15. clickLeft=-1 视为无机制满值
check('15 clickLeft=-1 满值', makeBase(FULL_SCORE, TIME_LIMIT, 0, -1), 3)

console.log('---')
console.log(`通过 ${passed} 条，失败 ${failed} 条`)
process.exit(failed === 0 ? 0 : 1)