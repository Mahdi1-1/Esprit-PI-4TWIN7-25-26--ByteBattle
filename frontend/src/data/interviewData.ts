// AI Mock Interview data and types

export type InterviewDomain =
  | 'CLOUD_COMPUTING'
  | 'SOFTWARE_ENGINEERING'
  | 'CYBERSECURITY'
  | 'DATA_SCIENCE_AI'
  | 'FRONTEND_ENGINEERING'
  | 'BACKEND_ENGINEERING'
  | 'DEVOPS_SRE'
  | 'MOBILE_DEVELOPMENT';

export type InterviewLanguage = 'FR' | 'EN';

// Alias for backwards compatibility
export interface InterviewTopic extends InterviewDomainData {
  questionCount?: number;
}

export interface InterviewDomainData {
  id: InterviewDomain;
  label: string;
  icon: string;
  description: string;
  color: string;
  subTopics: string[];
  estimatedDurations: {
    easy: string;
    medium: string;
    hard: string;
  };
}

export interface InterviewDifficulty {
  id: 'easy' | 'medium' | 'hard';
  label: string;
  labelFr: string;
  labelEn: string;
  color: string;
  description: string;
  descriptionFr: string;
  descriptionEn: string;
}

export interface InterviewMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
  code?: string;
  language?: string;
  codeBlock?: { language: string; code: string };
  feedback?: { score: number };
  audioUrl?: string;
  isVoice?: boolean;
  confidence?: number;
}

export interface InterviewSession {
  id: string;
  difficulty: string;
  domain: InterviewDomain;
  language: InterviewLanguage;
  topic?: string;
  messages: InterviewMessage[];
  feedback?: InterviewFeedback;
  verdict?: 'HIRE' | 'MAYBE' | 'NO_HIRE';
  status: 'active' | 'completed' | 'abandoned';
  tokensUsed: number;
  duration?: number;
}

export interface CompetencyScore {
  competency: string;
  score: number;
  feedback: string;
}

export interface RecommendedResource {
  title: string;
  url: string;
  type: 'course' | 'article' | 'practice';
}

export interface InterviewFeedback {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  verdict: 'HIRE' | 'MAYBE' | 'NO_HIRE';
  competencyScores: CompetencyScore[];
  strengths: string[];
  improvements: string[];
  recommendedResources: RecommendedResource[];
  closingMessage: string;
}

export interface InterviewSummary extends InterviewFeedback {
  verdictLabel: string;
  verdictColor: string;
}

