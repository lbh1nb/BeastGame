import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import initSqlJs, { SqlJsStatic, Database as SqlJsDatabase, Statement } from 'sql.js'
import {
  initLevelProgress,
  initAchievements,
  initDefaultSettings
} from './repository'

// 数据库实例
let sqlJs: SqlJsStatic | null = null
let db: SqlJsDatabase | null = null
let dbPath: string = ''

// 默认成就 ID 列表
export const ACHIEVEMENT_IDS: string[] = [
  'first_clear', 'chapter1_clear', 'chapter2_clear', 'chapter3_clear',
  'chapter4_clear', 'chapter5_clear', 'chapter6_clear', 'all_clear',
  'score_500', 'score_1000', 'score_2000', 'combo_5', 'combo_10', 'no_prop_clear'
]

/**
 * 将 SQL 中 @param 命名参数转为 ? 占位符，并返回参数值数组
 * 例如: "SELECT * FROM t WHERE a = @x AND b = @y" → ["SELECT * FROM t WHERE a = ? AND b = ?", ["x", "y"]]
 */
function parseNamedParams(sql: string): { sql: string; paramNames: string[] } {
  const paramNames: string[] = []
  const newSql = sql.replace(/@(\w+)/g, (_match, name) => {
    paramNames.push(name)
    return '?'
  })
  return { sql: newSql, paramNames }
}

/**
 * 将命名参数对象转为位置参数数组
 */
function toPositionalParams(params: Record<string, any>, paramNames: string[]): any[] {
  return paramNames.map((name) => {
    const val = params[name]
    return val === undefined ? null : val
  })
}

/**
 * sql.js 数据库包装器，提供命名参数和事务支持
 */
class DbWrapper {
  private db: SqlJsDatabase

  constructor(db: SqlJsDatabase) {
    this.db = db
  }

  prepare(sql: string): StmtWrapper {
    const { sql: newSql, paramNames } = parseNamedParams(sql)
    return new StmtWrapper(this.db, newSql, paramNames)
  }

  exec(sql: string): void {
    this.db.run(sql)
  }

  transaction<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => ReturnType<T> {
    return (...args: Parameters<T>): ReturnType<T> => {
      this.db.run('BEGIN')
      try {
        const result = fn(...args)
        this.db.run('COMMIT')
        return result
      } catch (e) {
        this.db.run('ROLLBACK')
        throw e
      }
    }
  }

  /** 保存到文件 */
  saveToFile(): void {
    const data = this.db.export()
    const buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength)
    const tmpPath = dbPath + '.tmp'
    try {
      // 先写临时文件
      fs.writeFileSync(tmpPath, buffer)
      // 删除目标文件后重命名
      if (fs.existsSync(dbPath)) {
        try { fs.unlinkSync(dbPath) } catch { /* ignore */ }
      }
      fs.renameSync(tmpPath, dbPath)
    } catch (e: any) {
      console.error('[DB] 保存数据库失败:', e.message || e)
    }
  }

  getRawDb(): SqlJsDatabase {
    return this.db
  }
}

/**
 * 预编译语句包装器
 */
class StmtWrapper {
  private db: SqlJsDatabase
  private sql: string
  private paramNames: string[]

  constructor(db: SqlJsDatabase, sql: string, paramNames: string[]) {
    this.db = db
    this.sql = sql
    this.paramNames = paramNames
  }

  private bindParams(params: Record<string, any> | any[]): any[] {
    if (Array.isArray(params)) {
      return params
    }
    return toPositionalParams(params, this.paramNames)
  }

  run(...args: any[]): { lastInsertRowid: number; changes: number } {
    // 支持两种调用方式：
    // 1. stmt.run(obj) - 命名参数对象
    // 2. stmt.run(val1, val2, ...) - 位置参数
    let params: any[]
    if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
      params = this.bindParams(args[0])
    } else {
      params = args
    }
    this.db.run(this.sql, params)
    const result = this.db.exec('SELECT last_insert_rowid() as id')
    const lastInsertRowid = result.length > 0 && result[0].values.length > 0
      ? Number(result[0].values[0][0])
      : 0
    return { lastInsertRowid, changes: 0 }
  }

  get(...args: any[]): any | null {
    let params: any[]
    if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
      params = this.bindParams(args[0])
    } else {
      params = args
    }
    const stmt = this.db.prepare(this.sql)
    try {
      stmt.bind(params)
      if (stmt.step()) {
        return stmt.getAsObject()
      }
      return null
    } finally {
      stmt.free()
    }
  }

  all(...args: any[]): any[] {
    let params: any[]
    if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
      params = this.bindParams(args[0])
    } else {
      params = args
    }
    const stmt = this.db.prepare(this.sql)
    try {
      stmt.bind(params)
      const rows: any[] = []
      while (stmt.step()) {
        rows.push(stmt.getAsObject())
      }
      return rows
    } finally {
      stmt.free()
    }
  }
}

/** 数据库包装器实例 */
let dbWrapper: DbWrapper | null = null

/**
 * 初始化数据库（异步）
 */
export async function initDB(): Promise<void> {
  if (dbWrapper) return

  try {
    // 初始化 sql.js
    const isPackaged = app.isPackaged
    if (isPackaged) {
      // 打包环境：指定 WASM 文件路径
      const wasmPath = path.join(process.resourcesPath, 'native', 'sql-wasm.wasm')
      sqlJs = await initSqlJs({ locateFile: () => wasmPath })
    } else {
      sqlJs = await initSqlJs()
    }

    const userDataPath = app.getPath('userData')
    // 开发模式下优先使用项目目录，避免权限问题
    let dataDir = userDataPath
    if (!app.isPackaged) {
      // 开发模式：使用项目根目录下的 data 文件夹
      const projectDir = app.getAppPath()
      const devDataDir = path.join(projectDir, 'data')
      if (!fs.existsSync(devDataDir)) {
        try {
          fs.mkdirSync(devDataDir, { recursive: true })
          dataDir = devDataDir
        } catch {
          // 如果项目目录也无法创建，回退到 userData
        }
      } else {
        dataDir = devDataDir
      }
    }
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    dbPath = path.join(dataDir, 'data.db')
    const isNewDb = !fs.existsSync(dbPath)

    // 加载或创建数据库
    if (isNewDb) {
      db = new sqlJs.Database()
    } else {
      const fileBuffer = fs.readFileSync(dbPath)
      db = new sqlJs.Database(fileBuffer)
    }

    dbWrapper = new DbWrapper(db)

    // 启用外键约束
    db.run('PRAGMA foreign_keys = ON')

    if (isNewDb) {
      // 建表
      dbWrapper.exec(`
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

      initDefaultSettings()
      initLevelProgress()
      initAchievements(ACHIEVEMENT_IDS)

      // 保存初始数据库
      dbWrapper.saveToFile()
    }

    console.log('[DB] 数据库初始化成功:', dbPath)
  } catch (error) {
    console.error('[DB] 数据库初始化失败:', error)
    dbWrapper = null
    db = null
  }
}

/**
 * 获取数据库包装器实例
 */
export function getDb(): DbWrapper {
  if (!dbWrapper) {
    throw new Error('数据库尚未初始化，请先调用 initDB()')
  }
  return dbWrapper
}

/**
 * 保存数据库到文件（在每次写操作后调用）
 */
export function saveDb(): void {
  if (dbWrapper) {
    dbWrapper.saveToFile()
  }
}

/**
 * 关闭数据库
 */
export function closeDB(): void {
  if (db) {
    db.close()
    db = null
    dbWrapper = null
  }
}