import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages deployment base URL will be configured later or automatically
  // base: '/manav.github.io/', // Uncomment if needed for project pages, but for user/org page it's usually '/'
})
