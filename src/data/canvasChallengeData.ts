// Canvas Challenge Mock Data

export interface CanvasChallenge {
  id: string;
  title: string;
  type: 'architecture-logique' | 'architecture-physique' | 'dataflow' | 'securite';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  duration: number; // minutes
  tags: string[];
  description: string;
  context: string;
  requirements: string[];
  constraints: string[];
  deliverables: string[];
  successCriteria: string[];
  status?: 'new' | 'attempted' | 'completed';
  thumbnail?: string;
  rubric: {
    criterion: string;
    maxPoints: number;
    description: string;
  }[];
}

export interface CanvasSubmission {
  id: string;
  challengeId: string;
  userId: string;
  score: number;
  maxScore: number;
  badges: string[];
  feedback: {
    summary: string;
    strengths: string[];
    risks: string[];
    improvements: string[];
  };
  submittedAt: Date;
  thumbnail: string;
}

export interface CommunityDesign {
  id: string;
  challengeId: string;
  challengeTitle: string;
  author: string;
  authorLevel: number;
  score: number;
  likes: number;
  views: number;
  thumbnail: string;
  createdAt: Date;
  theme: string;
  tags: string[];
}

export const canvasChallenges: CanvasChallenge[] = [
  {
    id: 'canvas-001',
    title: 'Real-Time WebSocket Chat',
    type: 'architecture-logique',
    difficulty: 'medium',
    duration: 45,
    tags: ['WebSocket', 'Scalability', 'Real-Time', 'HA'],
    description: 'Design a complete architecture for a real-time chat system supporting 1M concurrent users',
    context: 'A startup wants to launch a mass-market instant messaging app. The system must handle text messages, presence notifications (online/offline), and support progressive scaling.',
    requirements: [
      'Support 1M concurrent users',
      'Latency < 100ms for message delivery',
      'High availability (99.9% uptime)',
      'Secure authentication',
      'Persisted message history',
      'Push notifications for offline users'
    ],
    constraints: [
      'Limited cloud budget (optimize costs)',
      'GDPR compliance (EU data)',
      'Rate limiting to prevent spam',
      'End-to-end message encryption',
      'Monitoring and alerting required'
    ],
    deliverables: [
      'Architecture diagram with all components',
      'Main data flow (send/receive message)',
      'Horizontal scaling strategy',
      'Clear legend of technologies used'
    ],
    successCriteria: [
      'Clear and readable architecture',
      'All critical components present',
      'Explicit scalability strategy',
      'Security and monitoring considered'
    ],
    status: 'new',
    rubric: [
      {
        criterion: 'Diagram Clarity',
        maxPoints: 20,
        description: 'Visual organization, legend, naming'
      },
      {
        criterion: 'Scalability',
        maxPoints: 25,
        description: 'Load balancing, caching, sharding'
      },
      {
        criterion: 'Security',
        maxPoints: 20,
        description: 'Auth, encryption, rate limiting'
      },
      {
        criterion: 'Monitoring',
        maxPoints: 15,
        description: 'Logs, metrics, alerting'
      },
      {
        criterion: 'Requirements Compliance',
        maxPoints: 20,
        description: 'All constraints respected'
      }
    ]
  },
  {
    id: 'canvas-002',
    title: 'Event-Driven Notification System',
    type: 'dataflow',
    difficulty: 'hard',
    duration: 60,
    tags: ['Event-Driven', 'Queue', 'Microservices', 'Async'],
    description: 'Design a multi-channel notification system (email, SMS, push) based on events',
    context: 'An e-commerce platform must send notifications for various events: order confirmed, shipped, delivered, promotions, etc. The system must be resilient and guarantee delivery.',
    requirements: [
      'Support email, SMS, push notifications',
      'Asynchronous event processing',
      'Retry and DLQ (Dead Letter Queue) management',
      'Idempotence (no duplicate notifications)',
      'Message prioritization (urgent vs normal)',
      'Personalization based on user preferences'
    ],
    constraints: [
      'Optimize SMS costs',
      'Respect provider quotas (rate limits)',
      'Complete traceability of sends',
      'Opt-out and user preferences',
      'Performance: 10K notifications/second'
    ],
    deliverables: [
      'Complete event-driven architecture',
      'Detailed flow: event → notification sent',
      'Error handling and retry logic',
      'Monitoring strategy'
    ],
    successCriteria: [
      'Event-driven pattern correctly applied',
      'Queue and workers properly sized',
      'Retry logic and DLQ present',
      'Idempotence guaranteed'
    ],
    status: 'attempted',
    rubric: [
      {
        criterion: 'Event-driven Architecture',
        maxPoints: 30,
        description: 'Queue, workers, event bus'
      },
      {
        criterion: 'Resilience',
        maxPoints: 25,
        description: 'Retry, DLQ, circuit breaker'
      },
      {
        criterion: 'Idempotence',
        maxPoints: 20,
        description: 'Duplicate handling'
      },
      {
        criterion: 'Performance',
        maxPoints: 15,
        description: 'Throughput and scalability'
      },
      {
        criterion: 'Monitoring',
        maxPoints: 10,
        description: 'System observability'
      }
    ]
  },
  {
    id: 'canvas-003',
    title: '3-Tier Deployment + CDN',
    type: 'architecture-physique',
    difficulty: 'easy',
    duration: 30,
    tags: ['3-Tier', 'CDN', 'Deployment', 'DevOps'],
    description: 'Design the deployment architecture for a 3-tier web application with CDN',
    context: 'A classic web application (Frontend React, API Node.js, PostgreSQL) must be deployed to production with best practices for security and performance.',
    requirements: [
      'Separation Frontend / API / Database',
      'CDN for static assets',
      'Mandatory SSL/TLS',
      'Horizontal backend scaling',
      'Automatic DB backup',
      'Staging + production environments'
    ],
    constraints: [
      'Moderate cloud budget',
      'Operational simplicity',
      'Deployment time < 10 minutes',
      'Zero downtime deployments'
    ],
    deliverables: [
      'Network architecture schema',
      'Security components (firewall, WAF)',
      'Deployment strategy',
      'Monitoring points'
    ],
    successCriteria: [
      'Clear tier separation',
      'Network security well configured',
      'CDN correctly positioned',
      'Backup strategy present'
    ],
    status: 'completed',
    rubric: [
      {
        criterion: '3-Tier Architecture',
        maxPoints: 25,
        description: 'Correct layer separation'
      },
      {
        criterion: 'Network Security',
        maxPoints: 25,
        description: 'Firewall, VPC, SSL/TLS'
      },
      {
        criterion: 'Performance',
        maxPoints: 20,
        description: 'CDN, caching, load balancing'
      },
      {
        criterion: 'Operations',
        maxPoints: 15,
        description: 'CI/CD, backup, monitoring'
      },
      {
        criterion: 'Compliance',
        maxPoints: 15,
        description: 'All requirements fulfilled'
      }
    ]
  },
  {
    id: 'canvas-004',
    title: 'E-Commerce Microservices Architecture',
    type: 'architecture-logique',
    difficulty: 'expert',
    duration: 90,
    tags: ['Microservices', 'DDD', 'API Gateway', 'Service Mesh'],
    description: 'Design a complete microservices architecture for an e-commerce platform',
    context: 'Migration from an e-commerce monolith to microservices. Domains: Products, Cart, Orders, Payments, Inventory, Users, Notifications.',
    requirements: [
      'DDD domain breakdown',
      'API Gateway + centralized authentication',
      'Inter-service communication (sync + async)',
      'Distributed transaction management',
      'Service discovery and load balancing',
      'Observability (distributed tracing)'
    ],
    constraints: [
      'Progressive migration (strangler pattern)',
      'Compatibility with existing monolith',
      'Maintained performance',
      'Limited devops team'
    ],
    deliverables: [
      'Complete microservices map',
      'Communication patterns',
      'Migration strategy',
      'Support infrastructure (service mesh, etc.)'
    ],
    successCriteria: [
      'Coherent breakdown according to DDD',
      'Clear inter-service communication',
      'Distributed patterns well applied',
      'Realistic migration strategy'
    ],
    status: 'new',
    rubric: [
      {
        criterion: 'Microservices Breakdown',
        maxPoints: 30,
        description: 'Bounded contexts, cohesion'
      },
      {
        criterion: 'Communication',
        maxPoints: 25,
        description: 'API Gateway, messaging, sync/async'
      },
      {
        criterion: 'Resilience',
        maxPoints: 20,
        description: 'Circuit breaker, retry, fallback'
      },
      {
        criterion: 'Observability',
        maxPoints: 15,
        description: 'Tracing, logs, metrics'
      },
      {
        criterion: 'Migration',
        maxPoints: 10,
        description: 'Pragmatic strategy'
      }
    ]
  },
  {
    id: 'canvas-005',
    title: 'Banking API Security',
    type: 'securite',
    difficulty: 'hard',
    duration: 60,
    tags: ['Security', 'API', 'Banking', 'OAuth', 'Encryption'],
    description: 'Design the security architecture for a banking API',
    context: 'API exposed to B2B clients for account consultation and transfer initiation. PSD2 compliance and banking standards required.',
    requirements: [
      'Strong authentication (OAuth 2.0 + MFA)',
      'End-to-end encryption',
      'Rate limiting and anti-fraud',
      'Complete audit trail',
      'Strict network isolation',
      'Real-time anomaly detection'
    ],
    constraints: [
      'PSD2 compliance',
      'Annual external audit',
      'Zero trust architecture',
      'Latency < 200ms despite controls'
    ],
    deliverables: [
      'Security layers (network, app, data)',
      'Authentication and authorization flow',
      'Anti-fraud strategy',
      'Secrets and key management'
    ],
    successCriteria: [
      'Defense in depth applied',
      'Strong authentication present',
      'Complete audit trail',
      'Regulatory compliance'
    ],
    status: 'new',
    rubric: [
      {
        criterion: 'Authentication',
        maxPoints: 25,
        description: 'OAuth, MFA, session management'
      },
      {
        criterion: 'Encryption',
        maxPoints: 20,
        description: 'In-transit, at-rest, key management'
      },
      {
        criterion: 'Network Security',
        maxPoints: 20,
        description: 'Firewall, WAF, DDoS protection'
      },
      {
        criterion: 'Monitoring',
        maxPoints: 20,
        description: 'Audit logs, anomaly detection'
      },
      {
        criterion: 'Compliance',
        maxPoints: 15,
        description: 'PSD2, GDPR, banking standards'
      }
    ]
  },
  {
    id: 'canvas-006',
    title: 'Multi-Environment CI/CD Pipeline',
    type: 'dataflow',
    difficulty: 'medium',
    duration: 45,
    tags: ['CI/CD', 'DevOps', 'Automation', 'GitOps'],
    description: 'Design a complete CI/CD pipeline with gating and promotion',
    context: 'Team of 20 developers, microservices application, frequent deployments. Need to automate tests, security, and multi-environment deployments.',
    requirements: [
      'Automated build on commit',
      'Unit, integration, e2e tests',
      'Security scanning (SAST, DAST)',
      'Environments: dev, staging, production',
      'Manual gating before production',
      'Automatic rollback on error'
    ],
    constraints: [
      'Pipeline time < 15 minutes',
      'Visibility for entire team',
      'Securely managed secrets',
      'Multi-cloud compatibility'
    ],
    deliverables: [
      'Complete pipeline diagram',
      'Gates and validations',
      'Rollback strategy',
      'Notifications and feedback'
    ],
    successCriteria: [
      'Clear end-to-end pipeline',
      'Integrated tests and security',
      'Coherent promotion strategy',
      'Pipeline observability'
    ],
    status: 'new',
    rubric: [
      {
        criterion: 'Automation',
        maxPoints: 25,
        description: 'Automated build, test, deploy'
      },
      {
        criterion: 'Quality',
        maxPoints: 25,
        description: 'Comprehensive tests, code quality'
      },
      {
        criterion: 'Security',
        maxPoints: 20,
        description: 'Scans, secrets management'
      },
      {
        criterion: 'Gating',
        maxPoints: 15,
        description: 'Validations and approvals'
      },
      {
        criterion: 'Observability',
        maxPoints: 15,
        description: 'Logs, metrics, notifications'
      }
    ]
  }
];

