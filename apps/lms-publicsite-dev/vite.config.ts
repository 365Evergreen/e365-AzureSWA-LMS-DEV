import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiHost =
    (env.VITE_API_BASE_URL ?? '').replace(/\/api\/?$/, '') ||
    'https://lms-func-365ev-dev.azurewebsites.net'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@lms/shared-ui': path.resolve(__dirname, '../../shared/ui'),
        '@lms/shared-schemas': path.resolve(__dirname, '../../shared/schemas/src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiHost,
          changeOrigin: true,
        },
      },
    },
  }
})
