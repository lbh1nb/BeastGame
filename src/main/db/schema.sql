-- 兽了个兽 - 数据库建表脚本
-- 包含 4 张表：单局记录 / 闯关进度 / 成就 / KV 设置

-- 单局游戏记录
CREATE TABLE IF NOT EXISTS game_records (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  mode        TEXT    NOT NULL,             -- 'classic3' | 'classic4' | 'level'
  level_id    INTEGER,                       -- 闯关模式时记录关卡ID，街机模式为 NULL
  score       INTEGER NOT NULL DEFAULT 0,    -- 本局得分
  duration    INTEGER NOT NULL DEFAULT 0,    -- 本局用时（秒）
  max_combo   INTEGER NOT NULL DEFAULT 0,    -- 最高连击数
  props_used  TEXT    NOT NULL DEFAULT '[]', -- 道具使用记录（JSON 字符串）
  result      TEXT    NOT NULL,              -- 'win' | 'lose'
  created_at  INTEGER NOT NULL               -- 创建时间戳（秒）
);

-- 闯关进度
CREATE TABLE IF NOT EXISTS level_progress (
  level_id       INTEGER PRIMARY KEY,
  status         TEXT    NOT NULL DEFAULT 'locked', -- 'locked' | 'unlocked' | 'done'
  stars          INTEGER NOT NULL DEFAULT 0,        -- 0-3 星
  best_score     INTEGER NOT NULL DEFAULT 0,
  best_duration  INTEGER NOT NULL DEFAULT 0,
  updated_at     INTEGER NOT NULL
);

-- 成就
CREATE TABLE IF NOT EXISTS achievements (
  id           TEXT    PRIMARY KEY,
  unlocked     INTEGER NOT NULL DEFAULT 0,  -- 0 未解锁 / 1 已解锁
  unlocked_at  INTEGER,                     -- 解锁时间戳
  progress     INTEGER NOT NULL DEFAULT 0   -- 累计进度
);

-- KV 设置
CREATE TABLE IF NOT EXISTS settings (
  key    TEXT PRIMARY KEY,
  value  TEXT
);
