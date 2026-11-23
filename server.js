import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

const blockedPaths = new Set([
  '/server.js',
  '/package.json',
  '/package-lock.json',
  '/metadata.json',
  '/vercel.json',
  '/CNAME',
  '/README.md',
  '/SECURITY.md',
]);

app.use((req, res, next) => {
  const cleanPath = req.path.replace(/\/+$/, '') || '/';
  if (
    req.path.split('/').some((segment) => segment.startsWith('.')) ||
    req.path.startsWith('/node_modules') ||
    blockedPaths.has(cleanPath)
  ) {
    return res.status(404).send('Not found');
  }
  next();
});

app.get('/postavka-site.zip', (req, res) => {
  res.download(path.join(__dirname, 'postavka-site.zip'), 'postavka-site.zip');
});

app.use(
  express.static(__dirname, {
    extensions: ['html'],
    dotfiles: 'deny',
    setHeaders(res, filePath) {
      if (/\.(html|js|css)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'no-store, must-revalidate');
      }
    },
  })
);

app.listen(PORT, HOST, () => {
  console.log(`Postavka static server running at http://${HOST}:${PORT}`);
});
