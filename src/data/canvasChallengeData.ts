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
    title: 'Chat Temps Réel WebSocket',
    type: 'architecture-logique',
    difficulty: 'medium',
    duration: 45,
    tags: ['WebSocket', 'Scalabilité', 'Temps Réel', 'HA'],
    description: 'Concevoir une architecture complète pour un système de chat temps réel supportant 1M utilisateurs simultanés',
    context: 'Une startup veut lancer une application de messagerie instantanée grand public. Le système doit gérer des messages texte, des notifications de présence (online/offline), et supporter une montée en charge progressive.',
    requirements: [
      'Support de 1M utilisateurs simultanés',
      'Latence < 100ms pour la livraison de messages',
      'Haute disponibilité (99.9% uptime)',
      'Authentification sécurisée',
      'Historique des messages persisté',
      'Notifications push pour utilisateurs offline'
    ],
    constraints: [
      'Budget cloud limité (optimiser les coûts)',
      'Conformité RGPD (données EU)',
      'Rate limiting pour éviter le spam',
      'Chiffrement end-to-end des messages',
      'Monitoring et alerting obligatoires'
    ],
    deliverables: [
      'Diagramme d\'architecture avec tous les composants',
      'Flux de données principal (envoi/réception message)',
      'Stratégie de scaling horizontal',
      'Légende claire des technologies utilisées'
    ],
    successCriteria: [
      'Architecture claire et lisible',
      'Tous les composants critiques présents',
      'Stratégie de scalabilité explicite',
      'Sécurité et monitoring pris en compte'
    ],
    status: 'new',
    rubric: [
      {
        criterion: 'Clarté du diagramme',
        maxPoints: 20,
        description: 'Organisation visuelle, légende, nommage'
      },
      {
        criterion: 'Scalabilité',
        maxPoints: 25,
        description: 'Load balancing, caching, sharding'
      },
      {
        criterion: 'Sécurité',
        maxPoints: 20,
        description: 'Auth, encryption, rate limiting'
      },
      {
        criterion: 'Monitoring',
        maxPoints: 15,
        description: 'Logs, metrics, alerting'
      },
      {
        criterion: 'Conformité exigences',
        maxPoints: 20,
        description: 'Toutes les contraintes respectées'
      }
    ]
  },
  {
    id: 'canvas-002',
    title: 'Système de Notification Event-Driven',
    type: 'dataflow',
    difficulty: 'hard',
    duration: 60,
    tags: ['Event-Driven', 'Queue', 'Microservices', 'Async'],
    description: 'Concevoir un système de notifications multi-canal (email, SMS, push) basé sur des événements',
    context: 'Une plateforme e-commerce doit envoyer des notifications pour différents événements : commande confirmée, expédition, livraison, promotions, etc. Le système doit être résilient et garantir la livraison.',
    requirements: [
      'Support email, SMS, push notifications',
      'Traitement asynchrone des événements',
      'Gestion des retries et DLQ (Dead Letter Queue)',
      'Idempotence (pas de notifications dupliquées)',
      'Prioritisation des messages (urgent vs normal)',
      'Personnalisation selon préférences utilisateur'
    ],
    constraints: [
      'Coûts SMS à optimiser',
      'Respect des quotas fournisseurs (rate limits)',
      'Traçabilité complète des envois',
      'Opt-out et préférences utilisateur',
      'Performance : 10K notifications/seconde'
    ],
    deliverables: [
      'Architecture event-driven complète',
      'Flux détaillé : événement → notification envoyée',
      'Gestion des erreurs et retry logic',
      'Stratégie de monitoring'
    ],
    successCriteria: [
      'Pattern event-driven correctement appliqué',
      'Queue et workers bien dimensionnés',
      'Retry logic et DLQ présents',
      'Idempotence garantie'
    ],
    status: 'attempted',
    rubric: [
      {
        criterion: 'Architecture event-driven',
        maxPoints: 30,
        description: 'Queue, workers, event bus'
      },
      {
        criterion: 'Résilience',
        maxPoints: 25,
        description: 'Retry, DLQ, circuit breaker'
      },
      {
        criterion: 'Idempotence',
        maxPoints: 20,
        description: 'Gestion des doublons'
      },
      {
        criterion: 'Performance',
        maxPoints: 15,
        description: 'Throughput et scalabilité'
      },
      {
        criterion: 'Monitoring',
        maxPoints: 10,
        description: 'Observabilité du système'
      }
    ]
  },
  {
    id: 'canvas-003',
    title: 'Déploiement 3-Tiers + CDN',
    type: 'architecture-physique',
    difficulty: 'easy',
    duration: 30,
    tags: ['3-Tier', 'CDN', 'Deployment', 'DevOps'],
    description: 'Concevoir l\'architecture de déploiement d\'une application web 3-tiers avec CDN',
    context: 'Une application web classique (Frontend React, API Node.js, PostgreSQL) doit être déployée en production avec de bonnes pratiques de sécurité et performance.',
    requirements: [
      'Séparation Frontend / API / Database',
      'CDN pour les assets statiques',
      'SSL/TLS obligatoire',
      'Scaling horizontal du backend',
      'Backup automatique de la DB',
      'Environnements staging + production'
    ],
    constraints: [
      'Budget cloud modéré',
      'Simplicité opérationnelle',
      'Temps de déploiement < 10 minutes',
      'Zero downtime deployments'
    ],
    deliverables: [
      'Schéma d\'architecture réseau',
      'Composants de sécurité (firewall, WAF)',
      'Stratégie de déploiement',
      'Points de monitoring'
    ],
    successCriteria: [
      'Séparation claire des tiers',
      'Sécurité réseau bien configurée',
      'CDN correctement positionné',
      'Stratégie de backup présente'
    ],
    status: 'completed',
    rubric: [
      {
        criterion: 'Architecture 3-tiers',
        maxPoints: 25,
        description: 'Séparation correcte des couches'
      },
      {
        criterion: 'Sécurité réseau',
        maxPoints: 25,
        description: 'Firewall, VPC, SSL/TLS'
      },
      {
        criterion: 'Performance',
        maxPoints: 20,
        description: 'CDN, caching, load balancing'
      },
      {
        criterion: 'Opérations',
        maxPoints: 15,
        description: 'CI/CD, backup, monitoring'
      },
      {
        criterion: 'Conformité',
        maxPoints: 15,
        description: 'Toutes les exigences remplies'
      }
    ]
  },
  {
    id: 'canvas-004',
    title: 'Architecture Microservices E-Commerce',
    type: 'architecture-logique',
    difficulty: 'expert',
    duration: 90,
    tags: ['Microservices', 'DDD', 'API Gateway', 'Service Mesh'],
    description: 'Concevoir une architecture microservices complète pour une plateforme e-commerce',
    context: 'Migration d\'un monolithe e-commerce vers des microservices. Domaines : Produits, Panier, Commandes, Paiements, Inventaire, Utilisateurs, Notifications.',
    requirements: [
      'Découpage en domaines DDD',
      'API Gateway + authentification centralisée',
      'Communication inter-services (sync + async)',
      'Gestion des transactions distribuées',
      'Service discovery et load balancing',
      'Observabilité (tracing distribué)'
    ],
    constraints: [
      'Migration progressive (strangler pattern)',
      'Compatibilité avec le monolithe existant',
      'Performances maintenues',
      'Équipe devops limitée'
    ],
    deliverables: [
      'Carte complète des microservices',
      'Patterns de communication',
      'Stratégie de migration',
      'Infrastructure support (service mesh, etc.)'
    ],
    successCriteria: [
      'Découpage cohérent selon DDD',
      'Communication inter-services claire',
      'Patterns distribués bien appliqués',
      'Stratégie de migration réaliste'
    ],
    status: 'new',
    rubric: [
      {
        criterion: 'Découpage microservices',
        maxPoints: 30,
        description: 'Bounded contexts, cohésion'
      },
      {
        criterion: 'Communication',
        maxPoints: 25,
        description: 'API Gateway, messaging, sync/async'
      },
      {
        criterion: 'Résilience',
        maxPoints: 20,
        description: 'Circuit breaker, retry, fallback'
      },
      {
        criterion: 'Observabilité',
        maxPoints: 15,
        description: 'Tracing, logs, metrics'
      },
      {
        criterion: 'Migration',
        maxPoints: 10,
        description: 'Stratégie pragmatique'
      }
    ]
  },
  {
    id: 'canvas-005',
    title: 'Sécurité API Banking',
    type: 'securite',
    difficulty: 'hard',
    duration: 60,
    tags: ['Security', 'API', 'Banking', 'OAuth', 'Encryption'],
    description: 'Concevoir l\'architecture de sécurité d\'une API bancaire',
    context: 'API exposée aux clients B2B pour consultation de comptes et initiation de virements. Conformité PSD2 et normes bancaires obligatoires.',
    requirements: [
      'Authentification forte (OAuth 2.0 + MFA)',
      'Chiffrement end-to-end',
      'Rate limiting et anti-fraude',
      'Audit trail complet',
      'Isolation réseau stricte',
      'Détection d\'anomalies temps réel'
    ],
    constraints: [
      'Conformité PSD2',
      'Audit externe annuel',
      'Zero trust architecture',
      'Latence < 200ms malgré les contrôles'
    ],
    deliverables: [
      'Layers de sécurité (network, app, data)',
      'Flux d\'authentification et autorisation',
      'Stratégie anti-fraude',
      'Gestion des secrets et clés'
    ],
    successCriteria: [
      'Defense in depth appliquée',
      'Authentification forte présente',
      'Audit trail complet',
      'Conformité réglementaire'
    ],
    status: 'new',
    rubric: [
      {
        criterion: 'Authentification',
        maxPoints: 25,
        description: 'OAuth, MFA, session management'
      },
      {
        criterion: 'Chiffrement',
        maxPoints: 20,
        description: 'In-transit, at-rest, key management'
      },
      {
        criterion: 'Network security',
        maxPoints: 20,
        description: 'Firewall, WAF, DDoS protection'
      },
      {
        criterion: 'Monitoring',
        maxPoints: 20,
        description: 'Audit logs, anomaly detection'
      },
      {
        criterion: 'Conformité',
        maxPoints: 15,
        description: 'PSD2, RGPD, standards bancaires'
      }
    ]
  },
  {
    id: 'canvas-006',
    title: 'Pipeline CI/CD Multi-Environnement',
    type: 'dataflow',
    difficulty: 'medium',
    duration: 45,
    tags: ['CI/CD', 'DevOps', 'Automation', 'GitOps'],
    description: 'Concevoir un pipeline CI/CD complet avec gating et promotion',
    context: 'Équipe de 20 développeurs, application microservices, déploiements fréquents. Besoin d\'automatiser tests, sécurité, et déploiements multi-environnements.',
    requirements: [
      'Build automatisé sur commit',
      'Tests unitaires, intégration, e2e',
      'Scan de sécurité (SAST, DAST)',
      'Environnements: dev, staging, production',
      'Gating manuel avant production',
      'Rollback automatique si erreur'
    ],
    constraints: [
      'Temps de pipeline < 15 minutes',
      'Visibilité pour toute l\'équipe',
      'Secrets gérés de façon sécurisée',
      'Compatibilité multi-clouds'
    ],
    deliverables: [
      'Diagramme du pipeline complet',
      'Gates et validations',
      'Stratégie de rollback',
      'Notifications et feedback'
    ],
    successCriteria: [
      'Pipeline clair de bout en bout',
      'Tests et sécurité intégrés',
      'Stratégie de promotion cohérente',
      'Observabilité du pipeline'
    ],
    status: 'new',
    rubric: [
      {
        criterion: 'Automation',
        maxPoints: 25,
        description: 'Build, test, deploy automatisés'
      },
      {
        criterion: 'Qualité',
        maxPoints: 25,
        description: 'Tests complets, code quality'
      },
      {
        criterion: 'Sécurité',
        maxPoints: 20,
        description: 'Scans, secrets management'
      },
      {
        criterion: 'Gating',
        maxPoints: 15,
        description: 'Validations et approbations'
      },
      {
        criterion: 'Observabilité',
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
      summary: 'Excellente architecture globale avec une bonne prise en compte de la scalabilité. Quelques améliorations possibles sur la résilience et le monitoring.',
      strengths: [
        'Architecture claire et bien structurée avec séparation des responsabilités',
        'Stratégie de scaling horizontal bien pensée (load balancers + auto-scaling)',
        'Sécurité bien prise en compte (auth, encryption, rate limiting)',
        'Utilisation appropriée de Redis pour le cache et la session'
      ],
      risks: [
        'Single point of failure sur la base de données (pas de réplication visible)',
        'Absence de circuit breaker entre les services',
        'Monitoring et alerting peu détaillés',
        'Stratégie de backup non spécifiée'
      ],
      improvements: [
        'Ajouter une réplication master-slave pour PostgreSQL',
        'Implémenter un circuit breaker pattern entre les composants critiques',
        'Détailler la stack de monitoring (Prometheus, Grafana, alerting)',
        'Spécifier la stratégie de backup (RTO/RPO)',
        'Ajouter une API Gateway pour centraliser l\'authentification'
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
    challengeTitle: 'Chat Temps Réel WebSocket',
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
    challengeTitle: 'Système de Notification Event-Driven',
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
    challengeTitle: 'Architecture Microservices E-Commerce',
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
    challengeTitle: 'Déploiement 3-Tiers + CDN',
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
    challengeTitle: 'Sécurité API Banking',
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
    challengeTitle: 'Pipeline CI/CD Multi-Environnement',
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
    name: 'Architecture Web',
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
