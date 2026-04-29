// [IMPORT] Libraries
const path = require("path");

// [IMPORT] Paths
const { FORMS_DIR, OUTPUT_DIR, SERVICES_DIR } = require("../formPaths");

// [SETUP] Paths
const SF1_DIR = path.join(SERVICES_DIR, "python", "sf", "sf1");

module.exports = {
  SF1_DIR,
  TEMPLATE_PATH: path.join(FORMS_DIR, "SF1_template.xlsx"),
  IMPORTER_PATH: path.join(SF1_DIR, "sf1_import_runner.py"),
  OUTPUT_PATH: path.join(OUTPUT_DIR, "SF1_filled_output.xlsx"),
};
