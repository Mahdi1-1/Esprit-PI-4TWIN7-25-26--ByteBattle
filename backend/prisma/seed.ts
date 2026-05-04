/**
 * Seed — Canvas + Code Challenges
 *
 * Usage :
 *   cd backend
 *   pnpm prisma:seed
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ChallengePayload = Prisma.ChallengeCreateInput;

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS CHALLENGES
// ─────────────────────────────────────────────────────────────────────────────

const canvasChallenges: ChallengePayload[] = [
  // ── 1. Chat Temps Réel — Medium ──────────────────────────────────────────
  {
    title: 'Chat Temps Réel WebSocket',
    kind: 'CANVAS',
    difficulty: 'medium',
    status: 'published',
    category: 'architecture',
    tags: ['websocket', 'scalabilité', 'temps-réel', 'microservices'],
    allowedLanguages: [],
    tests: [],
    examples: [],
    assets: [],
    hints: [
      'Pensez à utiliser un broker de messages (Redis Pub/Sub) pour synchroniser plusieurs instances de serveur WebSocket.',
      'Un load balancer avec sticky sessions (IP hash) est nécessaire pour WebSocket.',
      'Séparez le stockage des messages (historique) du transport temps réel.',
    ],
    deliverables:
      "Diagramme d'architecture complet incluant : API Gateway, serveurs WebSocket, broker de messages, base de données, système d'authentification et stratégie de scalabilité horizontale.",
    rubric: [
      {
        category: 'Clarté du diagramme',
        description: 'Légendes, flèches dirigées, composants nommés',
        maxPoints: 20,
      },
      {
        category: 'Scalabilité',
        description: 'Stratégie pour 1M+ utilisateurs simultanés',
        maxPoints: 25,
      },
      {
        category: 'Sécurité',
        description: 'Auth JWT, chiffrement TLS, rate limiting',
        maxPoints: 20,
      },
      {
        category: 'Résilience',
        description: 'Gestion des pannes, reconnexion, fallback',
        maxPoints: 20,
      },
      {
        category: 'Conformité RGPD',
        description: "Chiffrement at-rest, droit à l'oubli",
        maxPoints: 15,
      },
    ],
    constraints: {
      timeLimit: 45,
      maxElements: 50,
      requiredComponents: ['WebSocket Server', 'Message Broker', 'Auth Service', 'Database'],
      budget: 'Optimisé cloud — pas de sur-engineering',
    },
    descriptionMd: `## 💬 Chat Temps Réel WebSocket

### Contexte
Une startup FinTech veut lancer une messagerie instantanée pour son application B2B.  
L'objectif est de supporter **1 million d'utilisateurs simultanés** avec une latence inférieure à **100ms**.

### Exigences techniques
- Support de **1M connexions WebSocket** simultanées
- Latence bout-en-bout **< 100ms**
- Haute disponibilité **99,9%** (SLA)
- Authentification sécurisée via JWT
- Historique des messages persisté (30 jours)
- Chiffrement end-to-end des messages sensibles

### Contraintes
- Budget cloud **limité** — éviter le sur-engineering
- Conformité **RGPD** obligatoire
- Rate limiting : max **100 messages/minute** par utilisateur
- Déploiement multi-région Europe

### Livrables attendus
Dessinez l'architecture complète incluant tous les composants, leurs interactions et le flux de données.

### Critères de réussite
✅ Scalabilité horizontale démontrée  
✅ Point de défaillance unique (SPOF) éliminé  
✅ Sécurité end-to-end clairement représentée  
✅ Flux d'authentification visible  
✅ Stratégie de persistance des messages définie  
`,
    isDuelEnabled: true,
    duelTimeLimit: 45,
  },

  // ── 2. Notifications Push — Hard ─────────────────────────────────────────
  {
    title: 'Système de Notifications Push Multi-Canal',
    kind: 'CANVAS',
    difficulty: 'hard',
    status: 'published',
    category: 'architecture',
    tags: ['notifications', 'event-driven', 'queue', 'push', 'multi-canal'],
    allowedLanguages: [],
    tests: [],
    examples: [],
    assets: [],
    hints: [
      'Utilisez une queue (BullMQ / SQS) pour découpler la production des notifications de leur envoi.',
      'Pensez aux canaux : email, SMS, push mobile, WebSocket in-app — chacun a un provider différent.',
      'Un système de retry avec backoff exponentiel est indispensable pour les envois échoués.',
    ],
    deliverables:
      "Architecture event-driven complète : producteurs d'événements, queue de messages, workers par canal, providers externes (FCM, APNS, SendGrid, Twilio), base de données de préférences utilisateur.",
    rubric: [
      {
        category: 'Architecture event-driven',
        description: 'Découplage producteur/consommateur',
        maxPoints: 25,
      },
      {
        category: 'Gestion des canaux',
        description: 'Email, SMS, push, in-app représentés',
        maxPoints: 20,
      },
      {
        category: 'Fiabilité',
        description: 'Retry, dead-letter queue, idempotence',
        maxPoints: 25,
      },
      {
        category: 'Personnalisation',
        description: 'Préférences utilisateur, quiet hours, fréquence',
        maxPoints: 15,
      },
      {
        category: 'Monitoring',
        description: 'Métriques de delivery, alertes, dashboard',
        maxPoints: 15,
      },
    ],
    constraints: {
      timeLimit: 60,
      maxElements: 60,
      requiredComponents: ['Event Bus', 'Queue Worker', 'Push Provider', 'Preference Store'],
      throughput: '10M notifications/jour',
    },
    descriptionMd: `## 🔔 Système de Notifications Push Multi-Canal

### Contexte
Une plateforme e-commerce de 5M d'utilisateurs a besoin d'un système centralisé  
pour envoyer **10 millions de notifications par jour** via 4 canaux différents.

### Exigences techniques
- **4 canaux** : Email, SMS, Push mobile (iOS/Android), In-app WebSocket
- Throughput : **10M notifications/jour** avec pics à 500K/heure
- Delivery rate > **98%** avec retry automatique
- Préférences utilisateur (opt-out par canal, quiet hours)
- Templates personnalisables avec variables dynamiques
- Historique consultable 90 jours

### Contraintes
- Providers externes : **SendGrid** (email), **Twilio** (SMS), **FCM/APNS** (push)
- Respect des **quiet hours** par fuseau horaire
- Conformité CAN-SPAM / RGPD (désabonnement en 1 clic)
- Idempotence obligatoire (pas de doublon en cas de retry)

### Livrables attendus
Diagramme event-driven complet avec tous les workers, queues, providers et le système de préférences.

### Critères de réussite
✅ Architecture event-driven avec découplage  
✅ Dead-letter queue pour les échecs  
✅ Gestion des préférences utilisateur  
✅ Monitoring et alertes représentés  
✅ Scalabilité des workers indépendante par canal  
`,
    isDuelEnabled: true,
    duelTimeLimit: 60,
  },

  // ── 3. Architecture 3-Tiers E-Commerce — Easy ────────────────────────────
  {
    title: 'Architecture 3-Tiers pour E-Commerce',
    kind: 'CANVAS',
    difficulty: 'easy',
    status: 'published',
    category: 'architecture',
    tags: ['3-tiers', 'e-commerce', 'cdn', 'cache', 'débutant'],
    allowedLanguages: [],
    tests: [],
    examples: [],
    assets: [],
    hints: [
      'Les 3 tiers sont : Présentation (frontend), Logique métier (API), Données (base de données).',
      'Un CDN devant le frontend améliore les performances et réduit la charge.',
      "Redis comme cache entre l'API et la DB évite les requêtes répétitives.",
    ],
    deliverables:
      'Diagramme 3-tiers clair avec frontend, API, base de données, CDN, cache et load balancer de base.',
    rubric: [
      {
        category: 'Structure 3-tiers',
        description: 'Les 3 couches clairement séparées et nommées',
        maxPoints: 30,
      },
      {
        category: 'Composants essentiels',
        description: 'CDN, LB, Cache, DB présents',
        maxPoints: 30,
      },
      {
        category: 'Flux de requêtes',
        description: 'Flèches et sens du flux corrects',
        maxPoints: 25,
      },
      {
        category: 'Lisibilité',
        description: 'Diagramme propre et compréhensible',
        maxPoints: 15,
      },
    ],
    constraints: {
      timeLimit: 30,
      maxElements: 30,
      requiredComponents: ['Frontend', 'API Server', 'Database', 'CDN'],
      level: "Débutant — pas d'over-engineering",
    },
    descriptionMd: `## 🛒 Architecture 3-Tiers pour E-Commerce

### Contexte
Une boutique en ligne veut refondre son architecture pour supporter **100K visiteurs/jour**.  
Vous devez dessiner une architecture 3-tiers classique mais robuste.

### Exigences techniques
- Séparation claire **Présentation / Logique métier / Données**
- **CDN** pour les assets statiques (images produits, CSS, JS)
- **Cache** pour les pages produits (TTL 5 minutes)
- **Load balancer** devant les serveurs API
- Base de données avec **réplica en lecture**

### Contraintes
- Architecture **simple et lisible** — pas de microservices
- Hébergement cloud unique (une seule région)
- Budget startup — nombre de composants limité

### Livrables attendus
Un diagramme clair montrant les 3 couches, leurs composants et les flux de données principaux.

### Critères de réussite
✅ 3 tiers clairement identifiables  
✅ CDN + LB + Cache présents  
✅ Sens des flux de données correct  
✅ Noms des composants explicites  
`,
    isDuelEnabled: true,
    duelTimeLimit: 30,
  },

  // ── 4. Pipeline CI/CD Kubernetes — Hard ──────────────────────────────────
  {
    title: 'Pipeline CI/CD avec Kubernetes',
    kind: 'CANVAS',
    difficulty: 'hard',
    status: 'published',
    category: 'devops',
    tags: ['kubernetes', 'ci-cd', 'devops', 'docker', 'gitops', 'déploiement'],
    allowedLanguages: [],
    tests: [],
    examples: [],
    assets: [],
    hints: [
      'GitOps = Git est la source de vérité. ArgoCD ou Flux synchronisent le cluster K8s avec le repo.',
      'Séparez les environnements (dev, staging, prod) dans des namespaces ou clusters distincts.',
      "Les secrets ne doivent jamais être dans Git — utilisez Vault ou les secrets K8s chiffrés.",
    ],
    deliverables:
      'Pipeline complet de Git push → déploiement prod : repo Git, CI (build/test/scan), registry Docker, CD (GitOps), cluster Kubernetes avec namespaces, monitoring.',
    rubric: [
      {
        category: 'Pipeline CI',
        description: 'Étapes build, test, scan sécurité, push registry',
        maxPoints: 25,
      },
      {
        category: 'Stratégie CD',
        description: 'GitOps, blue/green ou canary deployment',
        maxPoints: 25,
      },
      {
        category: 'Kubernetes',
        description: 'Namespaces, HPA, ingress, secrets correctement représentés',
        maxPoints: 20,
      },
      {
        category: 'Sécurité DevSecOps',
        description: 'Scan vulnérabilités, secrets management, RBAC',
        maxPoints: 20,
      },
      {
        category: 'Observabilité',
        description: 'Logs, métriques, traces (Loki, Prometheus, Jaeger)',
        maxPoints: 10,
      },
    ],
    constraints: {
      timeLimit: 60,
      maxElements: 70,
      requiredComponents: [
        'Git Repo',
        'CI Runner',
        'Container Registry',
        'K8s Cluster',
        'Monitoring',
      ],
      gitops: 'ArgoCD ou Flux requis',
    },
    descriptionMd: `## 🚀 Pipeline CI/CD avec Kubernetes

### Contexte
Une équipe de 20 développeurs veut automatiser complètement le déploiement de leur application  
microservices sur Kubernetes, avec une approche **GitOps** et **déploiement zero-downtime**.

### Exigences techniques
- Pipeline CI : build → tests unitaires → scan sécurité (SAST/DAST) → push registry
- Approche **GitOps** (ArgoCD ou Flux CD)
- **3 environnements** : dev, staging, production
- Stratégie de déploiement **blue/green** ou **canary** en production
- Rollback automatique en cas d'échec des health checks
- Gestion sécurisée des **secrets** (pas dans Git)

### Contraintes
- **Zero-downtime deployment** obligatoire en production
- Scan de vulnérabilités des images Docker avant déploiement
- Audit trail complet (qui a déployé quoi et quand)
- Secrets via **HashiCorp Vault** ou équivalent
- RBAC K8s — les devs ne peuvent pas déployer directement en prod

### Livrables attendus
Diagramme du flux complet de Git push jusqu'à la production, avec tous les composants intermédiaires.

### Critères de réussite
✅ Flux CI complet avec étapes de qualité  
✅ Approche GitOps clairement représentée  
✅ Stratégie de déploiement sans interruption  
✅ Gestion des secrets visible  
✅ Observabilité (logs + métriques) intégrée  
`,
    isDuelEnabled: false,
    duelTimeLimit: null,
  },

  // ── 5. Migration Microservices — Medium ───────────────────────────────────
  {
    title: 'Migration Monolithe vers Microservices',
    kind: 'CANVAS',
    difficulty: 'medium',
    status: 'published',
    category: 'architecture',
    tags: ['microservices', 'api-gateway', 'event-driven', 'migration', 'DDD'],
    allowedLanguages: [],
    tests: [],
    examples: [],
    assets: [],
    hints: [
      "Identifiez les bounded contexts avec le DDD (Domain-Driven Design) avant de découper le monolithe.",
      "L'API Gateway est le point d'entrée unique — il gère l'auth, le routing et le rate limiting.",
      'La communication inter-services peut être synchrone (gRPC/REST) ou asynchrone (events).',
    ],
    deliverables:
      "Architecture cible avec 5 microservices minimum, API Gateway, bus d'événements, bases de données indépendantes par service et stratégie de migration (strangler fig pattern).",
    rubric: [
      {
        category: 'Découpage des services',
        description: 'Bounded contexts cohérents, responsabilités claires',
        maxPoints: 25,
      },
      {
        category: 'API Gateway',
        description: 'Auth, routing, rate limiting, circuit breaker',
        maxPoints: 20,
      },
      {
        category: 'Communication inter-services',
        description: "Sync vs async bien choisi selon le cas d'usage",
        maxPoints: 20,
      },
      {
        category: 'Isolation des données',
        description: 'Chaque service a sa propre DB',
        maxPoints: 20,
      },
      {
        category: 'Stratégie de migration',
        description: 'Strangler fig ou autre approche progressive',
        maxPoints: 15,
      },
    ],
    constraints: {
      timeLimit: 50,
      maxElements: 60,
      requiredComponents: ['API Gateway', 'Auth Service', 'Event Bus', 'Service Registry'],
      minimum: 'Au moins 5 microservices distincts',
    },
    descriptionMd: `## 🔧 Migration Monolithe vers Microservices

### Contexte
Une application e-learning monolithique (10 ans d'ancienneté, 500K utilisateurs)  
doit être migrée vers une architecture microservices pour améliorer la scalabilité et la vélocité des équipes.

### Domaines métier à séparer
- **Authentification & Profils utilisateurs**
- **Catalogue de cours**
- **Lecteur vidéo & Streaming**
- **Quiz & Évaluations**
- **Paiements & Abonnements**
- **Notifications**
- **Analytiques & Rapports**

### Exigences techniques
- **API Gateway** unique comme point d'entrée
- Chaque service possède sa **propre base de données** (database per service)
- Communication **event-driven** pour les actions non critiques
- **Service discovery** automatique
- **Circuit breaker** pour éviter les cascades de pannes
- Migration **progressive** sans coupure de service

### Contraintes
- Migration en **6 mois** — approche strangler fig obligatoire
- L'ancien monolithe doit continuer à fonctionner pendant la migration
- Pas de transaction distribuée — saga pattern si nécessaire
- Chaque équipe (4 devs) est propriétaire d'un service

### Livrables attendus
Architecture cible complète + représentation de la stratégie de migration progressive.

### Critères de réussite
✅ Bounded contexts bien définis  
✅ API Gateway correctement positionné  
✅ Isolation des données par service  
✅ Stratégie de migration visible  
✅ Communication inter-services adaptée  
`,
    isDuelEnabled: true,
    duelTimeLimit: 50,
  },

  // ── 6. Dataflow ML Pipeline — Hard ───────────────────────────────────────
  {
    title: 'Pipeline ML : Collecte → Entraînement → Déploiement',
    kind: 'CANVAS',
    difficulty: 'hard',
    status: 'published',
    category: 'data-engineering',
    tags: ['machine-learning', 'mlops', 'data-pipeline', 'feature-store', 'monitoring'],
    allowedLanguages: [],
    tests: [],
    examples: [],
    assets: [],
    hints: [
      'Un Feature Store centralise les features calculées pour éviter de les recalculer à chaque entraînement.',
      'Le Model Registry (MLflow) versionne les modèles et gère les transitions staging → production.',
      'Le data drift monitoring compare la distribution des données en prod vs entraînement.',
    ],
    deliverables:
      "Pipeline MLOps end-to-end : ingestion des données, feature engineering, entraînement, évaluation, registry, déploiement (A/B testing), monitoring de la performance et du data drift.",
    rubric: [
      {
        category: 'Ingestion & Stockage',
        description: 'Sources de données, data lake, data warehouse',
        maxPoints: 20,
      },
      {
        category: 'Feature Engineering',
        description: 'Feature store, transformations, versioning',
        maxPoints: 20,
      },
      {
        category: 'Entraînement & Évaluation',
        description: 'Orchestration, métriques, model registry',
        maxPoints: 20,
      },
      {
        category: 'Déploiement',
        description: 'Serving API, A/B testing, rollout progressif',
        maxPoints: 20,
      },
      {
        category: 'Monitoring MLOps',
        description: 'Data drift, model decay, alertes, retraining auto',
        maxPoints: 20,
      },
    ],
    constraints: {
      timeLimit: 60,
      maxElements: 70,
      requiredComponents: [
        'Data Lake',
        'Feature Store',
        'Model Registry',
        'Serving API',
        'Monitoring',
      ],
      dataVolume: '1TB/jour de nouvelles données',
    },
    descriptionMd: `## 🤖 Pipeline ML : Collecte → Entraînement → Déploiement

### Contexte
Une plateforme de recommandation de contenu doit construire un pipeline **MLOps complet**  
pour entraîner, déployer et monitorer des modèles de recommendation en production.

### Données
- **Sources** : clics utilisateurs, historique de lecture, métadonnées contenu
- **Volume** : 1TB de nouvelles données par jour
- **Qualité** : données brutes à nettoyer, normaliser et enrichir

### Exigences techniques
- **Ingestion** temps réel (streaming) + batch quotidien
- **Feature Store** pour centraliser et réutiliser les features calculées
- **Orchestration** de l'entraînement (Airflow / Kubeflow)
- **Model Registry** avec versioning (MLflow ou équivalent)
- Déploiement avec **A/B testing** (trafic splitté 90/10)
- **Retraining automatique** si data drift détecté

### Contraintes
- Latence de la recommandation en prod : **< 50ms (P99)**
- Modèle en prod doit être **challengé toutes les 2 semaines**
- Rollback < 5 minutes si dégradation des métriques
- Gouvernance des données : **lineage** traçable de la donnée brute au modèle

### Livrables attendus
Pipeline end-to-end depuis les sources de données jusqu'au monitoring du modèle en production.

### Critères de réussite
✅ Flux de données source → feature store représenté  
✅ Boucle d'entraînement avec registry visible  
✅ Stratégie de déploiement A/B définie  
✅ Monitoring data drift + model decay présent  
✅ Boucle de retraining automatique représentée  
`,
    isDuelEnabled: false,
    duelTimeLimit: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CODE CHALLENGES
// ─────────────────────────────────────────────────────────────────────────────

const codeChallenges: ChallengePayload[] = [
  {
    title: 'Somme de A + B',
    kind: 'CODE',
    difficulty: 'easy',
    status: 'published',
    category: 'math',
    tags: ['math', 'beginner', 'input-output'],
    allowedLanguages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c'],
    tests: [
      { input: '1 2',   expectedOutput: '3',  isHidden: false },
      { input: '10 20', expectedOutput: '30', isHidden: false },
      { input: '-5 8',  expectedOutput: '3',  isHidden: true  },
      { input: '0 0',   expectedOutput: '0',  isHidden: true  },
    ],
    examples: [
      {
        input: '3 4',
        output: '7',
        explanation: 'La somme de 3 et 4 est 7.',
      },
      {
        input: '-2 5',
        output: '3',
        explanation: 'La somme de -2 et 5 est 3.',
      },
    ],
    assets: [],
    hints: [
      "Lisez deux entiers depuis l'entrée standard.",
      'Affichez uniquement leur somme.',
      'Attention au format exact de la sortie (pas de texte en plus).',
    ],
    constraints: {
      timeLimitMs: 1000,
      memoryLimitMb: 128,
      valueRange: '-10^9 <= A, B <= 10^9',
    },
    descriptionMd: `## Somme de A + B

Étant donnés deux entiers **A** et **B**, affichez leur somme.

### Entrée
Une seule ligne contenant deux entiers séparés par un espace.

### Sortie
Un seul entier : **A + B**.

### Contraintes
-10^9 <= A, B <= 10^9

### Exemple
Entrée : \`3 4\`  
Sortie : \`7\`
`,
    isDuelEnabled: true,
    duelTimeLimit: 10,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

async function seedChallenges(
  label: string,
  challenges: ChallengePayload[],
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const challenge of challenges) {
    const existing = await prisma.challenge.findFirst({
      where: {
        title: challenge.title,
        // ✅ already typed as ChallengeKind — no cast needed
        kind: challenge.kind,
      },
    });

    if (existing) {
      console.log(`  ⏭️  Déjà existant : "${challenge.title}"`);
      skipped++;
      continue;
    }

    await prisma.challenge.create({ data: challenge });
    console.log(`  ✅ Créé : "${challenge.title}" [${challenge.difficulty}]`);
    created++;
  }

  console.log(`\n📊 Résumé ${label} :`);
  console.log(`   ✅ Créés   : ${created}`);
  console.log(`   ⏭️  Ignorés : ${skipped} (déjà en base)`);
  console.log(`   📦 Total   : ${created + skipped} / ${challenges.length}`);

  return { created, skipped };
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🌱 Seeding Challenges...\n');

  console.log('🎨 CANVAS challenges\n' + '─'.repeat(40));
  await seedChallenges('CANVAS', canvasChallenges);

  console.log('\n💻 CODE challenges\n' + '─'.repeat(40));
  await seedChallenges('CODE', codeChallenges);

  const totalCanvas = await prisma.challenge.count({ where: { kind: 'CANVAS' } });
  const totalCode   = await prisma.challenge.count({ where: { kind: 'CODE'   } });

  console.log('\n' + '─'.repeat(40));
  console.log(`🎨 Challenges CANVAS en base : ${totalCanvas}`);
  console.log(`💻 Challenges CODE en base   : ${totalCode}`);
}

main()
  .catch((err) => {
    console.error('❌ Erreur seed :', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());