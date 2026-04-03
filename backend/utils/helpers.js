const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");

// [HELPER] Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// [HELPER] Build full name
const getFullName = (student) =>
  [
    student.firstName,
    student.middleName,
    student.lastName,
    student.nameExtension,
  ]
    .filter(Boolean)
    .join(" ");

// [HELPER] Split full name into components
function splitFullName(fullName) {
  if (!fullName) return { firstName: null, middleName: null, lastName: null };

  const parts = fullName.trim().split(" ");

  const firstName = parts[0] || null;
  const lastName = parts.length > 1 ? parts[parts.length - 1] : null;

  const middleName =
    parts.length > 2 ? parts.slice(1, parts.length - 1).join(" ") : null;

  return { firstName, middleName, lastName };
}

// [HELPER] Validate sex
const isValidSex = (sex) => ["MALE", "FEMALE"].includes(sex.toUpperCase());

// [HELPER] Calculate age from birthdate
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// [HELPER] Check if SF2 data is complete for export
const validateSF2Completeness = (sf2Data) => {
  const missing = {};

  // Check student info
  const info = sf2Data.studentInfo;
  missing.studentInfo = [];
  if (!info.address) missing.studentInfo.push("address");
  if (!info.guardian) missing.studentInfo.push("guardian");
  if (!info.birthDate) missing.studentInfo.push("birthDate");
  if (!info.sex) missing.studentInfo.push("sex");

  if (missing.studentInfo.length === 0) delete missing.studentInfo;

  // Enrollments
  if (!sf2Data.enrollments || sf2Data.enrollments.length === 0) {
    missing.enrollments = "No enrollment records";
  }

  // Daily attendances
  if (!sf2Data.dailyAttendances || sf2Data.dailyAttendances.length === 0) {
    missing.dailyAttendances = "No attendance records";
  }

  // Grades
  if (!sf2Data.sf9Grades || sf2Data.sf9Grades.length === 0) {
    missing.sf9Grades = "No SF9 grades";
  }

  // Core values
  if (!sf2Data.sf9CoreValues || sf2Data.sf9CoreValues.length === 0) {
    missing.sf9CoreValues = "No core value records";
  }

  // SF9 Summaries
  if (!sf2Data.sf9Summaries || sf2Data.sf9Summaries.length === 0) {
    missing.sf9Summaries = "No SF9 summaries";
  }

  // SF5 Reports
  if (!sf2Data.sf5Reports || sf2Data.sf5Reports.length === 0) {
    missing.sf5Reports = "No SF5 report records";
  }

  const isComplete = Object.keys(missing).length === 0;

  return { isComplete, missing };
};

// [HELPER] Recalculate & Save General Average
async function updateGeneralAverage(studentId, schoolYear) {
  const grades = await prisma.sF9Grade.findMany({
    where: { studentId, schoolYear },
    select: { finalRating: true },
  });

  if (!grades.length) return null;

  const allFinalized = grades.every((g) => g.finalRating !== null);

  const generalAverage = allFinalized
    ? Math.round(
        grades.reduce((sum, g) => sum + g.finalRating, 0) / grades.length,
      )
    : null;

  await prisma.sF9Summary.upsert({
    where: {
      studentId_schoolYear: { studentId, schoolYear },
    },
    update: { generalAverage },
    create: {
      studentId,
      schoolYear,
      generalAverage,
    },
  });

  return generalAverage;
}

// [HELPER] Derive section name from grade + curriculum
const buildSectionName = (curriculum) => {
  return curriculum;
};

// [HELPER] Validate school year string "YYYY - YYYY"
const isValidSchoolYear = (sy) => {
  const match = (sy || "").match(/^(\d{4})\s-\s(\d{4})$/);
  return match && parseInt(match[2], 10) === parseInt(match[1], 10) + 1;
};

// [HELPER] Generate `count` unique colors in hex
function generateUniqueColors(count) {
  const colors = [];
  const step = 360 / count; // spread hues evenly

  for (let i = 0; i < count; i++) {
    const hue = Math.round(i * step);

    const saturation = 30; // low saturation (less intense)
    const lightness = 90; // very light (good for text contrast)

    const color = hslToHex(hue, saturation, lightness);
    colors.push(color);
  }

  return colors;
}

// [HELPER] Convert HSL to hex
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;

  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    Math.round(
      255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))),
    );

  return `#${((1 << 24) + (f(0) << 16) + (f(8) << 8) + f(4))
    .toString(16)
    .slice(1)}`;
}

module.exports = {
  hashPassword,
  getFullName,
  splitFullName,
  isValidSex,
  calculateAge,
  validateSF2Completeness,
  updateGeneralAverage,
  buildSectionName,
  isValidSchoolYear,
  generateUniqueColors,
  hslToHex,
};
