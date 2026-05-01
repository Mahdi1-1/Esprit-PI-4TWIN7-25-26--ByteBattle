import React, { useEffect, useState } from 'react';
import { Link } from 'react-router'; 
import { AvatarDisplay } from './AvatarDisplay';
import { avatarService } from '../../services/avatarService';
import { Avatar } from '../../types/avatar.types';

export const AvatarHeaderWidget: React.FC = () => {
    const [avatar, setAvatar] = useState<Avatar | null>(null);

    useEffect(() => {
        // Simple fetch on mount, could be replaced by a global Context if needed heavily
        avatarService.getMyAvatar().then(data => {
            if (data?.avatar) setAvatar(data.avatar);
        }).catch(() => {});
    }, []);

    if (!avatar) return null; // Ou afficher un placeholder

    return (
        <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer">
            <AvatarDisplay 
                src={avatar.localImageUrl} 
                size="sm" 
                className="ring-2 ring-slate-700" 
            />
        </Link>
    );
};
