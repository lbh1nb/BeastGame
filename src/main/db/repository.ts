import { getDb } from './index'

// ============================================================================
// 类型定义（弱类型 any 兼容 better-sqlite3 返回结果，避免与渲染层耦合）
// ============================================================================

export interface GameRecordInput {
  mode: 'classic3' | 'classic4' | 'level'
  level_id?: number | null
  score: number
  duration: number
  max_combo: number
  props_used?: any[]
  result: 'win' | 'lose'
}

export interface LevelProgressUpdate {
  status?: 'locked' | 'unlocked' | 'done'
  stars?: number
  best_score?: number
  best_duration?: number
}

// ============================================================================
// 默认配置
// ============================================================================

// 默认音量设置（key 用驼峰，与渲染层 settings store 保持一致）
export const DEFAULT_SETTINGS: Record<string, any> = {
  bgmVolume: 80,
  sfxVolume: 80
}

// 总关卡数（与 initLevelProgress 配合）
export const TOTAL_LEVELS = 30

// ============================================================================
// 记录类（game_records）
// ============================================================================

/**
 * 插入一局游戏记录，返回自增 id
 */
export function saveGameRecord(record: GameRecordInput): number {
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)
  const stmt = db.prepare(`
    INSERT INTO game_records
      (mode, level_id, score, duration, max_combo, props_used, result, created_at)
    VALUES
      (@mode, @level_id, @score, @duration, @max_combo, @props_used, @result, @created_at)
  `)
  const result = stmt.run({
    mode: record.mode,
    level_id: record.level_id ?? null,
    score: record.score,
    duration: record.duration,
    max_combo: record.max_combo,
    props_used: JSON.stringify(record.props_used ?? []),
    result: record.result,
    created_at: now
  })
  return Number(result.lastInsertRowid)
}

/**
 * 查询游戏记录，可按模式过滤，按 created_at 倒序
 */
export function getGameRecords(mode?: string, limit?: number): any[] {
  const db = getDb()
  const sqlParts: string[] = []
  const params: any[] = []

  if (mode) {
    sqlParts.push('mode = ?')
    params.push(mode)
  }

  let sql = 'SELECT * FROM game_records'
  if (sqlParts.length > 0) {
    sql += ' WHERE ' + sqlParts.join(' AND ')
  }
  sql += ' ORDER BY created_at DESC'

  if (limit && limit > 0) {
    sql += ' LIMIT ?'
    params.push(limit)
  }

  const stmt = db.prepare(sql)
  const rows = stmt.all(...params) as any[]
  // 反序列化 props_used
  return rows.map((row) => {
    try {
      row.props_used = JSON.parse(row.props_used ?? '[]')
    } catch {
      row.props_used = []
    }
    return row
  })
}

/**
 * 获取指定模式的最高分（无记录返回 null）
 */
export function getBestScore(mode: string): number | null {
  const db = getDb()
  const stmt = db.prepare('SELECT MAX(score) AS best FROM game_records WHERE mode = ?')
  const row = stmt.get(mode) as any
  return row && row.best != null ? Number(row.best) : null
}

/**
 * 获取全局排行榜（按 score 倒序）
 */
export function getRanking(limit?: number): any[] {
  const db = getDb()
  const safeLimit = limit && limit > 0 ? limit : 50
  const stmt = db.prepare(
    'SELECT * FROM game_records ORDER BY score DESC, created_at DESC LIMIT ?'
  )
  const rows = stmt.all(safeLimit) as any[]
  return rows.map((row) => {
    try {
      row.props_used = JSON.parse(row.props_used ?? '[]')
    } catch {
      row.props_used = []
    }
    return row
  })
}

// ============================================================================
// 进度类（level_progress）
// ============================================================================

/**
 * 获取所有关卡的进度
 */
export function getAllProgress(): any[] {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM level_progress ORDER BY level_id ASC')
  return stmt.all() as any[]
}

/**
 * 获取指定关卡的进度
 */
export function getProgress(levelId: number): any | null {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM level_progress WHERE level_id = ?')
  return stmt.get(levelId) ?? null
}

/**
 * 更新关卡进度（仅更新传入字段）
 */
export function updateProgress(levelId: number, data: LevelProgressUpdate): void {
  const db = getDb()
  const fields: string[] = []
  const params: any[] = []

  if (data.status !== undefined) {
    fields.push('status = ?')
    params.push(data.status)
  }
  if (data.stars !== undefined) {
    fields.push('stars = ?')
    params.push(data.stars)
  }
  if (data.best_score !== undefined) {
    fields.push('best_score = ?')
    params.push(data.best_score)
  }
  if (data.best_duration !== undefined) {
    fields.push('best_duration = ?')
    params.push(data.best_duration)
  }

  if (fields.length === 0) {
    return
  }

  fields.push('updated_at = ?')
  params.push(Math.floor(Date.now() / 1000))
  params.push(levelId)

  const stmt = db.prepare(
    `UPDATE level_progress SET ${fields.join(', ')} WHERE level_id = ?`
  )
  stmt.run(...params)
}

/**
 * 解锁指定关卡
 */
export function unlockLevel(levelId: number): void {
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)
  const stmt = db.prepare(
    `UPDATE level_progress
       SET status = 'unlocked', updated_at = ?
     WHERE level_id = ? AND status = 'locked'`
  )
  stmt.run(now, levelId)
}

/**
 * 初始化 30 关进度：第 1 关 unlocked，其余 locked
 */
