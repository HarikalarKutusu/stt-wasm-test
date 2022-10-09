// Data types and methods for STT Inference

export type TestResultType = {
  lc: string;
  projectId: number;
  sentence: string;
  inferred?: string;
  cer?: number;
  wer?: number;
  similarity?: number;
  audioSecs?: number;
  inferenceSecs?: number;
  rtf?: number;
};
