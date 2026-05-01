// Canvas challenge mock data and types

/** Contraintes telles que stockées en base (Json object) */
export interface CanvasChallengeConstraints {
  timeLimit?: number;       // durée en minutes
  maxElements?: number;
  requiredComponents?: string[];
  [key: string]: unknown;
}

/** Rubric criteria */
export interface RubricItem {
  category: string;
  description: string;
  maxPoints: number;
}

/**
 * CanvasChallenge — structure normalisée reçue de l'API backend.
 * Les champs `requirements`, `constraints`, `deliverables`, `successCriteria`
 * sont extraits / dérivés du backend dans canvasService.normalizeChallenge().
 */
export interface CanvasChallenge {
  id: string;
  title: string;
  description: string;           // = descriptionMd (texte brut ou markdown)
  type?: string;                 // catégorie backend (architecture, devops, …)
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  duration: number;              // = constraints.timeLimit ?? 45
  context?: string;
  requirements: string[];        // = constraints.requiredComponents ?? []
  constraints: string[];         // = liste clé:valeur de l'objet constraints
  deliverables: string[];        // = [challenge.deliverables] si présent
  successCriteria: string[];
  tags: string[];
  rubric: RubricItem[];
  hints?: string[];
  thumbnail?: string;
  status?: 'new' | 'attempted' | 'completed';
  isDuelEnabled?: boolean;
  duelTimeLimit?: number | null;
}

export interface CommunityDesign {
  id: string;
  challengeId: string;
  challengeTitle: string;
  author: string;
  authorLevel: number;
  theme: string;
  imageUrl: string;
  score: number;
  likes: number;
  views: number;
  tags: string[];
  createdAt: Date;
}

export interface CanvasSubmission {
  id: string;
  challengeId: string;
  score: number;
  maxScore: number;
  imageData: string;
  badges: { name: string; icon: string }[];
  feedback: {
    summary: string;
    strengths: string[];
    improvements: string[];
  };
  rubricScores: { category: string; score: number; maxScore: number; comment: string }[];
}
