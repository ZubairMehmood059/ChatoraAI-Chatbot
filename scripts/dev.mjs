import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import "dotenv/config";

const root = process.cwd();
const backendPort = process.env.FASTAPI_PORT || "8000";
const vitePort = process.env.VITE_PORT || "5173";
const localApiUrl = `http://127.0.0.1:${backendPort}`;
const apiUrl = process.env.FASTAPI_URL || localApiUrl;
const localPython =
  process.platform === "win32"
    ? resolve(root, ".venv", "Scripts", "python.exe")
    : resolve(root, ".venv", "bin", "python");
const python =
  process.env.PYTHON ||
  (existsSync(localPython)
    ? localPython
    : process.platform === "win32"
      ? "python"
      : "python3");
const localDbPath = resolve(root, "instance", "chatora-local.db").replace(
  /\\/g,
  "/",
);
const processes = [];
let stopping = false;

function start(command, args, label, env = process.env) {
  const child = spawn(command, args, {
    cwd: root,
    env,
    stdio: "inherit",
    windowsHide: true,
  });
  child.on("error", (error) => {
    console.error(`[${label}] Could not start: ${error.message}`);
    stop(1);
  });
  child.on("exit", (code, signal) => {
    if (!stopping) {
      console.error(
        `[${label}] exited${signal ? ` (${signal})` : ` with code ${code}`}`,
      );
      stop(code || 1);
    }
  });
  processes.push(child);
  return child;
}

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of processes) {
    if (child.exitCode === null && !child.killed) child.kill();
  }
  process.exitCode = exitCode;
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

const configuredApi = process.env.FASTAPI_URL || process.env.VITE_API_URL;
const usesExternalApi =
  configuredApi &&
  !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(configuredApi);

if (usesExternalApi) {
  console.log(`[dev] Using configured API origin: ${configuredApi}`);
} else {
  const backendEnv = {
    ...process.env,
    ENVIRONMENT: process.env.ENVIRONMENT || "development",
    PORT: backendPort,
    DATABASE_URL:
      process.env.FASTAPI_DATABASE_URL ||
      process.env.DATABASE_URL ||
      `sqlite+aiosqlite:///${localDbPath}`,
  };
  mkdirSync(resolve(root, "instance"), { recursive: true });
  console.log(`[dev] Starting FastAPI on ${localApiUrl}`);
  console.log(
    `[dev] Local conversation database: ${backendEnv.DATABASE_URL.startsWith("sqlite") ? "instance/chatora-local.db" : "configured database"}`,
  );
  start(
    python,
    [
      "-m",
      "uvicorn",
      "backend.app.main:app",
      "--host",
      "127.0.0.1",
      "--port",
      backendPort,
    ],
    "FastAPI",
    backendEnv,
  );
}

const viteEnv = {
  ...process.env,
  FASTAPI_URL: usesExternalApi ? configuredApi : localApiUrl,
};
console.log(`[dev] Starting Vite on http://localhost:${vitePort}`);
start(
  process.execPath,
  [
    resolve(root, "node_modules", "vite", "bin", "vite.js"),
    "--host",
    "0.0.0.0",
    "--port",
    vitePort,
  ],
  "Vite",
  viteEnv,
);
