import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'

let icon192Url = '/logo192.png'
let icon512Url = '/logo512.png'

export default defineConfig({
    // depending on your application, base can also be "/"
    // base: '/',
    plugins: [
      react(),
      viteTsconfigPaths(),
      VitePWA({
        registerType: 'prompt', // We want to prompt the user to reload, we don't want it to autoupdate
        injectRegister: null, // We register it ourselves in index.tsx
        devOptions: {
          // Set to true if you want to have the PWA code enabled when running
          // npm run start (dev. mode)
          enabled: false
        },
        includeAssets: [
          icon192Url,
          icon512Url,
        ],
        manifest: {
          name: 'NinjaTerm',
          description: 'The serial port terminal that\'s got your back.',
          start_url: './app',
          theme_color: '#DC3545',
          icons: [
            {
              src: icon192Url,
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: icon512Url,
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: icon512Url,
              sizes: '512x512',
              type: 'image/png',
            }
          ]
        },
      })
    ],
    server: {
        // this ensures that the browser opens upon server start
        open: true,
        // this sets a default port to 3000
        port: 3000,
    },
    resolve: {
      alias: {
        src: "/src",
      },
    },
    optimizeDeps: {
      include: ['@mui/material/Tooltip', '@emotion/styled', '@mui/material/Unstable_Grid2'],
    },
})

