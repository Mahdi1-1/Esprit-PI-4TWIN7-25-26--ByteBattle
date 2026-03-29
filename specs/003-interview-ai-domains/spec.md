# Feature Specification: Interview AI — Professional Domain Restructure

**Feature Branch**: `003-interview-ai-domains`  
**Created**: 2026-03-25  
**Status**: Draft  
**Input**: User description: "Restructurer le système d'Interview AI pour catégoriser les sujets par domaine professionnel avec des niveaux de difficulté et un choix de langue."

## User Scenarios & Testing

### User Story 1 — Domain & Difficulty Selection Screen (Priority: P1)

A user navigates to the AI Interview page and is presented with a visual selection screen. They first choose a **professional domain** (e.g. Cloud Computing, Cybersecurity) from a grid of illustrated cards, then select a **difficulty level** (Easy / Medium / Hard) with a clear description of what each level entails, and finally choose the **interview language** (French or English). The estimated interview duration is displayed before they press "Start Interview".

**Why this priority**: This is the entry point of the entire interview experience. Without this selection flow, no domain-specific interview can take place.

**Independent Test**: Can be tested by navigating to the Interview AI page and verifying the 3-step selection flow renders correctly, allows all choices, and displays the estimated duration.

**Acceptance Scenarios**:

1. **Given** the user is on the Interview AI page, **When** they land on the setup view, **Then** they see 8 domain cards (Cloud Computing, Software Engineering, Cybersecurity, Data Science & AI/ML, Frontend Engineering, Backend Engineering, DevOps & SRE, Mobile Development) displayed with distinct icons and labels.
2. **Given** the user has selected a domain, **When** they view difficulty options, **Then** they see 3 levels (Easy, Medium, Hard) each with a description of target experience level and estimated duration (Easy ~15 min, Medium ~25 min, Hard ~40 min).
3. **Given** the user has selected domain and difficulty, **When** they view language options, **Then** they can choose between Français and English.
4. **Given** all three choices are made, **When** they press "Start Interview", **Then** a new interview session is created with the selected parameters.

---

### User Story 2 — Realistic AI Interviewer Behavior (Priority: P1)

Once the interview starts, the AI behaves like a real professional interviewer. It introduces itself with a relevant job context (e.g. "Hello, I'm your interviewer for this Cloud Engineer position…"), asks open-ended questions specific to the chosen domain and difficulty, adapts follow-up questions based on the candidate's answers, asks for concrete examples from experience, and alternates between technical and behavioral questions. The AI communicates exclusively in the language selected by the user.

**Why this priority**: The core value proposition of the feature — a realistic, domain-specific interview experience — depends on this behavior.

**Independent Test**: Start an interview with any domain/difficulty/language combination and verify the AI's introductory message, the relevance of the first few questions, and the language used.

**Acceptance Scenarios**:

1. **Given** the user starts a Cloud Computing / Hard / English interview, **When** the first message appears, **Then** the AI introduces itself as an interviewer for a senior cloud engineering position and asks an appropriate first question.
2. **Given** the user answers a question, **When** the AI replies, **Then** it asks a contextual follow-up question that probes deeper into the user's answer.
3. **Given** the difficulty is Easy, **When** the user is stuck, **Then** the AI provides hints and guides the user pedagogically.
4. **Given** the difficulty is Hard, **When** the user gives a surface-level answer, **Then** the AI challenges the answer and asks for justifications and trade-offs.
5. **Given** the language is set to "Français", **When** the AI generates any message, **Then** all AI text is in French regardless of the language the user types in.

---

### User Story 3 — Interview Scoring & Report (Priority: P2)

At the end of the interview (after a configurable number of questions: ~8 for Easy, ~10 for Medium, ~12 for Hard), the AI provides a comprehensive evaluation report containing: an overall score out of 100, per-competency scores, identified strengths, improvement areas with recommended resources, and a hiring verdict (Hire / Maybe / No Hire). The user can save and revisit this report later.

**Why this priority**: Actionable, structured feedback is the key differentiator from a generic chat. However, the interview flow itself (P1) must work first.

**Independent Test**: Complete an entire interview and verify the review screen displays all scoring components and a hiring verdict.

**Acceptance Scenarios**:

1. **Given** the user has completed 8+ questions in an Easy interview, **When** the interview ends, **Then** a review screen is displayed with an overall score, per-competency breakdown, strengths, improvements, and a verdict.
2. **Given** the review screen is displayed, **When** the user checks the verdict, **Then** it shows one of exactly three values: "Hire", "Maybe", or "No Hire".
3. **Given** a completed interview exists, **When** the user navigates to past sessions, **Then** they can view the saved report.

---

### User Story 4 — Domain-Specific Question Bank (Priority: P2)

Each domain has a structured set of topics that the AI draws from. The AI selects question topics appropriate to the domain and difficulty, ensuring breadth across the domain's sub-topics rather than focusing on a single area.

**Why this priority**: Provides realistic, comprehensive coverage simulating a real interviewer who covers multiple aspects of a domain.

**Independent Test**: Run interviews in multiple domains and verify that questions cover different sub-topics within each domain.

**Acceptance Scenarios**:

1. **Given** a "Software Engineering / Medium" interview, **When** 10 questions are asked, **Then** they span at least 3 distinct sub-topics (e.g. Design Patterns, System Design, API Design).
2. **Given** a "Cybersecurity / Easy" interview, **When** questions are asked, **Then** they cover foundational topics (OWASP, basic cryptography, IAM) at a junior-appropriate level.
3. **Given** a "DevOps & SRE / Hard" interview, **When** questions are asked, **Then** they include system design scenarios, incident management, and SLI/SLO/SLA trade-offs.

