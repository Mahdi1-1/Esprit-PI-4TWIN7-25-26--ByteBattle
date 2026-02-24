export const mockProblems = [
  {
    id: 'two-sum-arena',
    title: 'Two Sum Arena',
    difficulty: 'easy' as const,
    tags: ['Array', 'Hash Table'],
    solveRate: 68,
    avgTime: 12,
    status: 'solved' as const,
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10⁴',
      '-10⁹ <= nums[i] <= 10⁹',
      '-10⁹ <= target <= 10⁹',
      'Only one valid answer exists.',
    ],
  },
  {
    id: 'warp-gate-paths',
    title: 'Warp Gate Paths',
    difficulty: 'medium' as const,
    tags: ['Graph', 'BFS', 'Shortest Path'],
    solveRate: 42,
    avgTime: 28,
    status: 'attempted' as const,
    description: 'Find the shortest path through a network of warp gates in space.',
    examples: [],
    constraints: [],
  },
  {
    id: 'samurai-segments',
    title: 'Samurai Segments',
    difficulty: 'hard' as const,
    tags: ['Dynamic Programming', 'Segment Tree'],
    solveRate: 18,
    avgTime: 52,
    status: 'new' as const,
    description: 'Optimize cutting patterns for maximum honor.',
    examples: [],
    constraints: [],
  },
  {
    id: 'pixel-collision',
    title: 'Pixel Collision',
    difficulty: 'medium' as const,
    tags: ['Geometry', 'Math'],
    solveRate: 55,
    avgTime: 18,
    status: 'new' as const,
    description: 'Detect collisions in a retro game environment.',
    examples: [],
    constraints: [],
  },
];

export const mockMatches = [
  {
    id: '1',
    opponent: 'CodeNinja92',
    opponentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CodeNinja92',
    result: 'win' as const,
    eloDelta: 18,
    problem: 'Two Sum Arena',
    duration: 8.5,
    date: '2 hours ago',
  },
  {
    id: '2',
    opponent: 'AlgoMaster',
    opponentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlgoMaster',
    result: 'loss' as const,
    eloDelta: -12,
    problem: 'Warp Gate Paths',
    duration: 15.2,
    date: '1 day ago',
  },
  {
    id: '3',
    opponent: 'PixelWarrior',
    opponentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PixelWarrior',
    result: 'win' as const,
    eloDelta: 22,
    problem: 'Pixel Collision',
    duration: 11.8,
    date: '2 days ago',
  },
];

export const mockUser = {
  username: 'AyaCode',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AyaCode',
  level: 42,
  currentXP: 18450,
  maxXP: 20000,
  elo: 1384,
  badges: [
    { name: 'NightOwl', rarity: 'rare' as const, description: 'Solved 10 problems after midnight' },
    { name: 'Speedster', rarity: 'epic' as const, description: 'Won a duel in under 5 minutes' },
    { name: 'FirstBlood', rarity: 'legendary' as const, description: 'First solve in a hackathon' },
  ],
  skills: {
    Algorithm: 85,
    DataStructures: 78,
    DynamicProgramming: 62,
    Graph: 71,
    Debug: 88,
    CleanCode: 75,
  },
};

export const mockHackathons = [
  {
    id: 'winter-championship',
    name: 'Winter Championship 2026',
    status: 'ongoing' as const,
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // Started 2 hours ago
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // Ends in 3 hours
    frozenTime: null,
    teams: 128,
    problems: 6,
    registrationOpen: false,
  },
  {
    id: 'spring-qualifier',
    name: 'Spring Qualifier 2026',
    status: 'finished' as const,
    startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
    frozenTime: null,
    teams: 256,
    problems: 8,
    registrationOpen: false,
  },
];

export const mockScoreboard = [
  {
    rank: 1,
    team: 'Team Nova',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=nova',
    solved: 5,
    penalty: 342,
    problems: {
      A: { status: 'solved', time: 12, attempts: 1, firstBlood: true },
      B: { status: 'solved', time: 45, attempts: 1, firstBlood: false },
      C: { status: 'solved', time: 89, attempts: 2, firstBlood: true },
      D: { status: 'solved', time: 156, attempts: 1, firstBlood: false },
      E: { status: 'solved', time: 234, attempts: 3, firstBlood: false },
      F: { status: 'unattempted', time: 0, attempts: 0, firstBlood: false },
    },
  },
  {
    rank: 2,
    team: 'Code Warriors',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=warriors',
    solved: 5,
    penalty: 389,
    problems: {
      A: { status: 'solved', time: 18, attempts: 1, firstBlood: false },
      B: { status: 'solved', time: 52, attempts: 2, firstBlood: false },
      C: { status: 'solved', time: 98, attempts: 1, firstBlood: false },
      D: { status: 'solved', time: 145, attempts: 1, firstBlood: false },
      E: { status: 'solved', time: 267, attempts: 4, firstBlood: false },
      F: { status: 'attempted', time: 0, attempts: 2, firstBlood: false },
    },
  },
  {
    rank: 3,
    team: 'Algo Masters',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=masters',
    solved: 4,
    penalty: 298,
    problems: {
      A: { status: 'solved', time: 25, attempts: 2, firstBlood: false },
      B: { status: 'solved', time: 67, attempts: 1, firstBlood: false },
      C: { status: 'solved', time: 112, attempts: 1, firstBlood: false },
      D: { status: 'solved', time: 178, attempts: 2, firstBlood: false },
      E: { status: 'attempted', time: 0, attempts: 3, firstBlood: false },
      F: { status: 'unattempted', time: 0, attempts: 0, firstBlood: false },
    },
  },
];

export const mockLeaderboard = [
  { rank: 1, username: 'QuantumCoder', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=quantum', elo: 2145, wins: 342, losses: 128 },
  { rank: 2, username: 'ByteMaster', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=byte', elo: 2098, wins: 298, losses: 112 },
  { rank: 3, username: 'AlgoQueen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=algo', elo: 2034, wins: 267, losses: 95 },
  { rank: 4, username: 'CodeSamurai', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=samurai', elo: 1998, wins: 245, losses: 103 },
  { rank: 5, username: 'PixelNinja', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pixel', elo: 1956, wins: 223, losses: 98 },
  { rank: 12, username: 'AyaCode', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AyaCode', elo: 1384, wins: 156, losses: 89, isCurrentUser: true },
];
