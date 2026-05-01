// Profile Photo Upload Component
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { profileService } from '../../services/profileService';
import { Camera, Upload, Trash2, Loader } from 'lucide-react';

export interface ProfilePhotoUploadProps {
    onFileSelect?: (file: File | null) => void;
    clearPreviewSignal?: number;
}

export function ProfilePhotoUpload({ onFileSelect, clearPreviewSignal }: ProfilePhotoUploadProps) {
    const { user, updateUser } = useAuth();
    const { t } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Clear preview when parent triggers a save (clearPreviewSignal changes)
    useEffect(() => {
        if (clearPreviewSignal) {
            setPreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [clearPreviewSignal]);

    // Generate DiceBear avatar URL as fallback
    const getFallbackAvatar = (username: string) => {
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    };

    // Current photo URL
    const currentPhotoUrl = profileService.getPhotoUrl(user?.profileImage, user?.username);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError(t('settings.profile.photo.invalid'));
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError(t('settings.profile.photo.tooLarge'));
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
            setPreview(reader.result as string);
            setError(null);
            setSuccess(null);
            if (onFileSelect) {
                onFileSelect(file);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await profileService.uploadPhoto(file);
            updateUser({ profileImage: result.profileImage });
            setPreview(null);
            setSuccess(t('settings.profile.photo.success'));

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err: any) {
            setError(err.response?.data?.message || t('settings.profile.photo.error'));
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = async () => {
        setUploading(true);
        setError(null);
        setSuccess(null);

        try {
            await profileService.deletePhoto();
            updateUser({ profileImage: null });
            setSuccess(t('settings.profile.photo.removed'));
        } catch (err: any) {
            setError(err.response?.data?.message || t('settings.profile.photo.error'));
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        setPreview(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (onFileSelect) {
            onFileSelect(null);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Current/Preview Photo */}
            <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--border)] bg-[var(--surface)]">
                    <img
                        src={preview || currentPhotoUrl}
                        alt="Profile"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            if (user?.username && !preview) {
                                (e.target as HTMLImageElement).src = getFallbackAvatar(user.username);
                            }
                        }}
                    />
                </div>

                {/* Camera icon overlay */}
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white" />
                </div>
            </div>

            {/* File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                id="photo-upload"
            />

            {/* Error/Success Messages */}
            {error && (
                <div className="text-sm text-[var(--error)] text-center">{error}</div>
            )}
            {success && (
                <div className="text-sm text-[var(--success)] text-center">{success}</div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 w-full max-w-xs">
                {preview ? (
                    // Preview mode
                    onFileSelect ? (
                        <>
                            <button
                                onClick={handleCancel}
                                disabled={uploading}
                                className="px-4 py-2 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] disabled:opacity-50"
                            >
                                {t('common.cancel')}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                            >
                                {uploading ? (
                                    <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                {uploading ? t('settings.profile.photo.uploading') : t('settings.profile.photo.upload')}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={uploading}
                                className="px-4 py-2 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] disabled:opacity-50"
                            >
                                {t('common.cancel')}
                            </button>
                        </>
                    )
                ) : (
                    // Normal mode - show change/remove buttons
                    <>
                        <label
                            htmlFor="photo-upload"
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 cursor-pointer"
                        >
                            <Upload className="w-4 h-4" />
                            {t('settings.profile.photo.change')}
                        </label>
                        {user?.profileImage && (
                            <button
                                onClick={handleRemove}
                                disabled={uploading}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--error)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                            >
                                {uploading ? (
                                    <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                {t('settings.profile.photo.remove')}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
