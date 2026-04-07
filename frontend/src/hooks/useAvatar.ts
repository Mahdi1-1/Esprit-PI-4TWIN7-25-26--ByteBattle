import { useState, useEffect, useCallback } from 'react';
import { avatarService } from '../services/avatarService';
import { Avatar, RPMExpression, RPMScene } from '../types/avatar.types';

export function useAvatar() {
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const loadAvatar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await avatarService.getMyAvatar();
      setAvatar(data.avatar);
      setError(null);
    } catch (err: any) {
      // Silently fail for 404 (no avatar created yet) or 401 (not authenticated)
      if (err?.response?.status === 404 || err?.response?.status === 401) {
        setAvatar(null);
        setError(null);
      } else {
        console.error('Error loading avatar:', err);
        setError('Unable to load avatar');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvatar();
  }, [loadAvatar]);

  const handleAvatarCreated = async (glbUrl: string) => {
    setEditorOpen(false);
    setProcessing(true);
    try {
      const newAvatar = await avatarService.saveAvatar(glbUrl);
      setAvatar(newAvatar);
      // Dispatch event so global AuthContext updates instantly
      window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: { avatar: newAvatar } }));
    } catch (err) {
      console.error(err);
      setError('Error while saving avatar');
    } finally {
      setProcessing(false);
    }
  };

  const changeExpression = async (expression: RPMExpression) => {
    // Optimistic update
    const previousAvatar = avatar;
    if (avatar) {
      setAvatar({ ...avatar, expression });
    }

    try {
      const updated = await avatarService.updateExpression(expression);
      setAvatar(updated);
      window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: { avatar: updated } }));
    } catch (err) {
      console.error(err);
      setAvatar(previousAvatar);
      setError('Error while changing expression');
    }
  };

  const changeScene = async (scene: RPMScene) => {
    setProcessing(true);
    try {
      const updated = await avatarService.updateScene(scene);
      setAvatar(updated);
      window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: { avatar: updated } }));
    } catch (err) {
      console.error(err);
      setError('Error while changing framing');
    } finally {
      setProcessing(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Do you really want to delete your avatar?')) return;
    
    setProcessing(true);
    try {
      await avatarService.deleteAvatar();
      setAvatar(null);
      window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: { avatar: null } }));
    } catch (err) {
      setError('Error while deleting avatar');
    } finally {
      setProcessing(false);
    }
  };

  const refresh = async () => {
    setProcessing(true);
    try {
      const updated = await avatarService.refreshAvatar();
      setAvatar(updated);
      window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: { avatar: updated } }));
    } catch (err) {
      setError('Refresh error');
    } finally {
      setProcessing(false);
    }
  };

  return {
    avatar,
    loading,
    error,
    editorOpen,
    processing,
    openEditor: () => setEditorOpen(true),
    closeEditor: () => setEditorOpen(false),
    handleAvatarCreated,
    changeExpression,
    changeScene,
    remove,
    refresh,
    clearError: () => setError(null)
  };
}
