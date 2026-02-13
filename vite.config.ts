import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

export default defineConfig(({ mode }) => ({
  root: 'src',
  build: {
    outDir: '..',
  },
  base: mode === 'development' ? '' : '/pahjs/',
  plugins: [
    {
      name: 'serve-tiles-directory',
      configureServer(server) {
        const tilesPath = path.resolve(__dirname, 'tiles');

        server.middlewares.use('/tiles', (req, res, next) => {
          const filePath = path.join(tilesPath, req.url!);
          const stream = fs.createReadStream(filePath);
          stream.on('error', () => next());
          res.statusCode = 200;
          res.setHeader('Content-Type', 'image/svg+xml');
          stream.pipe(res);
        });
      },
    },
  ],
}));
