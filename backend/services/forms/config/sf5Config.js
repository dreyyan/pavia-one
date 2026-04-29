// [IMPORT] Libraries
const path = require("path");

// [IMPORT] Paths
const { FORMS_DIR, OUTPUT_DIR, SERVICES_DIR } = require("../formPaths");

// [SETUP] Paths
const SF5_DIR = path.join(SERVICES_DIR, "python", "sf", "sf5");

module.exports = {
  SF5_DIR,
  TEMPLATE_PATH: path.join(FORMS_DIR, "SF5_template.xlsx"),
  IMPORTER_PATH: path.join(SF5_DIR, "sf5_import_runner.py"),
  OUTPUT_PATH: path.join(OUTPUT_DIR, "SF5_filled_output.xlsx"),
};
