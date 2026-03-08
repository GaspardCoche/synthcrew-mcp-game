/**
 * Trouve un port libre (3001, 3002, …) et lance le serveur avec PORT=port.
 * Usage: node server/tryPort.js  ou  npm run start:safe
 */
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PORT = Number(process.env.PORT) || 3001;
const MAX_ATTEMPTS = 10;

function isPortFree(port) {
  return new Promise((resolve) => {
    const s = createServer(() => {});
    s.once("error", () => resolve(false));
    s.once("listening", () => {
      s.close(() => resolve(true));
    });
    s.listen(port, "0.0.0.0");
  });
}

async function findFreePort() {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const p = DEFAULT_PORT + i;
    if (await isPortFree(p)) return p;
  }
  return null;
}

const port = await findFreePort();
if (!port) {
  console.error(`[SynthCrew] Aucun port libre entre ${DEFAULT_PORT} et ${DEFAULT_PORT + MAX_ATTEMPTS - 1}. Arrête les processus qui les utilisent.`);
  process.exit(1);
}

if (port !== DEFAULT_PORT) {
  console.log(`[SynthCrew] Port ${DEFAULT_PORT} occupé, utilisation du port ${port}.`);
}

const child = spawn("node", [join(__dirname, "index.js")], {
  stdio: "inherit",
  env: { ...process.env, PORT: String(port) },
  cwd: join(__dirname, ".."),
});
child.on("exit", (code) => process.exit(code ?? 0));
