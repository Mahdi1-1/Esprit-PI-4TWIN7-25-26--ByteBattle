// Profile Service - User Profile & Settings API
import api from '../api/axios';

// Derive the backend origin from axios baseURL  → "http://localhost:4001"
const BACKEND_ORIGIN = (api.defaults.baseURL ?? 'http://localhost:4001/api').replace(/\/api\/?$/, '');

// Types
export interface UpdateProfileData {
    bio?: string;
    editorTheme?: string;
    preferredLanguage?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

export interface ChangeEmailData {
    currentPassword: string;
    newEmail: string;
}

export interface DeleteAccountData {
    currentPassword: string;
    confirmation: string;
}

export interface ProfileStats {
    elo: number;
    xp: number;
    level: number;
    duelsWon: number;
    duelsLost: number;
    duelsTotal: number;
    winRate: number;
    challengesSolved: number;
    discussionsCount: number;
    commentsCount: number;
    leaderboardPosition: number;
    totalUsers: number;
    joinedAt: string;
    lastLogin: string | null;
}

export interface IntelligenceRecommendation {
    challenge_id: string;
    challenge_name: string;
    cf_rating: number;
    score: number;
}

export interface IntelligenceProfileResponse {
    user_id: string;
    updated_skills: Record<string, number>;
    current_skills?: Record<string, number>;
    weakest_tags: string[];
    recommended_challenges: IntelligenceRecommendation[];
    fallback?: boolean;
}

class ProfileService {
    /**
     * Upload profile photo
     */
    async uploadPhoto(file: File): Promise<{ profileImage: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/users/me/photo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    /**
     * Delete profile photo
     */
    async deletePhoto(): Promise<{ success: boolean }> {
        const response = await api.delete('/users/me/photo');
        return response.data;
    }

    /**
     * Get profile photo URL (handles Base64, legacy filenames, and fallbacks)
     */
    getPhotoUrl(data: string | null | undefined, fallbackSeed: string = 'default'): string {
        if (!data) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${fallbackSeed}`;
        // External URL (Google OAuth, CDN, etc.) or data URI → return as-is
        if (data.startsWith('http') || data.startsWith('data:')) return data;
        // Local uploaded filename (e.g. "abc123.webp") → build full URL
        return `${BACKEND_ORIGIN}/api/users/photo/${data}`;
    }

    /**
     * Update profile (bio, editorTheme, preferredLanguage, etc.)
     */
    async updateProfile(data: UpdateProfileData): Promise<any> {
        const response = await api.patch('/users/me', data);
        return response.data;
    }

    /**
     * Change password
     */
    async changePassword(data: ChangePasswordData): Promise<{ success: boolean }> {
        const response = await api.patch('/users/me/password', data);
        return response.data;
    }

    /**
     * Change email
     */
    async changeEmail(data: ChangeEmailData): Promise<any> {
        const response = await api.patch('/users/me/email', data);
        return response.data;
    }

    /**
     * Get profile statistics
     */
    async getProfileStats(): Promise<ProfileStats> {
        const response = await api.get('/users/me/stats');
        return response.data;
    }

    /**
     * Get AI-generated profile insights, updated skills, and challenge recommendations.
     */
    async getIntelligenceProfile(): Promise<IntelligenceProfileResponse> {
        const response = await api.get('/users/me/intelligence');
        return response.data;
    }

    /**
     * Delete account
     */
    async deleteAccount(data: DeleteAccountData): Promise<{ success: boolean }> {
        const response = await api.delete('/users/me', { data });
        return response.data;
    }
}

export const profileService = new ProfileService();
