import React from 'react';
import { useAvatar } from '../../hooks/useAvatar';
import { RPMEditorModal } from './RPMEditorModal';
import { AvatarDisplay } from './AvatarDisplay';
import { ExpressionSelector } from './ExpressionSelector';
import { SceneSelector } from './SceneSelector';
import { Loader, Sparkles, RefreshCw, Trash2, Edit, X } from 'lucide-react';
import './avatar-manager.css';

export const AvatarManager: React.FC = () => {
  const { 
    avatar, loading, error, editorOpen, processing,
    openEditor, closeEditor, handleAvatarCreated,
    changeExpression, changeScene, remove, refresh, clearError
  } = useAvatar();

  if (loading) return <div className="p-4 flex justify-center"><Loader className="animate-spin text-slate-400" /></div>;

  return (
    <div className="avatar-manager bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Preview Section */}
        <div className="flex flex-col items-center gap-4 min-w-[180px]">
          <div className="relative group">
            <AvatarDisplay 
              src={avatar?.localImageUrl} 
              size="xl" 
              className={`ring-4 ring-offset-4 ring-offset-slate-900 border-0 ${processing ? 'opacity-50' : 'ring-blue-500'}`}
            />
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
          
          <div className="flex gap-2 w-full justify-center">
             {!avatar ? (
                <button 
                    onClick={openEditor}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition w-full justify-center"
                >
                    <Sparkles className="w-4 h-4" />
                    Créer mon avatar
                </button>
             ) : (
                 <button 
                    onClick={openEditor}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition text-sm"
                 >
                    <Edit className="w-4 h-4" /> Modify
                 </button>
             )}
          </div>
        </div>

        {/* Controls Section (only if avatar exists) */}
        {avatar && (
            <div className="flex-1 space-y-6 w-full">
                <div>
                    <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Humeur</h3>
                    <ExpressionSelector 
                        current={avatar.expression} 
                        onChange={changeExpression}
                        disabled={processing}
                    />
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Cadrage</h3>
                    <SceneSelector 
                        current={avatar.scene}
                        onChange={changeScene}
                        disabled={processing}
                    />
                </div>

                <div className="pt-4 border-t border-slate-700 flex gap-3">
                    <button 
                        onClick={refresh} 
                        disabled={processing}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition"
                    >
                        <RefreshCw className="w-3 h-3" /> Actualiser
                    </button>
                    <button 
                        onClick={remove}
                        disabled={processing}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 bg-slate-800 hover:bg-red-500/10 rounded transition ml-auto"
                    >
                        <Trash2 className="w-3 h-3" /> Supprimer l'avatar
                    </button>
                </div>
            </div>
        )}

        {!avatar && (
             <div className="flex-1 flex items-center p-6 bg-slate-800/50 rounded-lg border border-dashed border-slate-700 text-slate-400 italic">
                Aucun avatar configuré. Créez-le pour personnaliser votre expérience !
             </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex justify-between items-center">
            {error}
            <button onClick={clearError} className="hover:bg-red-500/20 p-1 rounded transition"><X className="w-4 h-4" /></button>
        </div>
      )}

      <RPMEditorModal 
        isOpen={editorOpen} 
        onClose={closeEditor} 
        onAvatarCreated={handleAvatarCreated} 
        existingAvatarId={avatar?.rpmAvatarId}
      />
    </div>
  );
};
