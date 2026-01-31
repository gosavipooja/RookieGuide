
export interface GuideResponse {
  identifiedGame: string;
  basicRules: string[];
  whatHappened: string;
  whyReacted: string;
  nextSteps: string;
}

export interface AnalysisState {
  isAnalyzing: boolean;
  error: string | null;
  result: GuideResponse | null;
}

export type SportType = 'American Football' | 'Basketball' | 'Soccer' | 'Baseball' | 'Tennis' | 'Cricket';

export type PersonaType = 'beginner' | 'new_fan' | 'hardcore' | 'coach';