export const mockSubmissions: CanvasSubmission[] = [
  {
    id: 'sub-001',
    challengeId: 'canvas-001',
    userId: 'user-123',
    score: 78,
    maxScore: 100,
    badges: ['Clarity Master', 'Security Aware', 'Scalability Pro'],
    feedback: {
      summary: 'Excellent overall architecture with good consideration of scalability. Some improvements possible on resilience and monitoring.',
      strengths: [
        'Clear and well-structured architecture with separation of concerns',
        'Well-thought-out horizontal scaling strategy (load balancers + auto-scaling)',
        'Security well considered (auth, encryption, rate limiting)',
        'Appropriate use of Redis for cache and session'
      ],
      risks: [
        'Single point of failure on database (no visible replication)',
        'Absence of circuit breaker between services',
        'Monitoring and alerting not detailed',
        'Backup strategy not specified'
      ],
      improvements: [
        'Add master-slave replication for PostgreSQL',
        'Implement circuit breaker pattern between critical components',
        'Detail monitoring stack (Prometheus, Grafana, alerting)',
        'Specify backup strategy (RTO/RPO)',
        'Add API Gateway to centralize authentication'
      ]
    },
    submittedAt: new Date('2024-01-28T14:30:00'),
    thumbnail: '/placeholder-canvas.png'
  }
];

