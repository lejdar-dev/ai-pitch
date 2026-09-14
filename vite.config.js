import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const slidesDir = path.resolve(import.meta.dirname, 'slides')
const virtualId = 'virtual:slides'

// Exposes the sorted list of slides/*.html as `virtual:slides` and copies
// the slides folder (without its .git) into the build output.
function slides() {
  let outDir
  return {
    name: 'slides',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    resolveId(id) {
      if (id === virtualId) return '\0' + virtualId
    },
    load(id) {
      if (id !== '\0' + virtualId) return
      const files = fs.readdirSync(slidesDir).filter((f) => f.endsWith('.html')).sort()
      return `export default ${JSON.stringify(files)}`
    },
    configureServer(server) {
      // Serve slide HTML as-is, bypassing Vite's HTML transform (HMR client injection).
      server.middlewares.use('/slides', (req, res, next) => {
        const file = path.join(slidesDir, decodeURIComponent(req.url.split('?')[0]))
        if (!file.startsWith(slidesDir + path.sep) || !file.endsWith('.html') || !fs.existsSync(file)) return next()
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        fs.createReadStream(file).pipe(res)
      })
      server.watcher.add(slidesDir)
      const reload = (file) => {
        if (path.dirname(file) !== slidesDir || !file.endsWith('.html')) return
        const mod = server.moduleGraph.getModuleById('\0' + virtualId)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', reload)
      server.watcher.on('unlink', reload)
    },
    closeBundle() {
      fs.cpSync(slidesDir, path.join(outDir, 'slides'), {
        recursive: true,
        filter: (src) => path.basename(src) !== '.git',
      })
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), slides()],
})
