import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  direction: 'ltr' | 'rtl';
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionaries
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Auth
    'auth.login.title': 'Sign in to your account',
    'auth.login.email': 'Email',
    'auth.login.password': 'Password',
    'auth.login.remember': 'Remember me',
    'auth.login.forgot': 'Forgot password?',
    'auth.login.signin': 'Sign In',
    'auth.login.signup': 'Sign up',
    'auth.login.noaccount': "Don't have an account?",
    'auth.login.orcontinue': 'or continue with',

    // Navigation
    'nav.problems': 'Problems',
    'nav.canvas': 'Canvas',
    'nav.drawing': 'Sketchpad',
    'nav.duel': 'Duel',
    'nav.hackathon': 'Hackathon',
    'nav.leaderboard': 'Leaderboard',
    'nav.themes': 'Themes',
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.login': 'Login',
    'nav.signup': 'Sign Up',
    'nav.discussion': 'Forum',
    'nav.visualizer': 'Visualizer',
    'nav.dataStructures': 'Data Structures',
    'nav.interview': 'Interview',

    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.quickduel': 'Quick Duel',
    'dashboard.quickduel.desc': 'Challenge an opponent',
    'dashboard.solo': 'Solo Mode',
    'dashboard.solo.desc': 'Solve problems',
    'dashboard.hackathon': 'Hackathon',
    'dashboard.hackathon.desc': 'Join a team',
    'dashboard.recommended': 'Recommended Problems',
    'dashboard.viewall': 'View All',
    'dashboard.recent': 'Recent Matches',
    'dashboard.history': 'History',
    'dashboard.skills': 'Skills',
    'dashboard.badges': 'Recent Badges',
    'dashboard.unlock': 'Unlock new themes',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.back': 'Back',

    // Settings
    'settings.title': 'Settings',
    'settings.profile': 'Profile',
    'settings.notifications': 'Notifications',
    'settings.security': 'Security',
    'settings.appearance': 'Appearance',
    'settings.preferences': 'Preferences',
    'settings.language': 'Language',
    'settings.dangerzone': 'Danger Zone',

    // Settings - Profile Photo
    'settings.profile.photo': 'Profile Photo',
    'settings.profile.photo.change': 'Change Photo',
    'settings.profile.photo.remove': 'Remove Photo',
    'settings.profile.photo.upload': 'Upload Photo',
    'settings.profile.photo.uploading': 'Uploading...',
    'settings.profile.photo.success': 'Photo updated successfully',
    'settings.profile.photo.removed': 'Photo removed',
    'settings.profile.photo.error': 'Failed to update photo',
    'settings.profile.photo.invalid': 'Please select a valid image file (JPG, PNG, or WebP)',
    'settings.profile.photo.tooLarge': 'File is too large. Maximum size is 5MB.',

    // Settings - Bio
    'settings.profile.bio': 'Bio',
    'settings.profile.bio.placeholder': 'Tell us about yourself...',
    'settings.profile.bio.charCount': '{count}/250 characters',

    // Settings - Security
    'settings.security.password': 'Password',
    'settings.security.password.current': 'Current Password',
    'settings.security.password.new': 'New Password',
    'settings.security.password.confirm': 'Confirm New Password',
    'settings.security.password.change': 'Change Password',
    'settings.security.password.success': 'Password changed successfully',
    'settings.security.password.error': 'Failed to change password',
    'settings.security.password.incorrect': 'Current password is incorrect',
    'settings.security.password.mismatch': 'Passwords do not match',
    'settings.security.password.weak': 'Password is too weak',
    'settings.security.password.oauth': 'Password managed by Google',
    'settings.security.password.oauthDesc': 'You signed up with Google. Password changes are not available.',

    // Settings - Email
    'settings.account.email': 'Email Address',
    'settings.account.email.current': 'Current Email',
    'settings.account.email.new': 'New Email',
    'settings.account.email.change': 'Change Email',
    'settings.account.email.success': 'Email changed successfully',
    'settings.account.email.error': 'Failed to change email',
    'settings.account.email.inUse': 'This email is already in use',
    'settings.account.email.invalid': 'Please enter a valid email address',
    'settings.account.email.oauth': 'Email managed by Google',
    'settings.account.email.oauthDesc': 'You signed up with Google. Email changes are not available.',

    // Settings - Editor Theme
    'settings.preferences.editorTheme': 'Code Editor Theme',
    'settings.preferences.editorTheme.desc': 'Choose the color theme for code editors',
    'settings.preferences.editorTheme.preview': 'Preview',

    // Settings - Danger Zone
    'settings.dangerzone.title': 'Danger Zone',
    'settings.dangerzone.delete': 'Delete Account',
    'settings.dangerzone.delete.desc': 'Permanently delete your account and all associated data',
    'settings.dangerzone.delete.warning': 'This action cannot be undone',
    'settings.dangerzone.delete.confirm': 'Type DELETE to confirm',
    'settings.dangerzone.delete.success': 'Account deleted successfully',
    'settings.dangerzone.delete.error': 'Failed to delete account',

    // Profile Stats
    'profile.stats.title': 'Statistics',
    'profile.stats.elo': 'ELO Rating',
    'profile.stats.xp': 'Experience Points',
    'profile.stats.level': 'Level',
    'profile.stats.duelsWon': 'Duels Won',
    'profile.stats.duelsLost': 'Duels Lost',
    'profile.stats.duelsTotal': 'Total Duels',
    'profile.stats.winRate': 'Win Rate',
    'profile.stats.challengesSolved': 'Challenges Solved',
    'profile.stats.forumPosts': 'Forum Posts',
    'profile.stats.comments': 'Comments',
    'profile.stats.leaderboard': 'Leaderboard Position',
    'profile.stats.joined': 'Member Since',
    'profile.stats.lastLogin': 'Last Login',

    // Discussion Forum
    'discussion.title': 'Discussion Forum',
    'discussion.subtitle': 'Ask questions, share knowledge, and connect with the community',
    'discussion.newPost': 'New Post',
    'discussion.totalPosts': 'Total Posts',
    'discussion.activeUsers': 'Active Users',
    'discussion.solvedThreads': 'Solved Threads',
    'discussion.thisWeek': 'This Week',
    'discussion.categories': 'Categories',
    'discussion.allPosts': 'All Posts',
    'discussion.popularTags': 'Popular Tags',
    'discussion.searchPlaceholder': 'Search discussions...',
    'discussion.trending': 'Trending',
    'discussion.newest': 'Newest',
    'discussion.mostVoted': 'Most Voted',
    'discussion.noResults': 'No discussions found',
    'discussion.comments': 'Comments',
    'discussion.writeComment': 'Write a comment...',
    'discussion.postComment': 'Post Comment',
    'discussion.noComments': 'No comments yet. Be the first to reply!',
    'discussion.notFound': 'Discussion not found',
    'discussion.backToForum': 'Back to Forum',

    // Algorithm Visualizer
    'visualizer.title': 'Algorithm Visualizer',
    'visualizer.subtitle': 'Watch algorithms come to life with interactive animations',
    'visualizer.sorting': 'Sorting',
    'visualizer.searching': 'Searching',
    'visualizer.graph': 'Graph',
    'visualizer.algorithms': 'Algorithms',
    'visualizer.complexity': 'Complexity',
    'visualizer.pseudocode': 'Pseudocode',
    'visualizer.speed': 'Speed',
    'visualizer.size': 'Size',

    // AI Mock Interview
    'interview.title': 'AI Mock Interview',
    'interview.subtitle': 'Practice technical interviews with our AI interviewer. Get real-time feedback and improve your skills.',
    'interview.totalSessions': 'Total Sessions',
    'interview.avgScore': 'Avg Score',
    'interview.bestScore': 'Best Score',
    'interview.streak': 'Streak',
    'interview.selectTopic': 'Select Topic',
    'interview.selectDomain': 'Select Domain',
    'interview.selectDifficulty': 'Select Difficulty',
    'interview.selectLanguage': 'Select Interview Language',
    'interview.startInterview': 'Start Interview',
    'interview.pastSessions': 'Past Sessions',
    'interview.end': 'End Interview',
    'interview.typePlaceholder': 'Type your answer... (Shift+Enter for new line)',
    'interview.tips': 'Interview Tips',
    'interview.quickActions': 'Quick Actions',
    'interview.backToSetup': 'Back to Setup',
    'interview.reviewTitle': 'Interview Performance Review',
    'interview.overallScore': 'Overall Score',
    'interview.technical': 'Technical',
    'interview.communication': 'Communication',
    'interview.problemSolving': 'Problem Solving',
    'interview.strengths': 'Strengths',
    'interview.improvements': 'Areas for Improvement',
    'interview.recommendation': 'Recommendation',
    'interview.newSession': 'Start New Session',
    'interview.error.insufficientTokens': 'Insufficient AI tokens to start the interview. Please purchase more tokens or wait for your balance to replenish.',
    'interview.error.failed': 'Failed to start the interview. Please try again later.',

    // Sketchpad
    'sketchpad.new': 'New Canvas',
    'sketchpad.myDrawings': 'My Drawings',
    'sketchpad.noDrawings': 'No saved drawings yet',
    'sketchpad.startDrawing': 'Start drawing and save your work to see it here',
    'sketchpad.open': 'Open',
    'sketchpad.delete': 'Delete',
  },

  fr: {
    // Auth
    'auth.login.title': 'Connectez-vous à votre compte',
    'auth.login.email': 'Email',
    'auth.login.password': 'Mot de passe',
    'auth.login.remember': 'Se souvenir de moi',
    'auth.login.forgot': 'Mot de passe oublié ?',
    'auth.login.signin': 'Se connecter',
    'auth.login.signup': "S'inscrire",
    'auth.login.noaccount': "Vous n'avez pas de compte ?",
    'auth.login.orcontinue': 'ou continuer avec',

    // Navigation
    'nav.problems': 'Problèmes',
    'nav.canvas': 'Canvas',
    'nav.drawing': 'Carnet de croquis',
    'nav.duel': 'Duel',
    'nav.hackathon': 'Hackathon',
    'nav.leaderboard': 'Classement',
    'nav.themes': 'Thèmes',
    'nav.dashboard': 'Tableau de bord',
    'nav.profile': 'Profil',
    'nav.settings': 'Paramètres',
    'nav.logout': 'Déconnexion',
    'nav.login': 'Connexion',
    'nav.signup': 'Inscription',
    'nav.discussion': 'Forum',
    'nav.visualizer': 'Visualiseur',
    'nav.dataStructures': 'Structures de Données',
    'nav.interview': 'Entretien',

    // Dashboard
    'dashboard.welcome': 'Bienvenue',
    'dashboard.quickduel': 'Duel Rapide',
    'dashboard.quickduel.desc': 'Défiez un adversaire',
    'dashboard.solo': 'Mode Solo',
    'dashboard.solo.desc': 'Résoudre des problèmes',
    'dashboard.hackathon': 'Hackathon',
    'dashboard.hackathon.desc': 'Rejoindre une équipe',
    'dashboard.recommended': 'Problèmes Recommandés',
    'dashboard.viewall': 'Voir Tout',
    'dashboard.recent': 'Matchs Récents',
    'dashboard.history': 'Historique',
    'dashboard.skills': 'Compétences',
    'dashboard.badges': 'Badges Récents',
    'dashboard.unlock': 'Débloquer de nouveaux thèmes',

    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.create': 'Créer',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.export': 'Exporter',
    'common.import': 'Importer',
    'common.back': 'Retour',

    // Settings
    'settings.title': 'Paramètres',
    'settings.profile': 'Profil',
    'settings.notifications': 'Notifications',
    'settings.security': 'Sécurité',
    'settings.appearance': 'Apparence',
    'settings.preferences': 'Préférences',
    'settings.language': 'Langue',
    'settings.dangerzone': 'Zone Dangereuse',

    // Settings - Profile Photo
    'settings.profile.photo': 'Photo de Profil',
    'settings.profile.photo.change': 'Changer la Photo',
    'settings.profile.photo.remove': 'Supprimer la Photo',
    'settings.profile.photo.upload': 'Télécharger une Photo',
    'settings.profile.photo.uploading': 'Téléchargement...',
    'settings.profile.photo.success': 'Photo mise à jour avec succès',
    'settings.profile.photo.removed': 'Photo supprimée',
    'settings.profile.photo.error': 'Échec de la mise à jour de la photo',
    'settings.profile.photo.invalid': 'Veuillez sélectionner un fichier image valide (JPG, PNG ou WebP)',
    'settings.profile.photo.tooLarge': 'Le fichier est trop volumineux. Taille maximale: 5 Mo.',

    // Settings - Bio
    'settings.profile.bio': 'Bio',
    'settings.profile.bio.placeholder': 'Parlez-nous de vous...',
    'settings.profile.bio.charCount': '{count}/250 caractères',

    // Settings - Security
    'settings.security.password': 'Mot de Passe',
    'settings.security.password.current': 'Mot de Passe Actuel',
    'settings.security.password.new': 'Nouveau Mot de Passe',
    'settings.security.password.confirm': 'Confirmer le Nouveau Mot de Passe',
    'settings.security.password.change': 'Changer le Mot de Passe',
    'settings.security.password.success': 'Mot de passe changé avec succès',
    'settings.security.password.error': 'Échec du changement de mot de passe',
    'settings.security.password.incorrect': 'Le mot de passe actuel est incorrect',
    'settings.security.password.mismatch': 'Les mots de passe ne correspondent pas',
    'settings.security.password.weak': 'Le mot de passe est trop faible',
    'settings.security.password.oauth': 'Mot de passe géré par Google',
    'settings.security.password.oauthDesc': 'Vous vous êtes inscrit avec Google. Les changements de mot de passe ne sont pas disponibles.',

    // Settings - Email
    'settings.account.email': 'Adresse Email',
    'settings.account.email.current': 'Email Actuel',
    'settings.account.email.new': 'Nouvel Email',
    'settings.account.email.change': 'Changer l\'Email',
    'settings.account.email.success': 'Email changé avec succès',
    'settings.account.email.error': 'Échec du changement d\'email',
    'settings.account.email.inUse': 'Cet email est déjà utilisé',
    'settings.account.email.invalid': 'Veuillez entrer une adresse email valide',
    'settings.account.email.oauth': 'Email géré par Google',
    'settings.account.email.oauthDesc': 'Vous vous êtes inscrit avec Google. Les changements d\'email ne sont pas disponibles.',

    // Settings - Editor Theme
    'settings.preferences.editorTheme': 'Thème de l\'Éditeur de Code',
    'settings.preferences.editorTheme.desc': 'Choisissez le thème de couleur pour les éditeurs de code',
    'settings.preferences.editorTheme.preview': 'Aperçu',

    // Settings - Danger Zone
    'settings.dangerzone.title': 'Zone Dangereuse',
    'settings.dangerzone.delete': 'Supprimer le Compte',
    'settings.dangerzone.delete.desc': 'Supprimer définitivement votre compte et toutes les données associées',
    'settings.dangerzone.delete.warning': 'Cette action est irréversible',
    'settings.dangerzone.delete.confirm': 'Tapez DELETE pour confirmer',
    'settings.dangerzone.delete.success': 'Compte supprimé avec succès',
    'settings.dangerzone.delete.error': 'Échec de la suppression du compte',

    // Profile Stats
    'profile.stats.title': 'Statistiques',
    'profile.stats.elo': 'Classement ELO',
    'profile.stats.xp': 'Points d\'Expérience',
    'profile.stats.level': 'Niveau',
    'profile.stats.duelsWon': 'Duels Gagnés',
    'profile.stats.duelsLost': 'Duels Perdus',
    'profile.stats.duelsTotal': 'Total des Duels',
    'profile.stats.winRate': 'Taux de Victoire',
    'profile.stats.challengesSolved': 'Défis Résolus',
    'profile.stats.forumPosts': 'Publications du Forum',
    'profile.stats.comments': 'Commentaires',
    'profile.stats.leaderboard': 'Position au Classement',
    'profile.stats.joined': 'Membre Depuis',
    'profile.stats.lastLogin': 'Dernière Connexion',

    // Discussion Forum
    'discussion.title': 'Forum de Discussion',
    'discussion.subtitle': 'Posez des questions, partagez vos connaissances et connectez-vous avec la communauté',
    'discussion.newPost': 'Nouveau Sujet',
    'discussion.totalPosts': 'Total des sujets',
    'discussion.activeUsers': 'Utilisateurs actifs',
    'discussion.solvedThreads': 'Sujets résolus',
    'discussion.thisWeek': 'Cette semaine',
    'discussion.categories': 'Catégories',
    'discussion.allPosts': 'Tous les sujets',
    'discussion.popularTags': 'Tags populaires',
    'discussion.searchPlaceholder': 'Rechercher des discussions...',
    'discussion.trending': 'Tendances',
    'discussion.newest': 'Récents',
    'discussion.mostVoted': 'Plus votés',
    'discussion.noResults': 'Aucune discussion trouvée',
    'discussion.comments': 'Commentaires',
    'discussion.writeComment': 'Écrire un commentaire...',
    'discussion.postComment': 'Publier',
    'discussion.noComments': 'Pas encore de commentaires. Soyez le premier à répondre !',
    'discussion.notFound': 'Discussion introuvable',
    'discussion.backToForum': 'Retour au forum',

    // Algorithm Visualizer
    'visualizer.title': 'Visualiseur d\'Algorithmes',
    'visualizer.subtitle': 'Regardez les algorithmes prendre vie avec des animations interactives',
    'visualizer.sorting': 'Tri',
    'visualizer.searching': 'Recherche',
    'visualizer.graph': 'Graphe',
    'visualizer.algorithms': 'Algorithmes',
    'visualizer.complexity': 'Complexité',
    'visualizer.pseudocode': 'Pseudocode',
    'visualizer.speed': 'Vitesse',
    'visualizer.size': 'Taille',

    // AI Mock Interview
    'interview.title': 'Entretien IA',
    'interview.subtitle': 'Entraînez-vous aux entretiens techniques avec notre IA. Obtenez un retour en temps réel.',
    'interview.totalSessions': 'Sessions totales',
    'interview.avgScore': 'Score moyen',
    'interview.bestScore': 'Meilleur score',
    'interview.streak': 'Série',
    'interview.selectTopic': 'Choisir un sujet',
    'interview.selectDomain': 'Choisir un domaine',
    'interview.selectDifficulty': 'Choisir la difficulté',
    'interview.selectLanguage': 'Choisir la langue de l\'entretien',
    'interview.startInterview': 'Commencer l\'entretien',
    'interview.pastSessions': 'Sessions passées',
    'interview.end': 'Terminer',
    'interview.typePlaceholder': 'Écrivez votre réponse... (Maj+Entrée pour une nouvelle ligne)',
    'interview.tips': 'Conseils',
    'interview.quickActions': 'Actions rapides',
    'interview.backToSetup': 'Retour à la configuration',
    'interview.reviewTitle': 'Bilan de performance',
    'interview.overallScore': 'Score global',
    'interview.technical': 'Technique',
    'interview.communication': 'Communication',
    'interview.problemSolving': 'Résolution de problèmes',
    'interview.strengths': 'Points forts',
    'interview.improvements': 'Axes d\'amélioration',
    'interview.recommendation': 'Recommandation',
    'interview.newSession': 'Nouvelle session',
    'interview.error.insufficientTokens': 'Tokens IA insuffisants pour démarrer l\'entretien. Veuillez acheter plus de tokens ou attendre le renouvellement de votre solde.',
    'interview.error.failed': 'Échec du démarrage de l\'entretien. Veuillez réessayer plus tard.',

    // Sketchpad
    'sketchpad.new': 'Nouveau canevas',
    'sketchpad.myDrawings': 'Mes dessins',
    'sketchpad.noDrawings': 'Aucun dessin sauvegardé',
    'sketchpad.startDrawing': 'Commencez à dessiner et sauvegardez votre travail pour le retrouver ici',
    'sketchpad.open': 'Ouvrir',
    'sketchpad.delete': 'Supprimer',
  },

  ar: {
    // Auth
    'auth.login.title': 'تسجيل الدخول إلى حسابك',
    'auth.login.email': 'البريد الإلكتروني',
    'auth.login.password': 'كلمة المرور',
    'auth.login.remember': 'تذكرني',
    'auth.login.forgot': 'نسيت كلمة المرور؟',
    'auth.login.signin': 'تسجيل الدخول',
    'auth.login.signup': 'إنشاء حساب',
    'auth.login.noaccount': 'ليس لديك حساب؟',
    'auth.login.orcontinue': 'أو المتابعة مع',

    // Navigation
    'nav.problems': 'المسائل',
    'nav.canvas': 'لوحة الرسم',
    'nav.drawing': 'دفتر الرسم',
    'nav.duel': 'المبارزة',
    'nav.hackathon': 'الهاكاثون',
    'nav.leaderboard': 'لوحة المتصدرين',
    'nav.themes': 'السمات',
    'nav.dashboard': 'لوحة التحكم',
    'nav.profile': 'الملف الشخصي',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',
    'nav.login': 'تسجيل الدخول',
    'nav.signup': 'إنشاء حساب',
    'nav.discussion': 'المنتدى',
    'nav.visualizer': 'المرئيات',
    'nav.dataStructures': 'هياكل البيانات',
    'nav.interview': 'المقابلة',

    // Dashboard
    'dashboard.welcome': 'مرحباً',
    'dashboard.quickduel': 'مبارزة سريعة',
    'dashboard.quickduel.desc': 'تحدى خصم',
    'dashboard.solo': 'الوضع الفردي',
    'dashboard.solo.desc': 'حل المسائل',
    'dashboard.hackathon': 'هاكاثون',
    'dashboard.hackathon.desc': 'انضم إلى فريق',
    'dashboard.recommended': 'المسائل الموصى بها',
    'dashboard.viewall': 'عرض الكل',
    'dashboard.recent': 'المباريات الأخيرة',
    'dashboard.history': 'السجل',
    'dashboard.skills': 'المهارات',
    'dashboard.badges': 'الشارات الأخيرة',
    'dashboard.unlock': 'فتح سمات جديدة',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.create': 'إنشاء',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.export': 'تصدير',
    'common.import': 'استيراد',
    'common.back': 'رجوع',

    // Settings
    'settings.title': 'الإعدادات',
    'settings.profile': 'الملف الشخصي',
    'settings.notifications': 'الإشعارات',
    'settings.security': 'الأمان',
    'settings.appearance': 'المظهر',
    'settings.preferences': 'التفضيلات',
    'settings.language': 'اللغة',
    'settings.dangerzone': 'منطقة الخطر',

    // Settings - Profile Photo
    'settings.profile.photo': 'صورة الملف الشخصي',
    'settings.profile.photo.change': 'تغيير الصورة',
    'settings.profile.photo.remove': 'حذف الصورة',
    'settings.profile.photo.upload': 'رفع صورة',
    'settings.profile.photo.uploading': 'جارٍ الرفع...',
    'settings.profile.photo.success': 'تم تحديث الصورة بنجاح',
    'settings.profile.photo.removed': 'تم حذف الصورة',
    'settings.profile.photo.error': 'فشل في تحديث الصورة',
    'settings.profile.photo.invalid': 'يرجى تحديد ملف صورة صالح (JPG أو PNG أو WebP)',
    'settings.profile.photo.tooLarge': 'الملف كبير جداً. الحجم الأقصى 5 ميجابايت.',

    // Settings - Bio
    'settings.profile.bio': 'نبذة',
    'settings.profile.bio.placeholder': 'أخبرنا عن نفسك...',
    'settings.profile.bio.charCount': '{count}/250 حرف',

    // Settings - Security
    'settings.security.password': 'كلمة المرور',
    'settings.security.password.current': 'كلمة المرور الحالية',
    'settings.security.password.new': 'كلمة المرور الجديدة',
    'settings.security.password.confirm': 'تأكيد كلمة المرور الجديدة',
    'settings.security.password.change': 'تغيير كلمة المرور',
    'settings.security.password.success': 'تم تغيير كلمة المرور بنجاح',
    'settings.security.password.error': 'فشل في تغيير كلمة المرور',
    'settings.security.password.incorrect': 'كلمة المرور الحالية غير صحيحة',
    'settings.security.password.mismatch': 'كلمات المرور غير متطابقة',
    'settings.security.password.weak': 'كلمة المرور ضعيفة جداً',
    'settings.security.password.oauth': 'كلمة المرور يديرها Google',
    'settings.security.password.oauthDesc': 'لقد سجل الدخول باستخدام Google. لا يمكن تغيير كلمة المرور.',

    // Settings - Email
    'settings.account.email': 'البريد الإلكتروني',
    'settings.account.email.current': 'البريد الحالي',
    'settings.account.email.new': 'البريد الجديد',
    'settings.account.email.change': 'تغيير البريد',
    'settings.account.email.success': 'تم تغيير البريد بنجاح',
    'settings.account.email.error': 'فشل في تغيير البريد',
    'settings.account.email.inUse': 'هذا البريد مستخدم بالفعل',
    'settings.account.email.invalid': 'يرجى إدخال بريد إلكتروني صالح',
    'settings.account.email.oauth': 'البريد يديره Google',
    'settings.account.email.oauthDesc': 'لقد سجل الدخول باستخدام Google. لا يمكن تغيير البريد.',

    // Settings - Editor Theme
    'settings.preferences.editorTheme': 'سمة محرر الكود',
    'settings.preferences.editorTheme.desc': 'اختر سمة الألوان لمحررات الكود',
    'settings.preferences.editorTheme.preview': 'معاينة',

    // Settings - Danger Zone
    'settings.dangerzone.title': 'منطقة الخطر',
    'settings.dangerzone.delete': 'حذف الحساب',
    'settings.dangerzone.delete.desc': 'حذف حسابك وجميع البيانات المرتبطة بشكل دائم',
    'settings.dangerzone.delete.warning': 'لا يمكن التراجع عن هذا الإجراء',
    'settings.dangerzone.delete.confirm': 'اكتب DELETE للتأكيد',
    'settings.dangerzone.delete.success': 'تم حذف الحساب بنجاح',
    'settings.dangerzone.delete.error': 'فشل في حذف الحساب',

    // Profile Stats
    'profile.stats.title': 'الإحصائيات',
    'profile.stats.elo': 'تصنيف ELO',
    'profile.stats.xp': 'نقاط الخبرة',
    'profile.stats.level': 'المستوى',
    'profile.stats.duelsWon': 'المبارزات الفائزة',
    'profile.stats.duelsLost': 'المبارزات الخاسرة',
    'profile.stats.duelsTotal': 'إجمالي المبارزات',
    'profile.stats.winRate': 'نسبة الفوز',
    'profile.stats.challengesSolved': 'التحديات المحلولة',
    'profile.stats.forumPosts': 'منشورات المنتدى',
    'profile.stats.comments': 'التعليقات',
    'profile.stats.leaderboard': 'موقعك في الترتيب',
    'profile.stats.joined': 'عضو منذ',
    'profile.stats.lastLogin': 'آخر تسجيل دخول',

    // Discussion Forum
    'discussion.title': 'منتدى النقاش',
    'discussion.subtitle': 'اطرح أسئلة، شارك معرفتك، وتواصل مع المجتمع',
    'discussion.newPost': 'موضوع جديد',
    'discussion.totalPosts': 'إجمالي المواضيع',
    'discussion.activeUsers': 'المستخدمون النشطون',
    'discussion.solvedThreads': 'المواضيع المحلولة',
    'discussion.thisWeek': 'هذا الأسبوع',
    'discussion.categories': 'التصنيفات',
    'discussion.allPosts': 'جميع المواضيع',
    'discussion.popularTags': 'الوسوم الشائعة',
    'discussion.searchPlaceholder': 'البحث في المناقشات...',
    'discussion.trending': 'الأكثر رواجاً',
    'discussion.newest': 'الأحدث',
    'discussion.mostVoted': 'الأكثر تصويتاً',
    'discussion.noResults': 'لم يتم العثور على مناقشات',
    'discussion.comments': 'التعليقات',
    'discussion.writeComment': 'اكتب تعليقاً...',
    'discussion.postComment': 'نشر التعليق',
    'discussion.noComments': 'لا توجد تعليقات بعد. كن أول من يرد!',
    'discussion.notFound': 'المناقشة غير موجودة',
    'discussion.backToForum': 'العودة إلى المنتدى',

    // Algorithm Visualizer
    'visualizer.title': 'مرئيات الخوارزميات',
    'visualizer.subtitle': 'شاهد الخوارزميات تنبض بالحياة مع الرسوم المتحركة التفاعلية',
    'visualizer.sorting': 'الترتيب',
    'visualizer.searching': 'البحث',
    'visualizer.graph': 'الرسم البياني',
    'visualizer.algorithms': 'الخوارزميات',
    'visualizer.complexity': 'التعقيد',
    'visualizer.pseudocode': 'الكود الزائف',
    'visualizer.speed': 'السرعة',
    'visualizer.size': 'الحجم',

    // AI Mock Interview
    'interview.title': 'مقابلة ذكاء اصطناعي',
    'interview.subtitle': 'تدرب على المقابلات التقنية مع الذكاء الاصطناعي. احصل على تقييم فوري.',
    'interview.totalSessions': 'إجمالي الجلسات',
    'interview.avgScore': 'متوسط النتيجة',
    'interview.bestScore': 'أفضل نتيجة',
    'interview.streak': 'سلسلة',
    'interview.selectTopic': 'اختر الموضوع',
    'interview.selectDomain': 'اختر المجال',
    'interview.selectDifficulty': 'اختر المستوى',
    'interview.selectLanguage': 'اختر لغة المقابلة',
    'interview.startInterview': 'بدء المقابلة',
    'interview.pastSessions': 'الجلسات السابقة',
    'interview.end': 'إنهاء المقابلة',
    'interview.typePlaceholder': 'اكتب إجابتك...',
    'interview.tips': 'نصائح',
    'interview.quickActions': 'إجراءات سريعة',
    'interview.backToSetup': 'العودة إلى الإعداد',
    'interview.reviewTitle': 'تقييم أداء المقابلة',
    'interview.overallScore': 'النتيجة الإجمالية',
    'interview.technical': 'التقنية',
    'interview.communication': 'التواصل',
    'interview.problemSolving': 'حل المشكلات',
    'interview.strengths': 'نقاط القوة',
    'interview.improvements': 'مجالات التحسين',
    'interview.recommendation': 'التوصية',
    'interview.newSession': 'جلسة جديدة',
    'interview.error.insufficientTokens': 'رصيد الذكاء الاصطناعي غير كافٍ لبدء المقابلة. يرجى شراء المزيد من الرموز أو انتظار تجديد رصيدك.',
    'interview.error.failed': 'فشل بدء المقابلة. يرجى المحاولة مرة أخرى لاحقًا.',

    // Sketchpad
    'sketchpad.new': 'لوحة جديدة',
    'sketchpad.myDrawings': 'رسوماتي',
    'sketchpad.noDrawings': 'لا توجد رسومات محفوظة بعد',
    'sketchpad.startDrawing': 'ابدأ الرسم واحفظ عملك لتراه هنا',
    'sketchpad.open': 'فتح',
    'sketchpad.delete': 'حذف',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('bytebattle_language');
    return (stored as Language) || 'en';
  });

  const direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('bytebattle_language', language);
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', direction);
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, direction, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
