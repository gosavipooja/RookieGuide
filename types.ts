
export interface GuideResponse {
  identifiedGame: string;
  basicRules: string[];
  whatHappened: string;
  whyReacted: string;
  nextSteps: string;
  sources?: { title: string; url: string }[];
}

export interface AnalysisState {
  isAnalyzing: boolean;
  error: string | null;
  result: GuideResponse | null;
}

export type SportType = 'American Football' | 'Basketball' | 'Soccer' | 'Tennis';

export type PersonaType = 'beginner' | 'new_fan' | 'hardcore';