export function initLevelProgress(): void {
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO level_progress
      (level_id, status, stars, best_score, best_duration, updated_at)
    VALUES
      (?, ?, 0, 0, 0, ?)
  `)
  const insertMany = db.transaction((levels: number[]) => {
    for (const levelId of levels) {
      const status = levelId === 1 ? 'unlocked' : 'locked'
      stmt.run(levelId, status, now)
    }
  })
  const levels = Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1)
  insertMany(levels)
}

// ============================================================================
// 成就类（achievements）
// ============================================================================

/**
 * 获取全部成就
 */
export function getAllAchievements(): any[] {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM achievements ORDER BY id ASC')
  return stmt.all() as any[]
}

/**
 * 解锁成就，返回是否为"新解锁"（之前未解锁返回 true，否则 false）
 */
export function unlockAchievement(id: string): boolean {
  const db = getDb()
  const getStmt = db.prepare('SELECT unlocked FROM achievements WHERE id = ?')
  const row = getStmt.get(id) as any
  if (!row) {
    // 成就不存在，先插入已解锁记录
    const now = Math.floor(Date.now() / 1000)
    db.prepare(
      `INSERT OR REPLACE INTO achievements (id, unlocked, unlocked_at, progress)
       VALUES (?, 1, ?, 0)`
    ).run(id, now)
    return true
  }
  if (row.unlocked === 1) {
    return false
  }
  const now = Math.floor(Date.now() / 1000)
  db.prepare(
    'UPDATE achievements SET unlocked = 1, unlocked_at = ? WHERE id = ?'
  ).run(now, id)
  return true
}

/**
 * 更新成就累计进度（不会改变 unlocked 状态）
 */
export function updateAchievementProgress(id: string, progress: number): void {
  const db = getDb()
  db.prepare(
    `INSERT INTO achievements (id, unlocked, unlocked_at, progress)
     VALUES (?, 0, NULL, ?)
     ON CONFLICT(id) DO UPDATE SET progress = excluded.progress`
  ).run(id, progress)
}

/**
 * 初始化成就列表（仅在首次启动时调用）
 * @param ids 成就 ID 数组（不传时使用内置默认列表）
 */
export function initAchievements(ids?: string[]): void {
  const db = getDb()
  const list = ids && ids.length > 0 ? ids : []
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO achievements (id, unlocked, unlocked_at, progress)
     VALUES (?, 0, NULL, 0)`
  )
  const insertMany = db.transaction((arr: string[]) => {
    for (const id of arr) {
      stmt.run(id)
    }
  })
  insertMany(list)
}

// ============================================================================
// 设置类（settings）
// ============================================================================

/**
 * 获取全部设置（反序列化为对象）
 */
export function getAllSettings(): Record<string, any> {
  const db = getDb()
  const stmt = db.prepare('SELECT key, value FROM settings')
  const rows = stmt.all() as any[]
  const result: Record<string, any> = {}
  for (const row of rows) {
    result[row.key] = deserializeSetting(row.value)
  }
  return result
}

/**
 * 获取单个设置
 */
export function getSetting(key: string): any {
  const db = getDb()
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?')
  const row = stmt.get(key) as any
  if (!row) {
    return undefined
  }
  return deserializeSetting(row.value)
}

/**
 * 写入设置（value 序列化为 JSON）
 */
export function setSetting(key: string, value: any): void {
  const db = getDb()
  const stmt = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  )
  stmt.run(key, JSON.stringify(value))
}

/**
 * 重置为默认设置（删除现有，写入默认值）
 */
export function resetSettings(): void {
  const db = getDb()
  const delStmt = db.prepare('DELETE FROM settings')
  const insStmt = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  )
  const resetTx = db.transaction(() => {
    delStmt.run()
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
      insStmt.run(k, JSON.stringify(v))
    }
  })
  resetTx()
}

/**
 * 清空所有游戏数据（记录 / 进度 / 成就），并重新初始化默认数据。
 * 用于"重置所有数据"功能。设置表由 resetSettings 单独处理。
 */
export function clearAllData(): void {
  const db = getDb()
  const tx = db.transaction(() => {
    db.exec('DELETE FROM game_records')
    db.exec('DELETE FROM level_progress')
    db.exec('DELETE FROM achievements')
  })
  tx()
  // 重新初始化默认数据
  initLevelProgress()
  initAchievements(ACHIEVEMENT_FALLBACK_IDS)
}

/** 成就 ID 列表（与 db/index.ts 的 ACHIEVEMENT_IDS 保持一致） */
const ACHIEVEMENT_FALLBACK_IDS: string[] = [
  'first_clear',
  'chapter1_clear',
  'chapter2_clear',
  'chapter3_clear',
  'chapter4_clear',
  'chapter5_clear',
  'chapter6_clear',
  'all_clear',
  'score_500',
  'score_1000',
  'score_2000',
  'combo_5',
  'combo_10',
  'no_prop_clear'
]

/**
 * 初始化默认设置（首次启动时调用）
 */
export function initDefaultSettings(): void {
  const db = getDb()
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`
  )
  const initTx = db.transaction(() => {
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
      stmt.run(k, JSON.stringify(v))
    }
  })
  initTx()
}

// ----------------------------------------------------------------------------
// 内部工具
// ----------------------------------------------------------------------------

/**
 * 反序列化设置值：尝试 JSON.parse，失败则返回原字符串
 */
function deserializeSetting(raw: any): any {
  if (raw == null) {
    return null
  }
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}
