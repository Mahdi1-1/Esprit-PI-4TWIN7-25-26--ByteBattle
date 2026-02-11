// Mock data for Discussion Forum module

export interface DiscussionAuthor {
  id: string;
  username: string;
  avatar: string;
  level: number;
  badges: string[];
}

export interface DiscussionComment {
  id: string;
  author: DiscussionAuthor;
  content: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  isAccepted: boolean;
  replies?: DiscussionComment[];
}

export interface DiscussionPost {
  id: string;
  title: string;
  content: string;
  author: DiscussionAuthor;
  category: 'general' | 'help' | 'showcase' | 'tutorial' | 'bug-report' | 'feature-request';
  tags: string[];
  upvotes: number;
  downvotes: number;
  views: number;
  commentCount: number;
  isPinned: boolean;
  isSolved: boolean;
  createdAt: string;
  updatedAt: string;
  comments: DiscussionComment[];
}

export const discussionCategories = [
  { id: 'general', label: 'General', icon: '💬', color: 'var(--brand-primary)' },
  { id: 'help', label: 'Help & Support', icon: '🆘', color: 'var(--state-warning)' },
  { id: 'showcase', label: 'Showcase', icon: '🏆', color: 'var(--brand-secondary)' },
  { id: 'tutorial', label: 'Tutorials', icon: '📚', color: 'var(--state-info)' },
  { id: 'bug-report', label: 'Bug Reports', icon: '🐛', color: 'var(--state-error)' },
  { id: 'feature-request', label: 'Feature Requests', icon: '✨', color: 'var(--state-success)' },
] as const;

