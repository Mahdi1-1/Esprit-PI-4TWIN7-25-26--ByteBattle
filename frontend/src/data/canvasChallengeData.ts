// Canvas challenge mock data and types

export interface CanvasChallenge {
  id: string;
  title: string;
  description: string;
  type: 'drawing' | 'design' | 'illustration' | 'pixel-art';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  duration: number; // minutes
  context: string;
  requirements: string[];
  constraints: string[];
  deliverables: string[];
  successCriteria: string[];
  tags: string[];
  rubric: { category: string; description: string; maxPoints: number }[];
  thumbnail?: string;
  status?: 'new' | 'attempted' | 'completed';
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
