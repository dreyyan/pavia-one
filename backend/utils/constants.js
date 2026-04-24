const GRADE_LEVELS = [7, 8, 9, 10];
const CURRICULA = ["Regular", "STE", "SPS", "SPA", "SPJ"];
const VALID_CURRICULA = CURRICULA;

const SECTION_MASTERLIST = {
  7: [
    "Archernar",
    "Adhara",
    "Alkaid",
    "Altair",
    "Arcturus",
    "Ascella",
    "Capella",
    "Deneb",
    "Draco",
    "Lyra",
    "Mira",
    "Orion",
    "Perseus",
    "Phoenix",
    "Polaris",
    "Regulus",
    "Rigel",
    "Saiph",
    "Sirius",
    "Spica",
    "Vega",
    "Zania",
  ],
  8: [
    "Anthurium",
    "Asphodel",
    "Aster",
    "Begonia",
    "Bluebell",
    "Camellia",
    "Carnation",
    "Daffodil",
    "Edelweiss",
    "Hyacinth",
    "Iris",
    "Ixora",
    "Jasmine",
    "Lavender",
    "Lily",
    "Mallow",
    "Peony",
    "Rose",
    "Sampaguita",
    "Stargazer",
    "Trillium",
    "Zinnia",
  ],
  9: [
    "Benevolence",
    "Charity",
    "Chastity",
    "Compassion",
    "Courage",
    "Creativity",
    "Faith",
    "Fortitude",
    "Friendship",
    "Harmony",
    "Honesty",
    "Humility",
    "Integrity",
    "Justice",
    "Love",
    "Loyalty",
    "Obedience",
    "Patience",
    "Peace",
    "Prudence",
    "Sincerity",
  ],
  10: [
    "Alexandrite",
    "Amber",
    "Amethyst",
    "Aquamarine",
    "Beryl",
    "Carnelian",
    "Citrine",
    "Diamond",
    "Emerald",
    "Garnet",
    "Jade",
    "Olivine",
    "Onyx",
    "Opal",
    "Peridot",
    "Ruby",
    "Sapphire",
    "Sardonyx",
    "Sphene",
    "Spinel",
    "Topaz",
    "Zircon",
  ],
};

const SPECIAL_SECTIONS = {
  7: {
    STE: ["Orion", "Lyra"],
    SPJ: ["Polaris"],
    SPS: ["Perseus"],
    SPA: ["Draco"],
  },
  8: {
    STE: ["Camellia", "Aster"],
    SPJ: ["Peony"],
    SPS: ["Trillium"],
    SPA: ["Mallow"],
  },
  9: {
    STE: ["Humility", "Fortitude"],
    SPJ: ["Creativity"],
    SPS: ["Courage"],
    SPA: ["Prudence"],
  },
  10: {
    STE: ["Emerald", "Onyx"],
    SPJ: ["Citrine"],
    SPS: ["Sphene"],
    SPA: ["Amber"],
  },
};

const SECTION_COLOR_MAP = {
  7: "blue",
  8: "orange",
  9: "green",
  10: "violet",
};

const CURRICULUM_TONE_MAP = {
  Regular: 100, // soft / neutral
  STE: 200, // slightly stronger
  SPS: 300, // medium soft accent
  SPA: 100, // keep calm / arts feel
  SPJ: 200, // structured but not loud
};

const FALLBACK_TONE = 500;

module.exports = {
  GRADE_LEVELS,
  CURRICULA,
  VALID_CURRICULA,
  SECTION_MASTERLIST,
  SPECIAL_SECTIONS,
  SECTION_COLOR_MAP,
  CURRICULUM_TONE_MAP,
  FALLBACK_TONE,
};
