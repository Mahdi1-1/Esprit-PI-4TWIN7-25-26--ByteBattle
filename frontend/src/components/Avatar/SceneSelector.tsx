import React from 'react';
import { SCENES, RPMScene } from '../../types/avatar.types';
import { Frame, User as UserIcon, PersonStanding } from 'lucide-react';

interface Props {
  current?: string;
  onChange: (scene: RPMScene) => void;
  disabled?: boolean;
}

const icons = {
  'halfbody-portrait-v1': Frame,
  'fullbody-portrait-v1': UserIcon,
  'fullbody-posture-v1': PersonStanding
};

export const SceneSelector: React.FC<Props> = ({ current, onChange, disabled }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {SCENES.map((scene) => {
        const Icon = icons[scene.id as keyof typeof icons] || UserIcon;
        return (
          <button
            key={scene.id}
            onClick={() => onChange(scene.id as RPMScene)}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
              ${current === scene.id 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <Icon className="w-3 h-3" />
            {scene.label}
          </button>
        );
      })}
    </div>
  );
};
