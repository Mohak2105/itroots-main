const { spawn } = require("child_process");

const nextBin = require.resolve("next/dist/bin/next");
const port = process.env.PORT || "3000";
const hostname = process.env.HOSTNAME || "0.0.0.0";

const child = spawn(process.execPath, [nextBin, "start", "-p", port, "-H", hostname], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