// Domain-specific data
export const interviewDomains: InterviewDomainData[] = [
  {
    id: 'CLOUD_COMPUTING',
    label: 'Cloud Computing',
    icon: '☁️',
    description: 'AWS, Azure, GCP architecture and services',
    color: '#FF6B35',
    subTopics: ['EC2/ECS/EKS', 'Lambda', 'S3', 'VPC', 'IAM', 'Auto-scaling', 'Load Balancing'],
    estimatedDurations: { easy: '30 min', medium: '45 min', hard: '60 min' },
  },
  {
    id: 'SOFTWARE_ENGINEERING',
    label: 'Software Engineering',
    icon: '💻',
    description: 'Design patterns, clean code, architecture',
    color: '#4ECDC4',
    subTopics: ['OOP', 'Design Patterns', 'SOLID', 'Clean Architecture', 'Testing', 'Refactoring'],
    estimatedDurations: { easy: '30 min', medium: '45 min', hard: '60 min' },
  },
  {
    id: 'CYBERSECURITY',
    label: 'Cybersecurity',
    icon: '🔐',
    description: 'Security best practices, threat modeling, compliance',
    color: '#FF006E',
    subTopics: ['OWASP Top 10', 'Authentication', 'Encryption', 'Network Security', 'Penetration Testing'],
    estimatedDurations: { easy: '25 min', medium: '40 min', hard: '55 min' },
  },
  {
    id: 'DATA_SCIENCE_AI',
    label: 'Data Science & AI',
    icon: '🤖',
    description: 'Machine learning, deep learning, MLOps',
    color: '#8338EC',
    subTopics: ['ML Algorithms', 'Deep Learning', 'NLP', 'Computer Vision', 'MLOps', 'Feature Engineering'],
    estimatedDurations: { easy: '35 min', medium: '50 min', hard: '65 min' },
  },
  {
    id: 'FRONTEND_ENGINEERING',
    label: 'Frontend Engineering',
    icon: '🎨',
    description: 'React, Vue, performance, accessibility',
    color: '#3A86FF',
    subTopics: ['JavaScript', 'React/Vue', 'CSS', 'State Management', 'Performance', 'Accessibility'],
    estimatedDurations: { easy: '25 min', medium: '40 min', hard: '55 min' },
  },
  {
    id: 'BACKEND_ENGINEERING',
    label: 'Backend Engineering',
    icon: '⚙️',
    description: 'APIs, databases, microservices',
    color: '#06D6A0',
    subTopics: ['REST APIs', 'GraphQL', 'Databases', 'Caching', 'Message Queues', 'Microservices'],
    estimatedDurations: { easy: '30 min', medium: '45 min', hard: '60 min' },
  },
  {
    id: 'DEVOPS_SRE',
    label: 'DevOps & SRE',
    icon: '🚀',
    description: 'Kubernetes, CI/CD, monitoring, reliability',
    color: '#FFD60A',
    subTopics: ['Kubernetes', 'Docker', 'CI/CD', 'Terraform', 'Monitoring', 'Chaos Engineering'],
    estimatedDurations: { easy: '30 min', medium: '45 min', hard: '60 min' },
  },
  {
    id: 'MOBILE_DEVELOPMENT',
    label: 'Mobile Development',
    icon: '📱',
    description: 'iOS, Android, React Native, Flutter',
    color: '#F72585',
    subTopics: ['iOS/Swift', 'Android/Kotlin', 'React Native', 'Flutter', 'Mobile Architecture'],
    estimatedDurations: { easy: '25 min', medium: '40 min', hard: '55 min' },
  },
];

export const difficultyLevels: InterviewDifficulty[] = [
  {
    id: 'easy',
    label: 'Easy',
    labelFr: 'Facile',
    labelEn: 'Easy',
    color: 'var(--state-success)',
    description: 'For entry-level positions',
    descriptionFr: 'Pour les postes de niveau débutant',
    descriptionEn: 'For entry-level positions',
  },
  {
    id: 'medium',
    label: 'Medium',
    labelFr: 'Moyen',
    labelEn: 'Medium',
    color: 'var(--state-warning)',
    description: 'For mid-level positions',
    descriptionFr: 'Pour les postes de niveau intermédiaire',
    descriptionEn: 'For mid-level positions',
  },
  {
    id: 'hard',
    label: 'Hard',
    labelFr: 'Difficile',
    labelEn: 'Hard',
    color: 'var(--state-error)',
    description: 'For senior/lead positions',
    descriptionFr: 'Pour les postes seniors/lead',
    descriptionEn: 'For senior/lead positions',
  },
];

// Helper function to get domain by ID
export function getDomainById(id: InterviewDomain): InterviewDomainData | undefined {
  return interviewDomains.find(d => d.id === id);
}

// Helper function to get verdict styling
export function getVerdictStyling(verdict: 'HIRE' | 'MAYBE' | 'NO_HIRE') {
  switch (verdict) {
    case 'HIRE':
      return { label: 'HIRE', color: 'var(--state-success)', bgColor: 'rgba(16, 185, 129, 0.1)' };
    case 'MAYBE':
      return { label: 'MAYBE', color: 'var(--state-warning)', bgColor: 'rgba(245, 158, 11, 0.1)' };
    case 'NO_HIRE':
      return { label: 'NO HIRE', color: 'var(--state-error)', bgColor: 'rgba(239, 68, 68, 0.1)' };
  }
}

// Alias for backwards compatibility
export const interviewTopics = interviewDomains.map(d => ({
  ...d,
  questionCount: d.subTopics.length,
})) as InterviewTopic[];
