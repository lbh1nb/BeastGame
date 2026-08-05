/**
 * 资源 URL 辅助函数
 * - 主进程注册了自定义协议 `assets`，将 `assets://<subpath>` 映射到 resources 目录下的文件（process.resourcesPath 或项目根/resources）
 * - 相比 `file://`，自定义协议在 Electron 渲染进程默认安全策略下可被 `fetch` / `<video>` / `<audio>` 正常访问，
 *   避免 `fetch('file://')` 被 CORS 拦截导致图片慢速回退、视频加载失败的问题
 */

/** 自定义协议名 */
export const ASSET_PROTOCOL = 'assets'

/** 拼接资源协议 URL */
export function assetUrl(subpath: string): string {
  return `${ASSET_PROTOCOL}://${subpath.replace(/\\/g, '/')}`
}