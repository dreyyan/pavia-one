// [IMPORT] Libraries
const path = require("path");

// [SETUP] Paths
const BASE_DIR = path.resolve(__dirname, "../..");
const SERVICES_DIR = path.join(BASE_DIR, "services");
const FORMS_DIR = path.join(SERVICES_DIR, "forms");
const OUTPUT_DIR = path.join(FORMS_DIR, "output_data");
const UPLOAD_DIR = path.join(BASE_DIR, "tmp");

module.exports = {
  BASE_DIR,
  SERVICES_DIR,
  FORMS_DIR,
  OUTPUT_DIR,
  UPLOAD_DIR,
};
