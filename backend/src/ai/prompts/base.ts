// Base interface for all domain prompt configurations
export interface DomainPromptConfig {
  domain: string;
  domainEnum: string;
  persona: {
    en: string;
    fr: string;
  };
  subTopics: string[];
  questionsByLevel: {
    easy: string[];
    medium: string[];
    hard: string[];
  };
  evaluationCriteria: string[];
  scoringGuidelines: string;
}
