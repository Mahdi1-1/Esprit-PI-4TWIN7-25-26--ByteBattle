// Mock data for AI Mock Interview module

export type InterviewDifficulty = 'junior' | 'mid' | 'senior';
export type InterviewTopic = 'algorithms' | 'system-design' | 'behavioral' | 'frontend' | 'backend' | 'databases';
export type MessageRole = 'user' | 'ai' | 'system';

export interface InterviewMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  codeBlock?: {
    language: string;
    code: string;
  };
  feedback?: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
}

export interface InterviewSession {
  id: string;
  topic: InterviewTopic;
  difficulty: InterviewDifficulty;
  status: 'setup' | 'in-progress' | 'completed' | 'reviewing';
  startedAt: string;
  duration: number; // minutes
  messages: InterviewMessage[];
  overallScore?: number;
  summary?: InterviewSummary;
}

export interface InterviewSummary {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  strengths: string[];
  improvements: string[];
  recommendation: string;
}

export interface InterviewTopic_ {
  id: InterviewTopic;
  label: string;
  icon: string;
  description: string;
  questionCount: number;
}

export const interviewTopics: InterviewTopic_[] = [
  { id: 'algorithms', label: 'Data Structures & Algorithms', icon: '🧮', description: 'Arrays, Trees, Graphs, Dynamic Programming, and more', questionCount: 50 },
  { id: 'system-design', label: 'System Design', icon: '🏗️', description: 'Scalable architectures, distributed systems, databases', questionCount: 30 },
  { id: 'behavioral', label: 'Behavioral', icon: '🗣️', description: 'Leadership, teamwork, conflict resolution, STAR method', questionCount: 40 },
  { id: 'frontend', label: 'Frontend Development', icon: '🎨', description: 'React, CSS, Performance, Accessibility, State Management', questionCount: 35 },
  { id: 'backend', label: 'Backend Development', icon: '⚙️', description: 'APIs, Microservices, Authentication, Caching', questionCount: 35 },
  { id: 'databases', label: 'Database Design', icon: '🗄️', description: 'SQL, NoSQL, Indexing, Query Optimization, Data Modeling', questionCount: 25 },
];

export const difficultyLevels = [
  { id: 'junior' as const, label: 'Junior (0-2 years)', color: 'var(--state-success)', description: 'Fundamentals and basic problem solving' },
  { id: 'mid' as const, label: 'Mid-Level (2-5 years)', color: 'var(--state-warning)', description: 'Complex problems and system thinking' },
  { id: 'senior' as const, label: 'Senior (5+ years)', color: 'var(--state-error)', description: 'Architecture, leadership, and trade-offs' },
];

// Simulated interview conversation
export const mockInterviewSession: InterviewSession = {
  id: 'interview-1',
  topic: 'algorithms',
  difficulty: 'mid',
  status: 'in-progress',
  startedAt: '10 minutes ago',
  duration: 45,
  messages: [
    {
      id: 'm1',
      role: 'system',
      content: '🎤 **Mock Interview Started** — Topic: Data Structures & Algorithms | Difficulty: Mid-Level | Duration: 45 minutes',
      timestamp: '10:00 AM',
    },
    {
      id: 'm2',
      role: 'ai',
      content: `Hello! Welcome to your mock interview. I'm your AI interviewer today. Let's start with a coding problem.

**Problem: Two Sum with Follow-ups**

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

But here's the twist — I want you to:
1. First solve it with the brute force approach
2. Then optimize it
3. Finally, discuss what happens if the array is sorted

Take your time to think through the problem. When you're ready, walk me through your thought process.`,
      timestamp: '10:00 AM',
    },
    {
      id: 'm3',
      role: 'user',
      content: `Sure! Let me think through this step by step.

**Brute Force Approach:**
- Use two nested loops to check every pair
- Time: O(n²), Space: O(1)

**Optimized Approach:**
- Use a hash map to store complements
- For each number, check if (target - num) exists in the map
- Time: O(n), Space: O(n)

Here's my optimized solution:`,
      timestamp: '10:03 AM',
      codeBlock: {
        language: 'python',
        code: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
      },
    },
    {
      id: 'm4',
      role: 'ai',
      content: `Excellent approach! Your solution is clean and efficient. Let me give you some feedback:

✅ **Strengths:**
- Clear explanation of brute force vs optimized
- Correct time/space complexity analysis
- Clean, readable code
- Good use of enumerate

Now, for the follow-up: **What if the array is sorted?** Can you do better than O(n) space?`,
      timestamp: '10:05 AM',
      feedback: {
        score: 85,
        strengths: ['Clear communication', 'Correct complexity analysis', 'Clean code'],
        improvements: ['Could discuss edge cases', 'Consider input validation'],
      },
    },
    {
      id: 'm5',
      role: 'user',
      content: `If the array is sorted, we can use the **two-pointer technique**!

- Place one pointer at the start, one at the end
- If sum < target, move left pointer right
- If sum > target, move right pointer left
- If sum == target, return indices

This gives us O(n) time and O(1) space:`,
      timestamp: '10:07 AM',
      codeBlock: {
        language: 'python',
        code: `def two_sum_sorted(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        current_sum = nums[left] + nums[right]
        if current_sum == target:
            return [left, right]
        elif current_sum < target:
            left += 1
        else:
            right -= 1
    return []`,
      },
    },
    {
      id: 'm6',
      role: 'ai',
      content: `Perfect! You nailed the follow-up. The two-pointer approach is exactly what I was looking for.

Let me now ask you a **follow-up question**: What if we need to find **all unique pairs** that sum to the target, not just one? How would you modify your approach?

Think about:
- How to handle duplicates
- What data structure changes are needed
- Time/space trade-offs`,
      timestamp: '10:09 AM',
    },
  ],
  overallScore: undefined,
  summary: undefined,
};

export const mockCompletedSession: InterviewSession = {
  id: 'interview-completed',
  topic: 'algorithms',
  difficulty: 'mid',
  status: 'completed',
  startedAt: '2 hours ago',
  duration: 45,
  messages: [],
  overallScore: 82,
  summary: {
    overallScore: 82,
    technicalScore: 85,
    communicationScore: 78,
    problemSolvingScore: 83,
    strengths: [
      'Strong understanding of time/space complexity',
      'Clean and readable code',
      'Good problem decomposition skills',
      'Effective use of data structures',
    ],
    improvements: [
      'Discuss edge cases more proactively',
      'Consider input validation',
      'Practice explaining thought process more fluently',
      'Explore alternative approaches before coding',
    ],
    recommendation: 'Ready for mid-level interviews. Focus on system design and behavioral questions to round out your preparation.',
  },
};

export const pastInterviews = [
  { id: '1', topic: 'algorithms' as const, difficulty: 'mid' as const, date: '2 hours ago', score: 82, duration: 42 },
  { id: '2', topic: 'system-design' as const, difficulty: 'senior' as const, date: '1 day ago', score: 68, duration: 55 },
  { id: '3', topic: 'frontend' as const, difficulty: 'mid' as const, date: '3 days ago', score: 91, duration: 38 },
  { id: '4', topic: 'behavioral' as const, difficulty: 'junior' as const, date: '1 week ago', score: 88, duration: 30 },
  { id: '5', topic: 'databases' as const, difficulty: 'mid' as const, date: '2 weeks ago', score: 75, duration: 45 },
];
