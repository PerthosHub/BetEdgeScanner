import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx, defineManifest } from '@crxjs/vite-plugin'
// @ts-ignore - Vite handelt de import van TS bestanden af tijdens build
import { VERSION_INFO } from './src/version' 

const manifest = defineManifest({
  manifest_version: 3,
  name: 'BetEdge Scanner',
  version: VERSION_INFO.version, 
  description: 'Automatische odds scanner voor BetEdge Pro',
  permissions: ['activeTab', 'storage', 'scripting'],
  action: {
    default_popup: 'index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: [
        'https://*.unibet.nl/*', 
        'https://*.toto.nl/*',
        'https://*.circus.nl/*',
        'https://*.tonybet.nl/*'
      ], 
      js: ['src/content/index.ts'],
      run_at: 'document_idle' 
    },
  ],
})

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
    cors: true, 
    headers: {
      "Access-Control-Allow-Origin": "*",
    }
  },
})