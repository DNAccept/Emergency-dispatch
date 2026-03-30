import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host_app',
      remotes: {
        admin_app: 'https://emergency-admin-app.vercel.app/assets/remoteEntry.js',
        incident_app: 'https://emergency-dispatch-chi.vercel.app/assets/remoteEntry.js',
        dispatch_app: 'https://dispatchapp-lime.vercel.app/assets/remoteEntry.js',
        analytics_app: 'https://analytics-app-ecru.vercel.app/assets/remoteEntry.js',
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
