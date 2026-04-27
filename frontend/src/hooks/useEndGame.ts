import { useState, useCallback } from 'react';
import { EndGameData } from '../types/game.types';

export const useEndGame = () => {
  const [endGameData, setEndGameData] = useState<EndGameData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const triggerEndGame = useCallback((data: EndGameData) => {
    setEndGameData(data);
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleRetry = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setEndGameData(null);
    }, 800);
  }, []);

  const handleBackToMenu = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setEndGameData(null);
    }, 800);
  }, []);

  return { endGameData, isEndGameVisible: isVisible, triggerEndGame, handleRetry, handleBackToMenu };
};
