import api from '../api/axios';
import { type CanvasChallenge } from '../data/canvasChallengeData';

/**
 * Normalize a raw backend challenge to the CanvasChallenge
 * structure expected by the frontend.
 */
function normalizeChallenge(raw: any): CanvasChallenge {
  const constraints = raw.constraints ?? {};

  // Build a readable list of constraints (e.g. "Time: 45 min")
  const constraintsList: string[] = [
    constraints.timeLimit       ? `⏱ Time: ${constraints.timeLimit} min`          : null,
    constraints.maxElements     ? `📐 Max elements: ${constraints.maxElements}`    : null,
    constraints.budget          ? `💰 Budget : ${constraints.budget}`             : null,
    constraints.throughput      ? `📊 Throughput : ${constraints.throughput}`     : null,
    constraints.dataVolume      ? `💾 Volume: ${constraints.dataVolume}`           : null,
    constraints.gitops          ? `🔁 GitOps : ${constraints.gitops}`            : null,
    constraints.minimum         ? `✅ Minimum : ${constraints.minimum}`           : null,
    constraints.level           ? `🎯 Level: ${constraints.level}`                : null,
  ].filter(Boolean) as string[];

  return {
    id:             raw.id,
    title:          raw.title,
    description:    raw.descriptionMd ?? raw.description ?? '',
    type:           raw.category ?? 'architecture',
    difficulty:     raw.difficulty,
    duration:       constraints.timeLimit ?? raw.duelTimeLimit ?? 45,
    requirements:   constraints.requiredComponents ?? [],
    constraints:    constraintsList,
    deliverables:   raw.deliverables ? [raw.deliverables] : [],
    successCriteria: [],
    tags:           raw.tags ?? [],
    rubric:         Array.isArray(raw.rubric) ? raw.rubric : [],
    hints:          raw.hints ?? [],
    status:         raw.status === 'published' ? 'new' : raw.status,
    isDuelEnabled:  raw.isDuelEnabled,
    duelTimeLimit:  raw.duelTimeLimit,
  };
}

export const canvasService = {
  async getChallenges(params?: { type?: string; difficulty?: string }) {
    const { data } = await api.get('/challenges', {
      params: { ...params, kind: 'CANVAS' },
    });
    const items: any[] = data?.data ?? data ?? [];
    return { data: items.map(normalizeChallenge) };
  },

  async getChallengeById(id: string): Promise<CanvasChallenge> {
    const { data } = await api.get(`/challenges/${id}`);
    return normalizeChallenge(data?.data ?? data);
  },

  async submitChallenge(id: string, submission: {
    imageData: string;
    elements: any[];
    mode: string;
  }) {
    const { data } = await api.post(`/submissions/submit`, {
      challengeId: id,
      code: JSON.stringify(submission),
      language: 'canvas',
    });
    return data;
  },

  async getSubmissions(challengeId: string) {
    const { data } = await api.get('/submissions/history', {
      params: { challengeId },
    });
    return data;
  },

  async getCommunityDesigns(params?: { challengeId?: string; sort?: string }) {
    const { data } = await api.get('/submissions/history', { params });
    return data;
  },
};
