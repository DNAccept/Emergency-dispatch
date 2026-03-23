import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host_app',
      remotes: {
        admin_app: 'http://localhost:5001/assets/remoteEntry.js',
        incident_app: 'http://localhost:5002/assets/remoteEntry.js',
        dispatch_app: 'http://localhost:5003/assets/remoteEntry.js',
        analytics_app: 'http://localhost:5004/assets/remoteEntry.js',
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
