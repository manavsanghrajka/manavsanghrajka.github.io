import fs from 'fs';
import path from 'path';
import { APBioTopicId } from '../planner/syllabi/ap-biology';
import { resources } from '../planner/resources/ap-biology';

/**
 * Extract study content for a topic from the PDF
 * For now, returns structured content based on topic
 * This can be enhanced with actual PDF parsing using pdf-parse
 */

interface StudyContent {
  topic: string;
  sections: Array<{
    title: string;
    content: string[];
  }>;
  summary: string;
}

// Content database - in production, this would be extracted from PDF
const STUDY_CONTENT_DB: Record<string, StudyContent> = {
  water: {
    topic: "Water",
    sections: [
      {
        title: "Properties of Water",
        content: [
          "Water is a polar molecule with uneven distribution of electrons",
          "Oxygen has a slight negative charge, hydrogen has a slight positive charge",
          "Water molecules form hydrogen bonds with each other",
          "High specific heat capacity - absorbs and releases heat slowly",
          "High heat of vaporization - requires much energy to change from liquid to gas"
        ]
      },
      {
        title: "Hydrogen Bonding",
        content: [
          "Hydrogen bonds form between water molecules",
          "Weak bonds but collectively strong",
          "Responsible for water's unique properties",
          "Forms between slightly positive H and slightly negative O"
        ]
      },
      {
        title: "Cohesion and Adhesion",
        content: [
          "Cohesion: attraction between water molecules",
          "Adhesion: attraction between water and other substances",
          "Allows for capillary action in plants",
          "Surface tension results from cohesion"
        ]
      }
    ],
    summary: "Water's unique properties make it essential for life, including its role as a solvent, temperature regulator, and structural support."
  },
  // Add more topics as needed - this is a placeholder structure
};

/**
 * Get study content for a specific topic
 */
export function getStudyContent(topicId: string | APBioTopicId): StudyContent {
  // Normalize topic ID (handle both enum and string)
  const normalizedTopicId = topicId.toLowerCase().trim();
  
  // Check if we have specific content for this topic
  const topicContent = STUDY_CONTENT_DB[normalizedTopicId];
  
  if (topicContent) {
    return topicContent;
  }

  // Try to find resource - handle both exact match and underscore variations
  let resource = resources[normalizedTopicId as APBioTopicId];
  if (!resource) {
    // Try with underscores
    const withUnderscores = normalizedTopicId.replace(/\s+/g, '_') as APBioTopicId;
    resource = resources[withUnderscores];
  }
  
  const anchors = resource?.learn?.anchors || [];
  
  // Format topic name nicely
  const topicName = topicId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
  
  return {
    topic: topicName || topicId,
    sections: anchors.length > 0 ? anchors.map(anchor => ({
      title: anchor,
      content: [
        `Content for ${anchor} section.`,
        "This content should be extracted from the PDF document.",
        "For full details, refer to the PDF document."
      ]
    })) : [{
      title: topicName,
      content: [
        "Study content for this topic.",
        "Content will be available after PDF parsing is implemented.",
        "For now, refer to the PDF document for detailed information."
      ]
    }],
    summary: resource?.learn?.description || `Study material for ${topicName}`
  };
}

/**
 * Extract practice questions from PDF
 * For now, returns structured questions that should be in the PDF
 */
export interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

const PRACTICE_QUESTIONS_DB: Record<string, PracticeQuestion[]> = {
  water: [
    {
      id: "water-1",
      question: "Which property of water allows it to absorb large amounts of heat with minimal temperature change?",
      options: [
        "High specific heat capacity",
        "Surface tension",
        "Cohesion",
        "Adhesion"
      ],
      correctAnswer: 0,
      explanation: "Water's high specific heat capacity allows it to absorb and release large amounts of heat energy with minimal temperature change, which is essential for temperature regulation in organisms."
    },
    {
      id: "water-2",
      question: "What type of bonds form between water molecules?",
      options: [
        "Covalent bonds",
        "Ionic bonds",
        "Hydrogen bonds",
        "Peptide bonds"
      ],
      correctAnswer: 2,
      explanation: "Hydrogen bonds form between the slightly positive hydrogen of one water molecule and the slightly negative oxygen of another water molecule."
    },
    {
      id: "water-3",
      question: "Which property of water is responsible for its ability to move up through plant stems?",
      options: [
        "Cohesion",
        "Adhesion",
        "Both cohesion and adhesion",
        "Surface tension"
      ],
      correctAnswer: 2,
      explanation: "Capillary action in plants relies on both cohesion (water molecules sticking together) and adhesion (water sticking to the xylem walls)."
    }
  ],
  carbon: [
    {
      id: "carbon-1",
      question: "What makes carbon such a versatile element in biological molecules?",
      options: [
        "It can form four covalent bonds",
        "It can form long chains and rings",
        "It bonds with many different elements",
        "All of the above"
      ],
      correctAnswer: 3,
      explanation: "Carbon's ability to form four covalent bonds, create long chains and rings, and bond with many elements makes it the foundation of organic chemistry."
    }
  ],
  macromolecules: [
    {
      id: "macromolecules-1",
      question: "Which macromolecule is primarily used for energy storage in animals?",
      options: [
        "Carbohydrates (glycogen)",
        "Proteins",
        "Nucleic acids",
        "Lipids"
      ],
      correctAnswer: 0,
      explanation: "Glycogen is the main storage form of glucose in animals, stored primarily in the liver and muscles."
    }
  ],
  enzymes: [
    {
      id: "enzymes-1",
      question: "What happens to an enzyme's function when it is denatured?",
      options: [
        "It becomes more active",
        "It loses its three-dimensional shape and function",
        "It breaks down into amino acids",
        "Nothing, denaturation doesn't affect enzymes"
      ],
      correctAnswer: 1,
      explanation: "Denaturation involves the unfolding of an enzyme's three-dimensional structure, which destroys its active site and renders it non-functional."
    }
  ]
};

export function getPracticeQuestions(topicId: string | APBioTopicId, count: number = 10): PracticeQuestion[] {
  const normalizedTopicId = topicId.toLowerCase().trim();
  const topicQuestions = PRACTICE_QUESTIONS_DB[normalizedTopicId] || [];
  
  if (topicQuestions.length > 0) {
    // Return requested number of questions, cycling if needed
    const questions = [];
    for (let i = 0; i < count; i++) {
      questions.push(topicQuestions[i % topicQuestions.length]);
    }
    return questions;
  }

  // Fallback questions
  return [
    {
      id: `${topicId}-default-1`,
      question: `What is the main concept related to ${topicId}?`,
      options: [
        'Option A (Correct)',
        'Option B',
        'Option C',
        'Option D'
      ],
      correctAnswer: 0,
      explanation: 'Refer to the study materials for detailed explanation.'
    }
  ];
}
