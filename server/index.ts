import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes"; // <--- ESTO ES EL CEREBRO
import { setupVite, serveStatic, createViteServer } from "./vite";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware de log básico
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// --- 1. REGISTRAR RUTAS DE LA API (AUDITORÍA, PROYECTOS, ETC) ---
// Esto conecta tu base de datos y la lógica
const server = registerRoutes(app);

// Manejador de errores global
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
});

// --- 2. SERVIR FRONTEND EN PRODUCCIÓN ---
const __filename_fix = fileURLToPath(import.meta.url);
const __dirname_fix = path.dirname(__filename_fix);

// Servir archivos estáticos generados
app.use(express.static(path.join(__dirname_fix, "../dist/public")));
app.use(express.static(path.join(__dirname_fix, "../client/dist")));

// Ruta comodín: Si no es API, devuelve el HTML del frontend
app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    
    const fs = require('fs');
    // Intentar rutas posibles de Render
    const paths = [
        path.join(__dirname_fix, "../dist/public/index.html"),
        path.join(__dirname_fix, "../client/dist/index.html"),
        path.join(__dirname_fix, "../dist/index.html")
    ];
    
    for (const p of paths) {
        if (fs.existsSync(p)) {
            return res.sendFile(p);
        }
    }
    next();
});

// --- 3. ARRANQUE DEL SERVIDOR ---
const port = process.env.PORT || 5000;
server.listen(port, "0.0.0.0", () => {
  console.log(\🚀 SERVIDOR COMPLETO (API + WEB) ESCUCHANDO EN EL PUERTO \\);
});

