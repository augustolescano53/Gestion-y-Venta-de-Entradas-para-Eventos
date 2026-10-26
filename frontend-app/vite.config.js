import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Id de esta ejecución (cambia cada vez que se inicia `pnpm dev` o se
    // hace un build). Una sesión de otra ejecución se descarta
    // (shared/currentUser.js): cada ejecución arranca en la página principal.
    'import.meta.env.VITE_RUN_ID': JSON.stringify(Date.now().toString(36)),
  },
})
