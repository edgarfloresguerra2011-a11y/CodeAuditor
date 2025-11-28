import express from 'express';
import { registerRoutes } from './routes';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ENVOLVEMOS TODO EN UNA FUNCION ASINCRONA PARA PODER USAR 'AWAIT'
(async () => {

  // 1. REGISTRAR RUTAS (ESPERANDO A QUE TERMINE)
  // Aquí estaba el error: faltaba el 'await'
  const server = await registerRoutes(app);

  // 2. ERROR HANDLER
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ message });
    console.error(err);
  });

  // 3. FRONTEND STATIC FILES
  const __filename_fix = fileURLToPath(import.meta.url);
  const __dirname_fix = path.dirname(__filename_fix);

  app.use(express.static(path.join(__dirname_fix, '../dist/public')));
  app.use(express.static(path.join(__dirname_fix, '../client/dist')));

  app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      
      const fs = require('fs');
      const paths = [
          path.join(__dirname_fix, '../dist/public/index.html'),
          path.join(__dirname_fix, '../client/dist/index.html'),
          path.join(__dirname_fix, '../dist/index.html')
      ];
      
      for (const p of paths) {
          if (fs.existsSync(p)) {
              return res.sendFile(p);
          }
      }
      next();
  });

  // 4. SERVER START
  const port = process.env.PORT || 5000;
  server.listen(port, '0.0.0.0', () => {
    console.log('SERVER RUNNING ON PORT ' + port);
  });

})();
