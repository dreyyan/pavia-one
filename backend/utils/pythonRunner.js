// [IMPORT] Node.js child process for spawning Python scripts
const { spawn } = require("child_process");

// [IMPORT] Path
const path = require("path");

// [SETUP] Python project root (IMPORTANT)
const PYTHON_ROOT = path.join(__dirname, "../services/python");

// [SETUP] Shared environment
const baseEnv = {
  ...process.env,
  PYTHONPATH: PYTHON_ROOT,
};

// ================================
// 🔥 DEBUG LOGGER (GLOBAL)
// ================================
const DEBUG_PY = true;

function logPY(...args) {
  if (!DEBUG_PY) return;
  console.log("[PY DEBUG]", ...args);
}

function logPYError(...args) {
  if (!DEBUG_PY) return;
  console.error("[PY ERROR]", ...args);
}

// ================================
// [CONFIG]
// ================================
const PY_TIMEOUT_MS = 60000; // 60s safety timeout

// ================================
// [HELPER] Run Python with JSON
// ================================
function runPythonWithJSON(pythonExe, scriptPath, jsonData) {
  return new Promise((resolve, reject) => {
    logPY("========== PYTHON START ==========");
    logPY("Script:", scriptPath);
    logPY("CWD:", PYTHON_ROOT);
    logPY("Payload size:", JSON.stringify(jsonData).length);

    const py = spawn(pythonExe, [scriptPath], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: PYTHON_ROOT,
      env: baseEnv,
    });

    let stdout = "";
    let stderr = "";

    // =========================
    // TIMEOUT SAFETY
    // =========================
    const timeout = setTimeout(() => {
      logPYError("Python timeout reached. Killing process.");
      py.kill("SIGKILL");

      const err = new Error("Python process timeout");
      err.stdout = stdout;
      err.stderr = stderr;
      reject(err);
    }, PY_TIMEOUT_MS);

    // =========================
    // STDOUT STREAM
    // =========================
    py.stdout.on("data", (d) => {
      stdout += d.toString("utf-8");
    });

    // =========================
    // STDERR STREAM
    // =========================
    py.stderr.on("data", (d) => {
      stderr += d.toString("utf-8");
    });

    // =========================
    // PROCESS ERROR (FAILED TO START)
    // =========================
    py.on("error", (err) => {
      clearTimeout(timeout);
      logPYError("FAILED TO START PYTHON PROCESS:", err);
      reject(err);
    });

    // =========================
    // PROCESS EXIT
    // =========================
    py.on("close", (code) => {
      clearTimeout(timeout);

      logPY("========== PYTHON END ==========");
      logPY("Exit code:", code);

      if (code !== 0) {
        const err = new Error("Python process failed");
        err.code = code;
        err.stdout = stdout;
        err.stderr = stderr;

        logPYError("Python execution failed:", stderr);
        return reject(err);
      }

      resolve({
        stdout,
        stderr,
      });
    });

    // =========================
    // SEND INPUT
    // =========================
    try {
      const payloadStr = JSON.stringify(jsonData);

      py.stdin.write(payloadStr);
      py.stdin.end();
    } catch (err) {
      clearTimeout(timeout);
      logPYError("Failed to write stdin:", err);
      reject(err);
    }
  });
}

// ================================
// [HELPER] Run Python with file
// ================================
function runPythonWithFile(pythonExe, scriptPath, filePath) {
  return new Promise((resolve, reject) => {
    logPY("========== PYTHON FILE START ==========");
    logPY("Script:", scriptPath);
    logPY("File:", filePath);
    logPY("CWD:", PYTHON_ROOT);

    const py = spawn(pythonExe, [scriptPath, filePath], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: PYTHON_ROOT,
      env: baseEnv,
    });

    let stdout = "";
    let stderr = "";

    // =========================
    // TIMEOUT SAFETY
    // =========================
    const timeout = setTimeout(() => {
      logPYError("Python timeout reached. Killing process.");
      py.kill("SIGKILL");

      const err = new Error("Python process timeout");
      err.stdout = stdout;
      err.stderr = stderr;
      reject(err);
    }, PY_TIMEOUT_MS);

    // =========================
    // STDOUT STREAM
    // =========================
    py.stdout.on("data", (d) => {
      stdout += d.toString("utf-8");
    });

    // =========================
    // STDERR STREAM
    // =========================
    py.stderr.on("data", (d) => {
      stderr += d.toString("utf-8");
    });

    // =========================
    // PROCESS ERROR
    // =========================
    py.on("error", (err) => {
      clearTimeout(timeout);
      logPYError("FAILED TO START PYTHON PROCESS:", err);
      reject(err);
    });

    // =========================
    // PROCESS EXIT
    // =========================
    py.on("close", (code) => {
      clearTimeout(timeout);

      logPY("========== PYTHON FILE END ==========");
      logPY("Exit code:", code);

      if (code !== 0) {
        const err = new Error("Python execution failed");
        err.code = code;
        err.stdout = stdout;
        err.stderr = stderr;

        logPYError("Python execution failed:", stderr);
        return reject(err);
      }

      resolve({
        stdout,
        stderr,
      });
    });
  });
}

module.exports = {
  runPythonWithJSON,
  runPythonWithFile,
};
