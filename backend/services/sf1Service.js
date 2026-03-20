const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");
const dayjs = require("dayjs");

// === Helpers ===
function normalizeCol(col) {
  return (col || "")
    .toString()
    .toLowerCase()
    .replace(/\n/g, " ")
    .replace(/[.\(\)\/]/g, " ")
    .trim();
}

function splitName(val) {
  const parts = (val || "").split(",").map((p) => p.trim());
  return { last: parts[0] || "", first: parts[1] || "", middle: parts[2] || "" };
}

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

// === Generate students array from SF1 template ===
function generateStudentsFromTemplate(sectionIdentifier) {
  const BASE_DIR = path.resolve(__dirname, "..", "forms");
  const SF1_PATH = path.join(BASE_DIR, "SF1.xlsx");
  if (!fs.existsSync(SF1_PATH)) throw new Error("SF1.xlsx not found in forms folder");

  const wb = XLSX.readFile(SF1_PATH);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

  // --- Detect headers ---
  let mainHeader = -1, subHeader = -1, parentsHeader = -1, remarksHeader = -1;
  rawData.forEach((row, i) => {
    const rowStr = row.map(v => (v || "").toString().toUpperCase()).join(" ");
    if (rowStr.includes("LRN") && rowStr.includes("NAME")) mainHeader = i;
    if (rowStr.includes("BARANGAY") && rowStr.includes("MUNICIPALITY")) subHeader = i;
    if ((rowStr.includes("FATHER") || rowStr.includes("MOTHER")) && parentsHeader === -1) parentsHeader = i;
    if (rowStr.includes("REMARK") && remarksHeader === -1) remarksHeader = i;
  });

  if (mainHeader === -1 || subHeader === -1) throw new Error("Could not detect SF1 headers");

  // --- Forward fill for merged cells ---
  const ffill = (row) => {
    let last = "";
    return row.map(cell => {
      if (!cell || cell === "") cell = last;
      else last = cell;
      return cell;
    });
  };
  rawData[mainHeader] = ffill(rawData[mainHeader]);
  if (subHeader >= 0) rawData[subHeader] = ffill(rawData[subHeader]);
  if (parentsHeader >= 0) rawData[parentsHeader] = ffill(rawData[parentsHeader]);

  // --- Merge headers ---
  const mergedHeaders = [];
  const maxCols = rawData[0].length;
  for (let c = 0; c < maxCols; c++) {
    let name = rawData[mainHeader][c] || "";
    if (subHeader >= 0 && rawData[subHeader][c]) name = rawData[subHeader][c];
    if (parentsHeader >= 0 && /(FATHER|MOTHER)/i.test(rawData[parentsHeader][c])) name = rawData[parentsHeader][c];
    if (remarksHeader >= 0 && /REMARK/i.test(rawData[remarksHeader][c])) name = rawData[remarksHeader][c];
    mergedHeaders.push(normalizeCol(name));
  }

  const skipRows = [mainHeader, subHeader];
  if (parentsHeader >= 0) skipRows.push(parentsHeader);
  if (remarksHeader >= 0) skipRows.push(remarksHeader);

  const df = rawData.filter((_, i) => !skipRows.includes(i));

  // --- Parse students ---
  const students = [];
  df.forEach(row => {
    const student = {};
    mergedHeaders.forEach((colName, idx) => student[colName] = row[idx] || "");

    const lrn = student["lrn"] || "";
    if (!/^\d{6,12}$/.test(lrn)) return;

    const studentSection = (student["section"] || student["grade_section"] || "").toUpperCase();
    if (sectionIdentifier && studentSection !== sectionIdentifier.toUpperCase()) return;

    const { last, first, middle } = splitName(student["name"] || "");
    students.push({
      lrn,
      "Last Name": last,
      "First Name": first,
      "Middle Name": middle,
      sex: (student["sex"] || "").toUpperCase(),
      birth: student["birth"] || "",
      age: parseInt(student["age"]) || calculateAge(student["birth"]),
      mother_tongue: (student["mother_tongue"] || "").replace(/\b\w/g, l => l.toUpperCase()),
      religion: (student["religion"] || "").replace(/\b\w/g, l => l.toUpperCase()),
      barangay: (student["barangay"] || "").replace(/\b\w/g, l => l.toUpperCase()),
      municipality: (student["municipality"] || "Pavia").replace(/\b\w/g, l => l.toUpperCase()),
      province: (student["province"] || "Iloilo").replace(/\b\w/g, l => l.toUpperCase()),
      father_name: parseParentName(student["father_name"] || ""),
      mother_maiden_name: parseParentName(student["mother_maiden_name"] || ""),
      learning_modality: (student["learning_modality"] || "").replace(/\b\w/g, l => l.toUpperCase()),
      remarks: student["remarks"] || "",
      section: studentSection,
    });
  });

  return students;
}

// === Generate PDF Buffer (Faithful SF1 layout) ===
function generateSF1PDFBuffer(section, students) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 30, font: "Times-Roman" });
      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // --- Title ---
      doc.fontSize(16).text(`SF1 - Section: ${section.name} Grade ${section.gradeLevel}`, { align: "center" });
      doc.moveDown(1);

      // --- Table Header ---
      const headers = ["LRN", "Last Name", "First Name", "Middle Name", "Sex", "Age", "Mother Tongue", "Religion", "Barangay", "Municipality", "Province", "Father Name", "Mother Maiden Name", "Learning Modality", "Remarks"];
      doc.fontSize(10).text(headers.join(" | "));
      doc.moveDown(0.5);

      // --- Table Rows ---
      students.forEach(s => {
        const row = [
          s.lrn, s["Last Name"], s["First Name"], s["Middle Name"], s.sex, s.age,
          s.mother_tongue, s.religion, s.barangay, s.municipality, s.province,
          s.father_name, s.mother_maiden_name, s.learning_modality, s.remarks
        ];
        doc.text(row.join(" | "));
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateStudentsFromTemplate,
  generateSF1PDFBuffer
};