export interface Avatar {
  rpmAvatarId: string;
  rpmModelUrl: string;
  renderUrl: string;
  localImageUrl?: string;
  thumbnailUrl?: string;
  scene: RPMScene;
  expression?: RPMExpression;
  updatedAt: string;
}

export const SCENES = [
  { id: 'halfbody-portrait-v1', label: 'Buste' },
  { id: 'fullbody-portrait-v1', label: 'Corps entier (Portrait)' },
  { id: 'fullbody-posture-v1', label: 'En pied' },
] as const;

export const EXPRESSIONS = [
  { id: 'neutral', label: 'Neutre', emoji: '😐' },
  { id: 'smile', label: 'Sourire', emoji: '🙂' },
  { id: 'big-smile', label: 'Grand sourire', emoji: '😄' },
  { id: 'surprised', label: 'Surpris', emoji: '😮' },
  { id: 'wink', label: 'Clin d\'œil', emoji: '😉' },
  { id: 'sad', label: 'Triste', emoji: '🙁' },
] as const;

export type RPMScene = typeof SCENES[number]['id'];
export type RPMExpression = typeof EXPRESSIONS[number]['id'];

export interface AvatarResponse {
  avatar: Avatar | null;
  profileImage: string | null;
}