const authors: DiscussionAuthor[] = [
  { id: 'u1', username: 'QuantumCoder', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=quantum', level: 85, badges: ['Top Contributor', 'Algorithm Master'] },
  { id: 'u2', username: 'ByteMaster', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=byte', level: 72, badges: ['Problem Setter'] },
  { id: 'u3', username: 'AlgoQueen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=algo', level: 91, badges: ['Hackathon Champion', 'Mentor'] },
  { id: 'u4', username: 'CodeSamurai', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=samurai', level: 66, badges: ['Night Owl'] },
  { id: 'u5', username: 'PixelNinja', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pixel', level: 58, badges: ['Speedster'] },
  { id: 'u6', username: 'AyaCode', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AyaCode', level: 42, badges: ['NightOwl', 'Speedster'] },
];

export const mockDiscussions: DiscussionPost[] = [
  {
    id: 'd1',
    title: 'Best approach for solving Dynamic Programming problems?',
    content: `I've been struggling with DP problems for weeks. I can solve simple ones like Fibonacci and Climbing Stairs, but when it comes to more complex problems like LCS or Knapsack, I get lost.

**What I've tried:**
- Reading through various tutorials
- Breaking problems into subproblems
- Drawing state transition diagrams

Can anyone share their systematic approach to tackling DP problems? What mental framework do you use?

\`\`\`python
# My current approach template
def solve(n):
    dp = [0] * (n + 1)
    dp[0] = base_case
    for i in range(1, n + 1):
        dp[i] = transition(dp, i)
    return dp[n]
\`\`\``,
    author: authors[5],
    category: 'help',
    tags: ['Dynamic Programming', 'Algorithms', 'Learning'],
    upvotes: 156,
    downvotes: 3,
    views: 2340,
    commentCount: 23,
    isPinned: true,
    isSolved: true,
    createdAt: '2 hours ago',
    updatedAt: '45 minutes ago',
    comments: [
      {
        id: 'c1',
        author: authors[2],
        content: `Great question! Here's my framework for DP:\n\n1. **Identify the state**: What variables define a unique subproblem?\n2. **Define the recurrence**: How does a state relate to smaller states?\n3. **Set base cases**: What are the trivial solutions?\n4. **Determine order**: Bottom-up or top-down?\n5. **Optimize space**: Can you reduce dimensions?\n\nPractice with these in order: Fibonacci → Coin Change → LCS → Edit Distance → Knapsack`,
        createdAt: '1 hour ago',
        upvotes: 89,
        downvotes: 0,
        isAccepted: true,
        replies: [
          {
            id: 'c1r1',
            author: authors[5],
            content: 'This is exactly what I needed! The ordering recommendation is gold. Thank you! 🙏',
            createdAt: '45 minutes ago',
            upvotes: 12,
            downvotes: 0,
            isAccepted: false,
          },
        ],
      },
      {
        id: 'c2',
        author: authors[0],
        content: "I'd also recommend drawing the recursion tree first before jumping into the code. It helps visualize overlapping subproblems and guides memoization placement.",
        createdAt: '50 minutes ago',
        upvotes: 45,
        downvotes: 1,
        isAccepted: false,
      },
    ],
  },
  {
    id: 'd2',
    title: '🏆 Just hit Level 80! My journey from beginner to advanced',
    content: `After 8 months on ByteBattle, I finally hit **Level 80** and unlocked the Mythic theme! 🎉

Here's a summary of my journey:
- **Month 1-2**: Solved 50 easy problems, focused on Arrays and Strings
- **Month 3-4**: Started Medium problems, learned Trees and Graphs
- **Month 5-6**: Tackled DP and advanced data structures
- **Month 7-8**: Hard problems and competitive duels

**Stats:**
- Problems solved: 347
- Duels won: 156
- Hackathons participated: 12
- Current ELO: 2034

Key takeaways:
1. Consistency > Intensity
2. Don't skip the basics
3. Code reviews from others are invaluable
4. The community here is amazing! ❤️`,
    author: authors[2],
    category: 'showcase',
    tags: ['Journey', 'Motivation', 'Tips'],
    upvotes: 342,
    downvotes: 5,
    views: 5670,
    commentCount: 67,
    isPinned: false,
    isSolved: false,
    createdAt: '1 day ago',
    updatedAt: '3 hours ago',
    comments: [
      {
        id: 'c3',
        author: authors[4],
        content: 'This is so inspiring! I\'m at month 3 and your progress gives me hope. Any specific resources for Trees and Graphs you\'d recommend?',
        createdAt: '20 hours ago',
        upvotes: 28,
        downvotes: 0,
        isAccepted: false,
      },
    ],
  },
  {
    id: 'd3',
    title: 'Guide: How to implement a Trie from scratch',
    content: `In this tutorial, I'll walk you through implementing a Trie (Prefix Tree) step by step.

## What is a Trie?

A Trie is a tree-like data structure used for storing strings efficiently. It's particularly useful for:
- Autocomplete systems
- Spell checkers
- IP routing tables

## Implementation

\`\`\`typescript
class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }
}

class Trie {
  root: TrieNode;
  
  constructor() {
    this.root = new TrieNode();
  }
  
  insert(word: string): void {
    let current = this.root;
    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }
    current.isEndOfWord = true;
  }
  
  search(word: string): boolean {
    let current = this.root;
    for (const char of word) {
      if (!current.children.has(char)) return false;
      current = current.children.get(char)!;
    }
    return current.isEndOfWord;
  }
}
\`\`\`

## Time Complexity
- Insert: O(m) where m is word length
- Search: O(m)
- Space: O(ALPHABET_SIZE * m * n)

Happy coding! 🚀`,
    author: authors[1],
    category: 'tutorial',
    tags: ['Data Structures', 'Trie', 'TypeScript'],
    upvotes: 234,
    downvotes: 2,
    views: 3890,
    commentCount: 18,
    isPinned: false,
    isSolved: false,
    createdAt: '3 days ago',
    updatedAt: '1 day ago',
    comments: [
      {
        id: 'c4',
        author: authors[3],
        content: 'Excellent tutorial! Could you also cover compressed tries (Patricia tries) in a follow-up?',
        createdAt: '2 days ago',
        upvotes: 34,
        downvotes: 0,
        isAccepted: false,
      },
    ],
  },
  {
    id: 'd4',
    title: 'Bug: Timer not stopping after submission in Duel mode',
    content: `**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- Theme: Cyber Dark

**Steps to reproduce:**
1. Enter a duel matchmaking
2. Get matched with an opponent
3. Submit a correct solution
4. Timer continues counting even after "Accepted" verdict

**Expected:** Timer should stop after submission
**Actual:** Timer keeps running

This has happened to me 3 times now. Anyone else experiencing this?`,
    author: authors[3],
    category: 'bug-report',
    tags: ['Bug', 'Duel', 'Timer'],
    upvotes: 45,
    downvotes: 0,
    views: 890,
    commentCount: 8,
    isPinned: false,
    isSolved: false,
    createdAt: '5 hours ago',
    updatedAt: '2 hours ago',
    comments: [],
  },
  {
    id: 'd5',
    title: 'Feature Request: Dark mode code editor themes',
    content: `It would be great to have more code editor themes beyond the default ones. Some suggestions:

1. **Dracula** - Popular dark theme
2. **One Dark Pro** - Atom-inspired
3. **GitHub Dark** - Clean and minimal
4. **Nord** - Arctic-inspired
5. **Catppuccin** - Pastel themed

These would complement the existing ByteBattle themes perfectly. Each game theme could have a matching editor theme!

**Voting:** 👍 if you'd like this feature!`,
    author: authors[4],
    category: 'feature-request',
    tags: ['Editor', 'Themes', 'UX'],
    upvotes: 189,
    downvotes: 12,
    views: 1560,
    commentCount: 31,
    isPinned: false,
    isSolved: false,
    createdAt: '2 days ago',
    updatedAt: '6 hours ago',
    comments: [],
  },
  {
    id: 'd6',
    title: 'Tips for winning competitive duels consistently',
    content: `After reaching top 5 on the leaderboard, here are my tips for winning duels:

## Speed Tips
- Practice typing speed (aim for 80+ WPM)
- Have templates ready for common patterns
- Read the full problem before coding

## Strategy Tips
- Start with brute force, then optimize
- Test edge cases mentally before submitting
- If stuck for >5 min, try a different approach

## Mental Game
- Stay calm under pressure
- Don't peek at opponent's progress
- Take deep breaths between rounds

What are your tips? Share below! ⚔️`,
    author: authors[0],
    category: 'general',
    tags: ['Competitive', 'Duel', 'Tips', 'Strategy'],
    upvotes: 267,
    downvotes: 8,
    views: 4120,
    commentCount: 42,
    isPinned: false,
    isSolved: false,
    createdAt: '4 days ago',
    updatedAt: '12 hours ago',
    comments: [],
  },
];
