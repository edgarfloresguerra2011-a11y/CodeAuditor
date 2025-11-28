import { type Server } from "node:http";

import express, { type Express, type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
}

// --- CODIGO AÑADIDO AUTOMATICAMENTE PARA RENDER ---
const _port = process.env.PORT || 5000;
try {
  if (typeof app !== 'undefined') {
    app.listen(_port, "0.0.0.0", () => {
      console.log("🚀 SERVIDOR INICIADO EN EL PUERTO " + _port);
      console.log("✅ CodeAuditor está VIVO y escuchando.");
    });
  } else {
    console.log("⚠️ Variable 'app' no encontrada, intentando mantener proceso vivo...");
    setInterval(() => console.log('Keep-alive...'), 60000);
  }
} catch (e) {
  console.error("Error al iniciar servidor:", e);
}

// --- CODIGO PARA MOSTRAR LA PAGINA WEB (FRONTEND) ---
import path from "path";
import { fileURLToPath } from "url";

// Configurar rutas para archivos
const __filename_fix = fileURLToPath(import.meta.url);
const __dirname_fix = path.dirname(__filename_fix);

// 1. Servir archivos estáticos (CSS, JS, Imágenes) desde dist/public
// Render guarda el build en ../dist/public relativo al servidor
if (typeof app !== 'undefined') {
    console.log("🌍 Configurando servicio de archivos estáticos...");
    app.use(express.static(path.join(__dirname_fix, "../dist/public")));
    app.use(express.static(path.join(__dirname_fix, "../client/dist")));

    // 2. Ruta 'comodín': Cualquier ruta que no sea API, devuelve el index.html
    // Esto es necesario para que React funcione al recargar
    app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) return next();
        
        const fs = require('fs');
        // Intentar ruta de Render
        const indexRender = path.join(__dirname_fix, "../dist/public/index.html");
        if (fs.existsSync(indexRender)) return res.sendFile(indexRender);

        // Intentar ruta local
        const indexLocal = path.join(__dirname_fix, "../client/dist/index.html");
        if (fs.existsSync(indexLocal)) return res.sendFile(indexLocal);
        
        next();
    });
}
// ----------------------------------------------------
