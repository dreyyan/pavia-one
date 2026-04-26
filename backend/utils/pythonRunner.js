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

// [HELPER] Run Python with JSON piped via stdin → resolves with { stdout, stderr }
function runPythonWithJSON(pythonExe, scriptPath, jsonData) {
  return new Promise((resolve, reject) => {
    const py = spawn(pythonExe, [scriptPath], {
      stdio: ["pipe", "pipe", "pipe"],

      cwd: PYTHON_ROOT,
      env: baseEnv,
    });

    let stdout = "",
      stderr = "";

    py.stdout.on("data", (d) => (stdout += d.toString("utf-8")));
    py.stderr.on("data", (d) => (stderr += d.toString("utf-8")));

    py.on("close", (code) => {
      if (code !== 0) return reject({ code, stdout, stderr });
      resolve({ stdout, stderr });
    });

    py.stdin.write(JSON.stringify(jsonData), "utf-8");
    py.stdin.end();
  });
}

// [HELPER] Run Python with a file argument
function runPythonWithFile(pythonExe, scriptPath, filePath) {
  return new Promise((resolve, reject) => {
    const py = spawn(pythonExe, [scriptPath, filePath], {
      stdio: ["pipe", "pipe", "pipe"],

      cwd: PYTHON_ROOT,
      env: baseEnv,
    });

    let stdout = "",
      stderr = "";

    py.stdout.on("data", (d) => (stdout += d.toString("utf-8")));
    py.stderr.on("data", (d) => (stderr += d.toString("utf-8")));

    py.on("close", (code) => {
      if (code !== 0) return reject({ code, stdout, stderr });
      resolve({ stdout, stderr });
    });
  });
}

module.exports = {
  runPythonWithJSON,
  runPythonWithFile,
};
