import { APBioTopicId } from "../syllabi/ap-biology";

/**
 * Resource definitions for AP Biology.
 * Uses section anchors instead of page numbers to avoid PDF index mismatch.
 * Anchors correspond to visible section headers in:
 * "Director of Education of AP Biology Cheat Sheet Template-merged.pdf"
 */

type LearnResource = {
  type: "pdf";
  file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf";
  anchors: string[];
  description: string;
};

type PracticeResource = {
  type: "pdf_questions";
  file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf";
  anchors: string[];
  questionType: "multiple_choice";
};

export const resources: Record<
  APBioTopicId,
  { learn: LearnResource; practice: PracticeResource }
> = {
  /* =========================
     UNIT 1: CHEMISTRY OF LIFE
     ========================= */

  water: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Properties of Water",
        "Hydrogen Bonding",
        "Cohesion and Adhesion"
      ],
      description: "Chemical properties of water and their biological significance"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Water Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  carbon: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Carbon and Organic Molecules",
        "Carbon Skeletons"
      ],
      description: "Carbon bonding and molecular diversity"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Carbon Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  macromolecules: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Macromolecules",
        "Carbohydrates",
        "Lipids",
        "Proteins",
        "Nucleic Acids"
      ],
      description: "Structure and function of biological macromolecules"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Macromolecules Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  enzymes: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Enzymes",
        "Activation Energy",
        "Factors Affecting Enzyme Activity"
      ],
      description: "Enzyme structure, specificity, and regulation"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Enzymes Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  /* =========================
     UNIT 2: CELL STRUCTURE
     ========================= */

  cell_membrane: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Cell Membrane",
        "Phospholipid Bilayer",
        "Membrane Proteins"
      ],
      description: "Structure and function of cell membranes"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Cell Membrane Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  organelles: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Cell Organelles",
        "Nucleus",
        "Endoplasmic Reticulum",
        "Golgi Apparatus",
        "Mitochondria"
      ],
      description: "Structure and function of eukaryotic organelles"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Organelles Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  transport: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Passive Transport",
        "Active Transport",
        "Osmosis",
        "Endocytosis and Exocytosis"
      ],
      description: "Movement of substances across membranes"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Membrane Transport Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  /* =========================
     UNIT 3: ENERGETICS
     ========================= */

  photosynthesis: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Photosynthesis",
        "Light-Dependent Reactions",
        "Calvin Cycle"
      ],
      description: "Energy capture and carbon fixation in plants"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Photosynthesis Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  cellular_respiration: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Cellular Respiration",
        "Glycolysis",
        "Krebs Cycle",
        "Electron Transport Chain"
      ],
      description: "ATP production through metabolic pathways"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Cellular Respiration Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  /* =========================
     UNIT 4: CELL CYCLE
     ========================= */

  cell_cycle: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Cell Cycle",
        "Checkpoints",
        "Cyclins and CDKs"
      ],
      description: "Regulation of the cell cycle"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Cell Cycle Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  mitosis: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Mitosis",
        "Cytokinesis"
      ],
      description: "Stages and outcomes of mitotic cell division"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Mitosis Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  /* =========================
     UNIT 5: HEREDITY
     ========================= */

  meiosis: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Meiosis",
        "Crossing Over",
        "Independent Assortment"
      ],
      description: "Production of gametes and genetic variation"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Meiosis Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  /* =========================
     UNIT 6: GENE EXPRESSION
     ========================= */

  dna_replication: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "DNA Structure",
        "DNA Replication"
      ],
      description: "Structure and replication of DNA"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["DNA Replication Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  transcription: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Transcription",
        "RNA Processing"
      ],
      description: "RNA synthesis and processing"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Transcription Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  translation: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Translation",
        "Ribosomes",
        "tRNA"
      ],
      description: "Protein synthesis from mRNA"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Translation Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  gene_regulation: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Gene Regulation",
        "Operons",
        "Epigenetics"
      ],
      description: "Control of gene expression"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Gene Regulation Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  mutations: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Mutations",
        "Gene Mutations",
        "Chromosomal Mutations"
      ],
      description: "Sources and effects of genetic mutations"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Mutations Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  /* =========================
     UNIT 7: EVOLUTION
     ========================= */

  natural_selection: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Natural Selection",
        "Evolution",
        "Fitness"
      ],
      description: "Mechanisms of evolution by natural selection"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Natural Selection Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  population_genetics: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Population Genetics",
        "Hardy-Weinberg Equilibrium"
      ],
      description: "Allele frequency changes in populations"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Population Genetics Practice Questions"],
      questionType: "multiple_choice"
    }
  },

  /* =========================
     UNIT 8: ECOLOGY
     ========================= */

  ecology: {
    learn: {
      type: "pdf",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: [
        "Ecology",
        "Ecosystems",
        "Energy Flow",
        "Population Ecology"
      ],
      description: "Interactions between organisms and their environment"
    },
    practice: {
      type: "pdf_questions",
      file: "Director of Education of AP Biology Cheat Sheet Template-merged.pdf",
      anchors: ["Ecology Practice Questions"],
      questionType: "multiple_choice"
    }
  }
};
/* =========================
   HELPER FUNCTION
   ========================= */

// This function looks up the resource for a specific topic and type
// and formats it so the generator can use it.
export function getAPBioResource(topic: APBioTopicId, type: "learn" | "practice") {
  const resourceEntry = resources[topic];
  
  if (!resourceEntry) return [];

  const resource = resourceEntry[type];

  return [{
      title: "description" in resource ? resource.description : `${topic} Practice Questions`,
      pages: resource.anchors.join(", "),
      // SAFETY FIX: Use double quotes and a plus sign
      url: "http://localhost:3000/files/" + resource.file
    }];
}