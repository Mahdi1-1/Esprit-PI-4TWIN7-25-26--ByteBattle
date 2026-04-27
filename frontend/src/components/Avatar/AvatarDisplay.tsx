import React, { useState } from 'react';
import { User } from 'lucide-react';
import { avatarService } from '../../services/avatarService';

interface AvatarDisplayProps {
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackInitials?: string;
  online?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
  xl: 'w-32 h-32'
};

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  src,
  size = 'md',
  fallbackInitials,
  online,
  className = '',
  onClick
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fullUrl = src && !src.startsWith('http') ? avatarService.getFullUrl(src) : src;

  return (
    <div 
      className={`relative inline-block ${sizes[size]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className={`overflow-hidden rounded-full ${sizes[size]} bg-slate-700 border-2 border-slate-600 shadow-sm flex items-center justify-center`}>
        {src && !hasError ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-slate-600 animate-pulse" />
            )}
            <img
              src={fullUrl || undefined}
              alt="Avatar"
              className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
            />
          </>
        ) : fallbackInitials ? (
          <span className="text-white font-bold select-none">{fallbackInitials.substring(0, 2).toUpperCase()}</span>
        ) : (
          <User className="text-slate-400 w-1/2 h-1/2" />
        )}
      </div>
      
      {online && (
        <span className="absolute bottom-0 right-0 block w-3 h-3 bg-green-500 rounded-full ring-2 ring-slate-800" />
      )}
    </div>
  );
};
