import { spawn } from "node:child_process";

const command = process.platform === "win32" ? "cmd.exe" : "next";
const args = process.platform === "win32" ? ["/d", "/s", "/c", "next build"] : ["build"];
const child = spawn(command, args, {
  env: {
    ...process.env,
    ANALYZE: "true"
  },
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
