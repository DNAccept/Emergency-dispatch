import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'analytics_app',
      filename: 'remoteEntry.js',
      exposes: {
        './AnalyticsApp': './src/App.jsx',
      },
      shared: ['react', 'react-dom']
    })
  ],
  server: { port: 5004 },
  preview: { port: 5004 },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
})
