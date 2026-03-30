import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  base: 'https://dispatchapp-lime.vercel.app/',
  plugins: [
    react(),
    federation({
      name: 'dispatch_app',
      filename: 'remoteEntry.js',
      exposes: {
        './DispatchApp': './src/App.jsx',
      },
      shared: ['react', 'react-dom']
    })
  ],
  server: { port: 5003 },
  preview: { port: 5003 },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
})
