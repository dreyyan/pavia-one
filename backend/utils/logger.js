// ? [HELPER] Logs an error message
const error = (message) => {
  console.error(`[ERROR] ${message}`);
};

// ? [HELPER] Logs a warning message
const warn = (message) => {
  console.warn(`[WARN] ${message}`);
};

// ? [HELPER] Logs an information message
const info = (message) => {
  console.info(`[INFO] ${message}`);
};

module.exports = { error, warn, info };