---

### User Story 5 — Behavioral/STAR Questions at Higher Levels (Priority: P3)

For Medium and Hard difficulty levels, the AI incorporates behavioral questions using the STAR method (Situation, Task, Action, Result). At Hard difficulty, the AI also includes leadership and conflict resolution questions.

**Why this priority**: Adds realism to the senior interview simulation but is not required for the core technical interview experience.

**Independent Test**: Run a Hard interview and verify at least one behavioral STAR question and one leadership question appear.

**Acceptance Scenarios**:

1. **Given** a Hard difficulty interview, **When** after several technical questions, **Then** the AI asks a behavioral question prefaced with STAR guidance ("Tell me about a time when…").
2. **Given** a Medium difficulty interview, **When** 10 questions complete, **Then** at least 1 behavioral question has been asked.
3. **Given** an Easy difficulty interview, **When** the interview completes, **Then** no behavioral questions are asked (focus is purely on knowledge).

---

### Edge Cases

- What happens when the user tries to start an interview without selecting all 3 parameters (domain, difficulty, language)? → The "Start Interview" button remains disabled.
- How does the system handle the user switching languages mid-interview? → The AI maintains the initially selected language.
- What if the user ends the interview early (before the minimum number of questions)? → The system generates a partial report clearly indicating it's based on incomplete data.
- What happens if the AI generates a question outside the chosen domain? → The prompt engineering ensures domain-specific constraints; if detected, the system regenerates the question.

## Requirements

### Functional Requirements

- **FR-001**: System MUST present 8 professional interview domains as selectable options on the setup screen.
- **FR-002**: System MUST offer 3 difficulty levels (Easy, Medium, Hard) with descriptions of target experience level.
- **FR-003**: System MUST allow the user to choose an interview language (Français or English) before starting.
- **FR-004**: System MUST display the estimated interview duration based on the selected difficulty.
- **FR-005**: System MUST disable the "Start Interview" button until all 3 selections are made.
- **FR-006**: The AI interviewer MUST introduce itself with a role and job context relevant to the selected domain.
- **FR-007**: The AI MUST ask open-ended questions (not multiple choice) specific to the selected domain and difficulty.
- **FR-008**: The AI MUST generate follow-up questions based on the candidate's previous answers.
- **FR-009**: At Easy difficulty, the AI MUST provide hints and pedagogical guidance when the user is stuck.
- **FR-010**: At Hard difficulty, the AI MUST challenge surface-level answers and request trade-off analysis.
- **FR-011**: The AI MUST communicate exclusively in the language selected by the user.
- **FR-012**: The AI MUST alternate between technical and situational/behavioral questions (Medium and Hard).
- **FR-013**: At interview end, the system MUST generate an overall score out of 100.
- **FR-014**: The scoring report MUST include per-competency breakdown, strengths, improvements, and a verdict (Hire / Maybe / No Hire).
- **FR-015**: Each interview MUST target a specific number of questions based on difficulty (~8 Easy, ~10 Medium, ~12 Hard).
- **FR-016**: Questions MUST cover at least 3 distinct sub-topics of the chosen domain within a single interview session.
- **FR-017**: The end-of-interview report MUST be persistable and viewable from past sessions.
- **FR-018**: At Hard difficulty, the interview MUST include at least one behavioral STAR question.
- **FR-019**: The system MUST close the interview with "Do you have any questions?" (in the selected language), simulating a real interview ending.

### Key Entities

- **InterviewDomain**: Represents one of the 8 professional domains (Cloud Computing, Software Engineering, etc.) with an icon, label, list of sub-topics, and description.
- **DifficultyLevel**: Represents Easy, Medium, or Hard with associated target experience range, estimated duration, and question count.
- **InterviewSession**: An active or completed interview, linked to a user, domain, difficulty, language, list of messages, and an optional scoring report.
- **InterviewReport**: The post-interview evaluation containing overall score, per-competency scores, strengths, improvements, recommended resources, and a hiring verdict.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can complete the full selection flow (domain → difficulty → language → start) in under 30 seconds.
- **SC-002**: 90% of AI-generated questions are relevant to the selected domain and sub-topics, as validated by user sampling.
- **SC-003**: AI responses are consistently in the user-selected language throughout the entire interview.
- **SC-004**: Interview sessions complete with a structured report containing all required sections (score, competencies, verdict) 100% of the time.
- **SC-005**: Users can retrieve and view past interview reports within 2 clicks.
- **SC-006**: The AI asks follow-up questions (not just new topics) for at least 30% of its turns.

## Assumptions

- The existing AI Interview module (with text and voice messaging) will be reused and extended, not rebuilt from scratch.
- The current AI provider (Google Generative AI) supports the prompt engineering needed for domain-specific and language-specific interview behavior.
- The 8 domains and their sub-topics are fixed for this initial release. Adding new domains is out of scope for v1.
- The scoring logic will be driven by the AI's evaluation of the conversation (prompt-based), not by a separate scoring algorithm.
- The existing `InterviewSession` data model will be extended with new fields (domain, difficulty, language, verdict) rather than replaced.
- Mobile-responsive design for the selection screen is expected but native mobile app support is out of scope.