export const communityDesigns: CommunityDesign[] = [
  {
    id: 'design-001',
    challengeId: 'canvas-001',
    challengeTitle: 'Real-Time WebSocket Chat',
    author: 'Sarah_Chen',
    authorLevel: 45,
    score: 92,
    likes: 147,
    views: 2341,
    thumbnail: '/placeholder-canvas.png',
    createdAt: new Date('2024-01-25T10:20:00'),
    theme: 'samurai_dojo',
    tags: ['WebSocket', 'Redis', 'Kubernetes']
  },
  {
    id: 'design-002',
    challengeId: 'canvas-002',
    challengeTitle: 'Event-Driven Notification System',
    author: 'MaxDev42',
    authorLevel: 67,
    score: 88,
    likes: 203,
    views: 3127,
    thumbnail: '/placeholder-canvas.png',
    createdAt: new Date('2024-01-24T16:45:00'),
    theme: 'pixel_arcade',
    tags: ['RabbitMQ', 'Event-Driven', 'Microservices']
  },
  {
    id: 'design-003',
    challengeId: 'canvas-004',
    challengeTitle: 'E-Commerce Microservices Architecture',
    author: 'Alex_Architect',
    authorLevel: 89,
    score: 95,
    likes: 321,
    views: 5234,
    thumbnail: '/placeholder-canvas.png',
    createdAt: new Date('2024-01-22T09:15:00'),
    theme: 'mythic_rpg',
    tags: ['Microservices', 'DDD', 'Kafka', 'Service Mesh']
  },
  {
    id: 'design-004',
    challengeId: 'canvas-003',
    challengeTitle: '3-Tier Deployment + CDN',
    author: 'DevOpsNinja',
    authorLevel: 34,
    score: 85,
    likes: 89,
    views: 1456,
    thumbnail: '/placeholder-canvas.png',
    createdAt: new Date('2024-01-26T13:30:00'),
    theme: 'cyber_arena',
    tags: ['AWS', 'CloudFront', 'Docker']
  },
  {
    id: 'design-005',
    challengeId: 'canvas-005',
    challengeTitle: 'Banking API Security',
    author: 'SecureCode_Pro',
    authorLevel: 78,
    score: 91,
    likes: 178,
    views: 2789,
    thumbnail: '/placeholder-canvas.png',
    createdAt: new Date('2024-01-23T11:00:00'),
    theme: 'space_ops',
    tags: ['OAuth', 'Security', 'Banking', 'Zero Trust']
  },
  {
    id: 'design-006',
    challengeId: 'canvas-006',
    challengeTitle: 'Multi-Environment CI/CD Pipeline',
    author: 'CloudMaster',
    authorLevel: 56,
    score: 87,
    likes: 134,
    views: 2012,
    thumbnail: '/placeholder-canvas.png',
    createdAt: new Date('2024-01-27T08:45:00'),
    theme: 'sports_arena',
    tags: ['GitLab CI', 'Kubernetes', 'ArgoCD']
  }
];

