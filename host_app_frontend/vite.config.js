import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host_app',
      remotes: {
        admin_app: 'https://emergency-admin-app.vercel.app/remoteEntry.js',
        incident_app: 'https://emergency-dispatch-chi.vercel.app/remoteEntry.js',
        dispatch_app: 'https://dispatch-nqtn3o8x2-davidnanno720-7211s-projects.vercel.app/remoteEntry.js',
        analytics_app: 'https://analytics-mnhz9ct01-davidnanno720-7211s-projects.vercel.app/remoteEntry.js',
      },
      shared: ['react', 'react-dom']
    })
  ],
  server: { port: 5000 },
  preview: { port: 5000 },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
})
