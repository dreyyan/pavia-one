// [HELPER] Safely delete a temp file
function safeUnlink(p) {
  try {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch (_) {}
}

module.exports = { safeUnlink };
