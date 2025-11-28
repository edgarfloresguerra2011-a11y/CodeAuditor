import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, createViteServer } from "./vite";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 1. REGISTRAR RUTAS DE LA API
const server = registerRoutes(app);

// Manejador de errores
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
});

// 2. SERVIR FRONTEND
const __filename_fix = fileURLToPath(import.meta.url);
const __dirname_fix = path.dirname(__filename_fix);

app.use(express.static(path.join(__dirname_fix, "../dist/public")));
app.use(express.static(path.join(__dirname_fix, "../client/dist")));

app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    
    const fs = require("fs");
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

// 3. ARRANQUE DEL SERVIDOR (Sintaxis segura sin emojis rotos)
const port = process.env.PORT || 5000;
server.listen(port, "0.0.0.0", () => {
  console.log("SERVER STARTED ON PORT " + port);
  console.log("CodeAuditor is running...");
});
