import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EndGameScreenProps } from './EndGameScreen.types';
import { GameTheme, GameResult } from '../../types/game.types';

// Lazy load themes to prevent massive bundle sizes
const CyberVictory = React.lazy(() => import('./themes/CyberArena/CyberVictory'));
const CyberDefeat = React.lazy(() => import('./themes/CyberArena/CyberDefeat'));
const SpaceVictory = React.lazy(() => import('./themes/SpaceOps/SpaceVictory'));
const SpaceDefeat = React.lazy(() => import('./themes/SpaceOps/SpaceDefeat'));
const DojoVictory = React.lazy(() => import('./themes/SamuraiDojo/DojoVictory'));
const DojoDefeat = React.lazy(() => import('./themes/SamuraiDojo/DojoDefeat'));
const PixelVictory = React.lazy(() => import('./themes/PixelArcade/PixelVictory'));
const PixelDefeat = React.lazy(() => import('./themes/PixelArcade/PixelDefeat'));
const RPGVictory = React.lazy(() => import('./themes/MythicRPG/RPGVictory'));
const RPGDefeat = React.lazy(() => import('./themes/MythicRPG/RPGDefeat'));
const SportsVictory = React.lazy(() => import('./themes/SportsArena/SportsVictory'));
const SportsDefeat = React.lazy(() => import('./themes/SportsArena/SportsDefeat'));

export const EndGameScreen: React.FC<EndGameScreenProps> = ({
  data,
  isVisible,
  onRetry,
  onBackToMenu
}) => {
  const [showInternal, setShowInternal] = useState(false);
  const [flash, setFlash] = useState<'white' | 'red' | null>(null);

  useEffect(() => {
    if (isVisible) {
      setFlash(data.result === GameResult.VICTORY ? 'white' : 'red');
      setTimeout(() => setFlash(null), data.result === GameResult.VICTORY ? 200 : 300);
      setShowInternal(true);
    } else {
      setShowInternal(false);
    }
  }, [isVisible, data?.result]);

  if (!data) return null;

  const renderTheme = () => {
    switch (data.theme) {
      case GameTheme.CYBER_ARENA:
        return data.result === GameResult.VICTORY ? <CyberVictory data={data} onRetry={onRetry} onBackToMenu={onBackToMenu} /> : <CyberDefeat data={data} onRetry={onRetry} onBackToMenu={onBackToMenu} />;
      case GameTheme.SPACE_OPS:
        return data.result === GameResult.VICTORY ? <SpaceVictory data={data} onRetry={onRetry} onBackToMenu={onBackToMenu} /> : <SpaceDefeat data={data} onRetry={onRetry} onBackToMenu={onBackToMenu} />;
      case GameTheme.SAMURAI_DOJO:
        return data.result === GameResult.VICTORY ? <DojoVictory data={data} onRetry={onRetry} onBackToMenu={onBackToMenu} /> : <DojoDefeat data={data} onRetry={onRetry} onBackToMenu={onBackToMenu} />;
      case GameTheme.PIXEL_ARCADE:
        return data.result === GameResult.VICTORY ? <PixelVictory data={data} onRetry={onRetry} onBackToMenu={onBackToMenu} /> : <PixelDefeat data={data} onRetry={onRetry} onBackToMenu={onBackToMenu} />;
      case GameTheme.MYTHIC_RPG:
        return data.result === GameResult.VICTORY ? <RPGVictory data={data} onRetry={onRetry} onBackToMenu={onBackToMenu} /> : <RPGDefeat data={data} onRetry={onRetry} onBackToMenu={onBackToMenu} />;
      case GameTheme.SPORTS_ARENA:
        return data.result === GameResult.VICTORY ? <SportsVictory data={data} onRetry={onRetry} onBackToMenu={onBackToMenu} /> : <SportsDefeat data={data} onRetry={onRetry} onBackToMenu={onBackToMenu} />;
      default:
        return <CyberVictory data={data} onRetry={onRetry} onBackToMenu={onBackToMenu} />;
    }
  };

  return (
    <AnimatePresence>
      {showInternal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden font-ui"
          role="dialog"
          aria-modal="true"
        >
          {flash === 'white' && <div className="absolute inset-0 bg-white z-[110] animate-ping" />}
          {flash === 'red' && <div className="absolute inset-0 bg-red-600 z-[110] animate-ping" />}
          
          <React.Suspense fallback={<div className="bg-black inset-0 flex items-center justify-center text-white">Loading...</div>}>
            {renderTheme()}
          </React.Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