export const canvasTools = [
  { id: 'select', name: 'Select', icon: '⌖', shortcut: 'V' },
  { id: 'rectangle', name: 'Rectangle', icon: '▢', shortcut: 'R' },
  { id: 'ellipse', name: 'Ellipse', icon: '○', shortcut: 'O' },
  { id: 'arrow', name: 'Arrow', icon: '→', shortcut: 'A' },
  { id: 'line', name: 'Line', icon: '/', shortcut: 'L' },
  { id: 'text', name: 'Text', icon: 'T', shortcut: 'T' },
  { id: 'sticky', name: 'Sticky Note', icon: '📝', shortcut: 'S' },
  { id: 'icon', name: 'Icon', icon: '🎨', shortcut: 'I' },
  { id: 'eraser', name: 'Eraser', icon: '🧹', shortcut: 'E' },
];

export const canvasAssets = [
  { id: 'db', name: 'Database', icon: '🗄️', category: 'storage' },
  { id: 'cache', name: 'Cache', icon: '⚡', category: 'storage' },
  { id: 'queue', name: 'Queue', icon: '📥', category: 'messaging' },
  { id: 'lb', name: 'Load Balancer', icon: '⚖️', category: 'network' },
  { id: 'cdn', name: 'CDN', icon: '🌐', category: 'network' },
  { id: 'api', name: 'API', icon: '🔌', category: 'compute' },
  { id: 'lambda', name: 'Function', icon: 'λ', category: 'compute' },
  { id: 'users', name: 'Users', icon: '👥', category: 'actors' },
  { id: 'admin', name: 'Admin', icon: '👨‍💼', category: 'actors' },
  { id: 'monitor', name: 'Monitoring', icon: '📊', category: 'ops' },
  { id: 'firewall', name: 'Firewall', icon: '🛡️', category: 'security' },
  { id: 'lock', name: 'Auth', icon: '🔐', category: 'security' },
];

export const canvasTemplates = [
  {
    id: 'web-arch',
    name: 'Web Architecture',
    description: 'Frontend + Backend + Database',
    icon: '🌐'
  },
  {
    id: 'dataflow',
    name: 'Dataflow',
    description: 'Producer → Queue → Consumer',
    icon: '📊'
  },
  {
    id: 'microservices',
    name: 'Microservices',
    description: 'API Gateway + Services',
    icon: '🔷'
  },
  {
    id: 'security',
    name: 'Security Layers',
    description: 'WAF + Auth + Encryption',
    icon: '🔒'
  }
];
