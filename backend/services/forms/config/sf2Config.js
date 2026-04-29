// [IMPORT] Libraries
const path = require("path");

// [IMPORT] Paths
const { FORMS_DIR, OUTPUT_DIR, SERVICES_DIR } = require("../formPaths");

// [SETUP] Paths
const SF2_DIR = path.join(SERVICES_DIR, "python", "sf", "sf2");

module.exports = {
  SF2_DIR,
  TEMPLATE_PATH: path.join(FORMS_DIR, "SF2_template.xlsx"),
  IMPORTER_PATH: path.join(SF2_DIR, "sf2_import_runner.py"),
  OUTPUT_PATH: path.join(OUTPUT_DIR, "SF2_filled_output.xlsx"),
};
