// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills' // 1. Import the plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({ // 2. Add the plugin
      // To add only specific polyfills, add them here.
      // If no option is passed, adds all polyfills
      globals: {
        Buffer: true, // Provide a global Buffer
        process: true, // Provide a global process
      },
      protocolImports: true, // Add support for `node:` protocol imports
    }),
  ],
})