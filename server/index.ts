import express from 'express';
import { registerRoutes } from './routes';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- ZONA DE MIGRACIÓN AGRESIVA ---
console.log('=============================================');
console.log('🛠️ INICIANDO CONFIGURACIÓN DE BASE DE DATOS');
console.log('=============================================');

try {
    // Instalamos drizzle-kit localmente por si acaso (fail-safe)
    // execSync('npm install drizzle-kit', { stdio: 'inherit' }); 
    
    console.log('🔄 Ejecutando: npx drizzle-kit push');
    execSync('npx drizzle-kit push', { stdio: 'inherit' });
    console.log('✅ TABLAS CREADAS EXITOSAMENTE.');
} catch (error) {
    console.error('❌ ERROR FATAL AL CREAR TABLAS:');
    console.error(error);
    console.log('⚠️ ADVERTENCIA: La aplicación podría fallar si las tablas no existen.');
}
console.log('=============================================');

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
        for (const p of paths) {
            if (fs.existsSync(p)) return res.sendFile(p);
        }
        next();
    });

    const port = process.env.PORT || 5000;
    server.listen(port, '0.0.0.0', () => {
      console.log('🚀 SERVIDOR CORRIENDO EN PUERTO ' + port);
    });
})();
