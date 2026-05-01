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
  { id: 'halfbody-portrait-v1', label: 'Bust' },
  { id: 'fullbody-portrait-v1', label: 'Full body (Portrait)' },
  { id: 'fullbody-posture-v1', label: 'Standing full body' },
] as const;

export const EXPRESSIONS = [
  { id: 'neutral', label: 'Neutral', emoji: '😐' },
  { id: 'smile', label: 'Smile', emoji: '🙂' },
  { id: 'big-smile', label: 'Big smile', emoji: '😄' },
  { id: 'surprised', label: 'Surprised', emoji: '😮' },
  { id: 'wink', label: 'Wink', emoji: '😉' },
  { id: 'sad', label: 'Sad', emoji: '🙁' },
] as const;

export type RPMScene = typeof SCENES[number]['id'];
export type RPMExpression = typeof EXPRESSIONS[number]['id'];

export interface AvatarResponse {
  avatar: Avatar | null;
  profileImage: string | null;
}
