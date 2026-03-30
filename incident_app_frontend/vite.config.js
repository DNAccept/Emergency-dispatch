import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    federation({
      name: 'incident_app',
      filename: 'remoteEntry.js',
      exposes: {
        './IncidentApp': './src/App.jsx',
      },
      shared: ['react', 'react-dom']
    })
  ],
  server: { port: 5002 },
  preview: { port: 5002 },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
})
