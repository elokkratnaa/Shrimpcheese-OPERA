export type Page = 'landing' | 'mind-dump' | 'council' | 'verdict' | 'history';
export type DecisionCategory = 'career' | 'education' | 'relationship' | 'finance' | 'personal-growth';

export interface UserProfile {
  email: string;
  age: string;
  profession: string;
}

export interface MindDumpData {
  thoughts: string;
  category: DecisionCategory;
  overthinkingLevel: number;
}

export interface PersonaResponse {
  id: string;
  name: string;
  role: string;
  color: string;
  icon: string;
  message: string;
}

export interface ClarityScores {
  emotionalAwareness: number;
  logicalClarity: number;
  assumptionRisk: number;
  overallClarity: number;
}

export interface VerdictData {
  rootConflict: string;
  mainConcern: string;
  hiddenFactor: string;
  reflectionSummary: string;
  clarityScores: ClarityScores;
}

export interface CachedReflection {
  id: string;
  date: string;
  category: DecisionCategory;
  rootConflict: string;
  overthinkingLevel: number;
  clarityScores: ClarityScores;
}
