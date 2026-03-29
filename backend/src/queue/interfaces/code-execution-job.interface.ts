export interface CodeExecutionJob {
  submissionId: string;
  userId: string;
  challengeId: string;
  code: string;
  language: string;
  tests: {
    input: string;
    expectedOutput: string;
  }[];
  context: 'solo' | 'duel' | 'hackathon';
  duelId?: string;
  hackathonId?: string;
  hackathonTeamId?: string;
  isRejudge?: boolean;
}
