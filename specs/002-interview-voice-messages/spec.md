# Feature Specification: Interview AI Voice Messages

**Feature Branch**: `002-interview-voice-messages`  
**Created**: 2026-03-25  
**Status**: Draft  
**Input**: User description: "Ajouter le support des messages vocaux bidirectionnels dans le module Interview AI de ByteBattle2"

## User Scenarios & Testing

### User Story 1 — Envoyer un message vocal à l'IA (Speech-to-Text) (Priority: P1)

L'utilisateur est en session d'interview AI et souhaite répondre vocalement plutôt qu'en tapant du texte. Il clique sur un bouton microphone, enregistre sa réponse avec un retour visuel (onde sonore + compteur de temps), puis arrête l'enregistrement. L'audio est envoyé au serveur, transcrit en texte, et le texte transcrit apparaît dans le chat comme un message utilisateur normal (avec une icône micro indiquant l'origine vocale). L'IA répond ensuite normalement à ce texte.

**Why this priority**: C'est le flux principal demandé — sans la capture audio et la transcription, aucune interaction vocale n'est possible. C'est la brique fondamentale du MVP.

**Independent Test**: Ouvrir une session d'interview AI, cliquer sur le micro, parler pendant quelques secondes, arrêter l'enregistrement. Vérifier que le texte transcrit apparaît dans le chat et que l'IA répond.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est dans une session d'interview AI active, **When** il clique sur le bouton micro et parle pendant 5 secondes, puis clique à nouveau pour stopper, **Then** un spinner "Transcription en cours..." s'affiche, puis le texte transcrit apparaît comme message utilisateur avec une icône micro, et l'IA génère une réponse textuelle.
2. **Given** l'utilisateur enregistre un message vocal, **When** l'enregistrement dépasse 120 secondes, **Then** l'enregistrement s'arrête automatiquement et le message est envoyé.
3. **Given** l'utilisateur est en train d'enregistrer, **When** il voit l'animation d'onde sonore, **Then** l'animation réagit en temps réel au volume du micro.
4. **Given** le téléchargement audio échoue (erreur réseau), **When** la transcription est impossible, **Then** un message d'erreur s'affiche et l'utilisateur peut réessayer.
5. **Given** l'utilisateur n'a pas autorisé l'accès au micro, **When** il clique sur le bouton micro, **Then** un message l'invite à autoriser le micro dans les paramètres du navigateur.

---

### User Story 2 — Écouter les réponses IA en audio (Text-to-Speech) (Priority: P1)

Après que l'IA a répondu textuellement dans le chat, un bouton lecture (▶) apparaît à côté de chaque message IA. En cliquant dessus, la réponse est lue à voix haute avec une voix naturelle. L'utilisateur peut aussi activer la lecture automatique dans les préférences pour que chaque nouvelle réponse IA soit lue automatiquement.

**Why this priority**: Complète le flux bidirectionnel — sans le TTS l'expérience vocale est à sens unique, ce qui limite fortement l'intérêt de la fonctionnalité.

**Independent Test**: Envoyer un message texte dans le chat, attendre la réponse IA, puis cliquer sur le bouton ▶ à côté du message IA. Vérifier que l'audio est joué avec une voix naturelle.

**Acceptance Scenarios**:

1. **Given** un message IA est affiché dans le chat, **When** l'utilisateur clique sur le bouton ▶, **Then** le texte du message est lu à voix haute, et le bouton passe en état "lecture en cours" (icône ⏸).
2. **Given** l'audio d'un message est en cours de lecture, **When** l'utilisateur clique sur ⏸, **Then** la lecture s'arrête.
3. **Given** l'utilisateur a activé l'option "lecture automatique", **When** l'IA génère une nouvelle réponse, **Then** l'audio démarre automatiquement après l'affichage du texte.
4. **Given** l'audio du message n'a pas encore été généré, **When** l'utilisateur clique sur ▶, **Then** un indicateur de chargement s'affiche le temps que l'audio soit généré par le serveur, puis la lecture démarre.

---

### User Story 3 — Coexistence messages vocaux et texte (Priority: P2)

Les messages vocaux et les messages texte coexistent dans le même fil de conversation. Les messages vocaux de l'utilisateur affichent le texte transcrit avec une icône micro et un mini lecteur audio pour réécouter l'enregistrement original. L'utilisateur peut librement alterner entre saisie texte et saisie vocale.

**Why this priority**: Améliore l'expérience utilisateur mais n'est pas strictement nécessaire pour un premier MVP vocal fonctionnel.

**Independent Test**: Dans une même session, envoyer alternativement des messages texte et vocaux. Vérifier que chaque type est correctement affiché et distinguable.

**Acceptance Scenarios**:

1. **Given** un mix de messages texte et vocaux dans le chat, **When** l'utilisateur scroll dans la conversation, **Then** les messages vocaux sont visuellement distingués (icône micro) des messages texte, tout en restant dans un fil chronologique unique.
2. **Given** un message vocal utilisateur est affiché, **When** l'utilisateur clique sur le lecteur audio intégré au message, **Then** l'enregistrement original est joué.

---

### User Story 4 — Prévisualisation et correction avant envoi (Priority: P3)

Après la transcription d'un message vocal, le texte transcrit est montré à l'utilisateur avec les options "Envoyer" et "Réenregistrer". L'utilisateur peut aussi éditer le texte avant envoi.

**Why this priority**: Fonctionnalité de confort qui améliore la précision des échanges mais qui n'est pas bloquante pour l'interaction vocale de base.

**Independent Test**: Enregistrer un message vocal, vérifier que le mode prévisualisation s'affiche, modifier le texte, puis envoyer. Vérifier que le texte modifié est celui utilisé comme prompt IA.

**Acceptance Scenarios**:

