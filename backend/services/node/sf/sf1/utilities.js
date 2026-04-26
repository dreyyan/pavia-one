// [HELPER] Normalize column value
function normalizeCol(col) {
  return (col || "")
    .toString()
    .toLowerCase()
    .replace(/\n/g, " ")
    .replace(/[.\(\)\/]/g, " ")
    .trim();
}

// [HELPER] Split full name into first, last, and middle name
function splitName(val) {
  const parts = (val || "").split(",").map((p) => p.trim());
  return {
    last: parts[0] || "",
    first: parts[1] || "",
    middle: parts[2] || "",
  };
}

// [HELPER] Parse parent's name
function parseParentName(val) {
  const parts = (val || "").split(",").map((p) => p.trim());
  if (!parts.length) return "";
  const last = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  const firstMiddle = parts
    .slice(1)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  return firstMiddle ? `${firstMiddle} ${last}` : last;
}

function calculateAge(birthDate) {
  if (!birthDate) return "";
  return dayjs().diff(dayjs(birthDate), "year");
}

module.exports = {
  normalizeCol,
  splitName,
  parseParentName,
};
