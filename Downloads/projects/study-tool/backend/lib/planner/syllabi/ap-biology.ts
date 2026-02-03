export type APBioTopicId =
  | "water"
  | "carbon"
  | "macromolecules"
  | "enzymes"
  | "cell_membrane"
  | "organelles"
  | "transport"
  | "photosynthesis"
  | "cellular_respiration"
  | "cell_cycle"
  | "mitosis"
  | "meiosis"
  | "dna_replication"
  | "transcription"
  | "translation"
  | "gene_regulation"
  | "mutations"
  | "natural_selection"
  | "population_genetics"
  | "ecology";

export const syllabus = {
  title: "AP Biology",
  units: [
    {
      unit: 1,
      name: "Chemistry of Life",
      weight: 0.08,
      topics: ["water", "carbon", "macromolecules", "enzymes"] as APBioTopicId[]
    },
    {
      unit: 2,
      name: "Cell Structure & Function",
      weight: 0.13,
      topics: ["cell_membrane", "organelles", "transport"] as APBioTopicId[]
    },
    {
      unit: 3,
      name: "Cellular Energetics",
      weight: 0.13,
      topics: ["photosynthesis", "cellular_respiration"] as APBioTopicId[]
    },
    {
      unit: 4,
      name: "Cell Communication & Cell Cycle",
      weight: 0.10,
      topics: ["cell_cycle", "mitosis"] as APBioTopicId[]
    },
    {
      unit: 5,
      name: "Heredity",
      weight: 0.13,
      topics: ["meiosis"] as APBioTopicId[]
    },
    {
      unit: 6,
      name: "Gene Expression & Regulation",
      weight: 0.16,
      topics: [
        "dna_replication",
        "transcription",
        "translation",
        "gene_regulation",
        "mutations"
      ] as APBioTopicId[]
    },
    {
      unit: 7,
      name: "Natural Selection",
      weight: 0.13,
      topics: ["natural_selection", "population_genetics"] as APBioTopicId[]
    },
    {
      unit: 8,
      name: "Ecology",
      weight: 0.14,
      topics: ["ecology"] as APBioTopicId[]
    }
  ]
};
