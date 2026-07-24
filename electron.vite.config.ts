import { resolve } from 'path'
import { realpathSync } from 'fs'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

// 解析真实路径，避免 symlink node_modules 导致 vite HTML 插件路径异常
const projectRoot = realpathSync(__dirname)

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(projectRoot, 'src/main/index.ts')
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(projectRoot, 'src/preload/index.ts')
        }
      }
    }
  },
  renderer: {
    root: resolve(projectRoot, 'src/renderer'),
    resolve: {
      alias: {
        '@renderer': resolve(projectRoot, 'src/renderer/src'),
        '@game': resolve(projectRoot, 'src/game'),
        '@components': resolve(projectRoot, 'src/renderer/src/components'),
        '@views': resolve(projectRoot, 'src/renderer/src/views'),
        '@stores': resolve(projectRoot, 'src/renderer/src/stores'),
        '@utils': resolve(projectRoot, 'src/renderer/src/utils'),
        '@audio': resolve(projectRoot, 'src/renderer/src/audio'),
        '@assets': resolve(projectRoot, 'src/renderer/src/assets')
      }
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(projectRoot, 'src/renderer/index.html')
        }
      }
    },
    plugins: [vue()]
  }
})
