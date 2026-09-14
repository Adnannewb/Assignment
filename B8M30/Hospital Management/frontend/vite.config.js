import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Fail loudly if 5173 is taken instead of quietly starting on 5174 —
    // a second dev server on another port means you end up looking at one
    // app while editing the other.
    strictPort: true,
  },
})
