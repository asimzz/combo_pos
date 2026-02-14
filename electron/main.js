const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let nextProcess;

function startNextServer() {
  // In packaged app, resources live in: process.resourcesPath/app
  const serverPath = path.join(
    process.resourcesPath,
    "app",
    ".next",
    "standalone",
    "server.js",
  );

  nextProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: "3000",
    },
    stdio: "inherit",
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
  });

  await win.loadURL("http://127.0.0.1:3000");
}

app.whenReady().then(() => {
  startNextServer();
  createWindow();
});

app.on("before-quit", () => {
  if (nextProcess) nextProcess.kill();
});

app.on("window-all-closed", () => app.quit());
