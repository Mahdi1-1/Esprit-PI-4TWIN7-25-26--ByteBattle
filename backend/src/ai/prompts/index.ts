// Central barrel file exporting all domain prompts
export * from './base';
export * from './cloud-computing';
export * from './software-engineering';
export * from './cybersecurity';
export * from './data-science-ai';
export * from './frontend-engineering';
export * from './backend-engineering';
export * from './devops-sre';
export * from './mobile-development';

import { cloudComputingPrompt } from './cloud-computing';
import { softwareEngineeringPrompt } from './software-engineering';
import { cybersecurityPrompt } from './cybersecurity';
import { dataScienceAIPrompt } from './data-science-ai';
import { frontendEngineeringPrompt } from './frontend-engineering';
import { backendEngineeringPrompt } from './backend-engineering';
import { devopsSREPrompt } from './devops-sre';
import { mobileDevelopmentPrompt } from './mobile-development';
import { DomainPromptConfig } from './base';

export const DOMAIN_PROMPTS: Record<string, DomainPromptConfig> = {
    CLOUD_COMPUTING: cloudComputingPrompt,
    SOFTWARE_ENGINEERING: softwareEngineeringPrompt,
    CYBERSECURITY: cybersecurityPrompt,
    DATA_SCIENCE_AI: dataScienceAIPrompt,
    FRONTEND_ENGINEERING: frontendEngineeringPrompt,
    BACKEND_ENGINEERING: backendEngineeringPrompt,
    DEVOPS_SRE: devopsSREPrompt,
    MOBILE_DEVELOPMENT: mobileDevelopmentPrompt,
};

export const DIFFICULTY_BEHAVIOR_RULES: Record<'easy' | 'medium' | 'hard', string> = {
    easy: [
        'Use educational guidance and progressively scaffold questions.',
        'If candidate is blocked, provide hints without giving full answers.',
        'Keep scenarios practical and fundamentals-oriented.',
    ].join('\n'),
    medium: [
        'Balance technical and behavioral evaluation during the interview.',
        'Include at least one STAR behavioral question: Situation, Task, Action, Result.',
        'Ask follow-up questions focused on trade-offs and practical decisions.',
    ].join('\n'),
    hard: [
        'Challenge shallow answers and demand justification of trade-offs.',
        'Include STAR behavioral questions with leadership and conflict-resolution angles.',
        'Push for architecture-level thinking, risk management, and ownership mindset.',
    ].join('\n'),
};
