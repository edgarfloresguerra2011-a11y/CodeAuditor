import express from 'express';
import { registerRoutes } from './routes';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

console.log('>>> INICIANDO AUTO-MIGRACION DB...');
try {
    execSync('npx drizzle-kit push', { stdio: 'inherit' });
    console.log('>>> DB OK.');
} catch (e) {
    console.error('>>> ERROR DB (Pero continuamos):', e.message);
}

(async () => {
    const server = await registerRoutes(app);

    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || 'Internal Server Error';
      res.status(status).json({ message });
      console.error(err);
    });

    const __filename_fix = fileURLToPath(import.meta.url);
    const __dirname_fix = path.dirname(__filename_fix);
    app.use(express.static(path.join(__dirname_fix, '../dist/public')));
    app.use(express.static(path.join(__dirname_fix, '../client/dist')));

    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        const fs = require('fs');
        const paths = [
            path.join(__dirname_fix, '../dist/public/index.html'),
            path.join(__dirname_fix, '../client/dist/index.html')
        ];
        for (const p of paths) { if (fs.existsSync(p)) return res.sendFile(p); }
        next();
    });

    const port = process.env.PORT || 5000;
    server.listen(port, '0.0.0.0', () => {
      console.log('SERVER ON ' + port);
    });
})();
