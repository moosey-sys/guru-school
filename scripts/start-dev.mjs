import { spawn } from "node:child_process";
const api = spawn(
  process.execPath,
  ["--env-file=.env", "--env-file=.env.local", "scripts/dev-server.js"],
  { stdio: "inherit", env: { ...process.env, PORT: "5175", API_ONLY: "1" } },
);
const web = spawn("npm", ["run", "dev:web"], { stdio: "inherit" });
const stop = () => {
  api.kill();
  web.kill();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const child of [api, web])
  child.on("exit", (code) => {
    stop();
    process.exitCode = code || 0;
  });
