# 📱 ByteBattle Mobile App

Bienvenue dans l'application mobile ByteBattle ! Cette application permet de retrouver toute l'expérience de ByteBattle directement sur smartphone (iOS/Android) ainsi que sur le web via `react-native-web`.

## 🚀 Technologies Utilisées
- **Framework** : React Native via **Expo** (Managed workflow / Prebuild)
- **Routing** : Expo Router (File-based routing)
- **Appels API** : Axios avec intercepteurs pour JWT
- **State Management & Cache** : Zustand (State global) & TanStack React Query (Cache réseau performant)
- **UI / Styling** : Style natif respectant le Thème "Cyber Dark" extrait du frontend (Fonts: Orbitron, Rajdhani)

## 🏗 Structure du projet
```
mobile/
├── app/                  # Routing par dossier (Expo Router)
│   ├── (auth)/           # Pages de connexion/inscription
│   ├── (tabs)/           # Layout principal (Hub, Battles, Arena, Leaderboard, Profil, More)
│   └── index.tsx         # Point d'entrée de l'App (Landing)
├── src/
│   ├── api/              # Fichiers de configuration HTTP (Axios interceptors)
│   ├── constants/        # Thèmes et configurations globales
│   ├── services/         # Fonctions d'appels à NestJS (Challenges, Socket, etc)
│   └── store/            # État global Zustand (Auth)
```

## 🔧 Installation & Lancement

1. S'assurer d'avoir **pnpm** installé au niveau du système.
2. Installer les dépendances :
   ```bash
   cd mobile
   pnpm install
   ```
3. Lancer l'application :
   ```bash
   pnpm start     # Démarre Metro bundler et affiche le QR Code pour l'App Expo Go
   pnpm web       # Lance la version Web directement dans le navigateur
   pnpm android   # Lance l'Emulateur Android (si ouvert)
   ```

## 🌐 Variables d'Environnement
- **`EXPO_PUBLIC_API_URL`** : L'URL racine de votre API backend.
*Remarque : Par défaut, l'application tentera de pointer vers `http://localhost:4001/api`. (Ceci fonctionnera lors des tests Web, mais pour de vrais tests sur Smartphone, il faut absolument utiliser l'adresse IP locale stricte de l'ordinateur à la place).*
