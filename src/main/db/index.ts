import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'
import {
  initLevelProgress,
  initAchievements,
  initDefaultSettings
} from './repository'

// 数据库实例（单例）
let db: Database.Database | null = null

// 默认成就 ID 列表（写死，与 repository.initAchievements 保持一致）
export const ACHIEVEMENT_IDS: string[] = [
  // 闯关类
  'first_clear',
  'chapter1_clear',
  'chapter2_clear',
  'chapter3_clear',
  'chapter4_clear',
  'chapter5_clear',
  'chapter6_clear',
  'all_clear',
  // 分数 / 连击 / 道具类
  'score_500',
  'score_1000',
  'score_2000',
  'combo_5',
  'combo_10',
  'no_prop_clear'
]

/**
 * 初始化数据库：
 * 1. 在 userData 目录下创建 data.db
 * 2. 打包后使用 process.resourcesPath/native/better_sqlite3.node 作为 nativeBinding
 * 3. 启用 WAL 模式与外键
 * 4. 首次启动时执行 schema.sql 建表
 * 5. 首次启动写入默认设置 / 30 关进度 / 成就列表
 */
export function initDB(): void {
  if (db) {
    return
  }

  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'data.db')
  const isNewDb = !fs.existsSync(dbPath)

  // 打包环境下指定 native 模块路径；开发环境不传，让 better-sqlite3 走默认查找逻辑
  const isPackaged = app.isPackaged
  const options: Database.Options = {}
  if (isPackaged) {
    const nativePath = path.join(process.resourcesPath, 'native', 'better_sqlite3.node')
    options.nativeBinding = nativePath
  }

  db = new Database(dbPath, options)

  // 启用 WAL 模式和外键约束
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // 首次启动：执行 schema 并写入初始数据
  if (isNewDb) {
    const schemaPath = path.join(__dirname, 'schema.sql')
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8')
      db.exec(sql)
    } else {
      // 兜底：schema.sql 找不到时直接内联执行（避免打包遗漏导致建表失败）
      db.exec(`
        CREATE TABLE IF NOT EXISTS game_records (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          mode        TEXT    NOT NULL,
          level_id    INTEGER,
          score       INTEGER NOT NULL DEFAULT 0,
          duration    INTEGER NOT NULL DEFAULT 0,
          max_combo   INTEGER NOT NULL DEFAULT 0,
          props_used  TEXT    NOT NULL DEFAULT '[]',
          result      TEXT    NOT NULL,
          created_at  INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS level_progress (
          level_id       INTEGER PRIMARY KEY,
          status         TEXT    NOT NULL DEFAULT 'locked',
          stars          INTEGER NOT NULL DEFAULT 0,
          best_score     INTEGER NOT NULL DEFAULT 0,
          best_duration  INTEGER NOT NULL DEFAULT 0,
          updated_at     INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS achievements (
          id           TEXT    PRIMARY KEY,
          unlocked     INTEGER NOT NULL DEFAULT 0,
          unlocked_at  INTEGER,
          progress     INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS settings (
          key    TEXT PRIMARY KEY,
          value  TEXT
        );
      `)
    }

    // 写入默认数据
    initDefaultSettings()
    initLevelProgress()
    initAchievements(ACHIEVEMENT_IDS)
  }
}

/**
 * 获取数据库实例（调用前必须先 initDB）
 */
export function getDb(): Database.Database {
  if (!db) {
    throw new Error('数据库尚未初始化，请先调用 initDB()')
  }
  return db
}

/**
 * 关闭数据库（应用退出时调用）
 */
export function closeDB(): void {
  if (db) {
    db.close()
    db = null
  }
}
