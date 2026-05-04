# 📈 Suivi d'Avancement : ByteBattle Mobile

Ce document retrace la progression du développement de l'application mobile ByteBattle. Il permet à l'équipe de se synchroniser sur les fonctionnalités converties, ou restant à développer depuis le frontend Web.

---

## ✅ Phase 1 : Initialisation & Architecture de Base (Complété)
- [x] Génération du projet natif Expo avec l'outil de gestion de paquets `pnpm`.
- [x] Configuration d'**Expo Router** (navigation moderne et typée par url de fichiers).
- [x] Sécurisation des fondations d'architecture d'État (Axios, Zustand, React Query installés).
- [x] Ajout des polices personnalisées depuis Google Fonts (`Orbitron`, `Rajdhani`) avec chargement sécurisé conditionnant le splash screen.
- [x] Extraction de l'identité visuelle du web (Système de themerie CSS avec le thème _Cyber Dark_) vers un objet Javascript Typé stricte : `src/constants/Theme.ts`.

## ✅ Phase 2 : Routing & Wireframes (Complété)
- [x] Mise en place du layout racine (`app/_layout.tsx`).
- [x] Mise en place d'une structure "Tabs" native adaptée au mobile :
   - `HUB` (Accueil / Actualités)
   - `BATTLES` (Liste des problèmes algorithmiques)
   - `ARENA` (Matchmaking de duels Socket.IO)
   - `PROFILE` (Statistiques du joueur)
   - `RANKS` (Leaderboard centralisé)
   - `MORE` (Menu déroulant pour toutes les autres ressources applicatives)
- [x] **Scaffolding automatique et complet** par script des 50+ routes orphelines recencées dans le router React.js du Web (Hackathons, Canvas, AI, Admin, Company), implémentées sous forme d'écrans de chargement génériques prêts à la programmation.

## ✅ Phase 3 : Connexion Backend & Data (En cours)
- [x] Création et configuration d'un connecteur réseau intelligent (`axiosClient.ts`) ciblant l'instance NestJS (sur le port 4001).
- [x] Implémentation du service `challengesService.ts` respectant ses stricts analogues Web.
- [x] Câblage réussi de la page `BATTLES` et appel des Data via `useQuery` offrant caching complet et retries automatiques face aux micro-coupures réseau.
- [ ] Connecter le flux d'authentification Auth réel (POST Login, sauvegarde Locale du flux JWT en base Cryptée `SecureStore`).
- [ ] Refléter les données privées de profil.

## 🔮 Phase 4 : Intégrations Complexes (Idées / À Prévoir)
- [ ] **WebSockets** : Requalifier l'App avec `socket.io-client` en lui injectant JWT pour créer des rooms de jeu multijoueurs.
- [ ] **Code Editor** : Implémenter une zone de rédaction de code abordable sur Mobile (Ex: Ace Editor React Native).
- [ ] **Push Notifications** : Lier `expo-notifications` à NestJS pour prévenir sur les téléphones des demandes de duel ou débuts d'Hackathons.