1. **Given** l'utilisateur a terminé un enregistrement vocal, **When** la transcription est achevée, **Then** le texte transcrit s'affiche dans une zone de prévisualisation avec les boutons "Envoyer" et "Réenregistrer".
2. **Given** l'utilisateur est en mode prévisualisation, **When** il modifie le texte et clique "Envoyer", **Then** le texte modifié est envoyé comme prompt à l'IA (pas le texte original).
3. **Given** l'utilisateur clique "Réenregistrer", **When** le micro se réactive, **Then** le texte transcrit précédent est effacé et un nouvel enregistrement démarre.

---

### Edge Cases

- Que se passe-t-il si le navigateur ne supporte pas l'API MediaRecorder (ancien navigateur) ?
  → Le bouton micro est masqué et un tooltip "Votre navigateur ne supporte pas l'enregistrement audio" s'affiche.
- Que se passe-t-il si l'utilisateur enregistre dans un environnement très bruyant et la transcription est vide ?
  → Un message indique "Transcription vide — veuillez réessayer dans un environnement plus calme".
- Que se passe-t-il si le réseau est coupé pendant l'envoi de l'audio ?
  → L'audio est conservé localement, un message d'échec s'affiche avec un bouton "Réessayer".
- Que se passe-t-il si l'utilisateur n'a plus de tokens ?
  → Le bouton micro est désactivé et un message invite à passer premium.
- Que se passe-t-il si le fichier audio dépasse la limite de taille (10 Mo) ?
  → L'enregistrement est stoppé avec un message d'avertissement.

## Requirements

### Functional Requirements

- **FR-001**: Le système DOIT permettre aux utilisateurs d'enregistrer un message vocal depuis le navigateur (max 120 secondes) pendant une session d'interview AI.
- **FR-002**: Le système DOIT afficher un retour visuel en temps réel pendant l'enregistrement : animation d'onde sonore réactive au volume et compteur de temps écoulé.
- **FR-003**: Le système DOIT transcrire l'audio utilisateur en texte (Speech-to-Text) en supportant le français et l'anglais.
- **FR-004**: Le système DOIT afficher le texte transcrit dans le chat comme un message utilisateur, identifié visuellement comme étant d'origine vocale (icône micro).
- **FR-005**: Le système DOIT envoyer le texte transcrit à l'IA comme prompt et afficher la réponse textuelle normalement.
- **FR-006**: Le système DOIT fournir un bouton lecture (▶) à côté de chaque message IA pour déclencher une lecture Text-to-Speech à voix naturelle.
- **FR-007**: Le système DOIT proposer une option de lecture automatique des réponses IA (activable/désactivable par l'utilisateur).
- **FR-008**: Le système DOIT permettre aux messages vocaux et texte de coexister dans le même fil de conversation, sans rupture visuelle.
- **FR-009**: Le système DOIT proposer un mode prévisualisation optionnel permettant de voir le texte transcrit avant de l'envoyer, avec des actions "Envoyer", "Modifier" et "Réenregistrer".
- **FR-010**: Le système DOIT supprimer les fichiers audio temporaires après traitement — aucun stockage permanent de l'audio brut.
- **FR-011**: Le système DOIT gérer les cas d'erreur : micro non autorisé, navigateur non compatible, transcription vide, perte réseau, tokens épuisés, dépassement de durée.
- **FR-012**: Le système DOIT déduire 2 tokens par message vocal (1 pour STT + 1 pour TTS) pour les utilisateurs non-premium.

### Key Entities

- **Voice Message**: Un message de type vocal contenant la transcription texte, un marqueur `isVoice`, le niveau de confiance de la transcription, et potentiellement une URL audio temporaire.
- **Audio Playback State**: L'état de lecture côté client (idle, loading, playing, paused) pour chaque message IA ayant un audio disponible.
- **Recording State**: L'état d'enregistrement micro côté client (idle, recording, processing, preview).

## Success Criteria

### Measurable Outcomes

- **SC-001**: L'utilisateur peut envoyer un message vocal et voir la transcription textuelle dans le chat en moins de 5 secondes pour un enregistrement de 30 secondes.
- **SC-002**: 95% des transcriptions en français et anglais dans un environnement calme sont compréhensibles sans modification manuelle.
- **SC-003**: L'utilisateur peut écouter la réponse IA via le bouton ▶ dans les 3 secondes après le clic (temps de chargement TTS inclus).
- **SC-004**: Le système gère 100% des cas d'erreur identifiés (micro refusé, navigateur incompatible, réseau coupé) avec un message utilisateur clair, sans écran blanc ou erreur non gérée.
- **SC-005**: Les messages vocaux et texte coexistent visuellement dans le chat sans confusion — chaque type est immédiatement identifiable.
- **SC-006**: L'enregistrement s'arrête automatiquement à 120 secondes et envoie le message sans perte de contenu.

## Assumptions

- Les utilisateurs disposent d'un microphone fonctionnel et utilisent un navigateur moderne supportant l'API MediaRecorder (Chrome, Firefox, Edge, Safari récent).
- L'enregistrement audio se fait au format WebM (Opus) — format natif du navigateur.
- Le module `VoiceService` backend existant gère déjà les appels STT et TTS vers un provider cloud (Google Cloud Speech / TTS). La présente spécification ne modifie pas le provider.
- Les endpoints backend `POST /:id/voice` et `GET /:id/messages/:index/audio` existent déjà — la spécification concerne principalement l'intégration frontend (enregistrement, UI, états, lecture audio).
- Les utilisateurs ont une connexion internet stable pour le transfert d'audio (typiquement < 1 Mo pour 2 minutes en WebM/Opus).
- La session d'interview doit être active (`status: 'active'`) pour envoyer des messages vocaux.
