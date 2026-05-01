import { EndGameData } from '../../types/game.types';

export interface EndGameScreenProps {
  data: EndGameData;
  onRetry: () => void;
  onBackToMenu: () => void;
  onShare?: () => void;
  isVisible: boolean;
}

export interface ThemeComponentProps {
  data: EndGameData;
  onRetry: () => void;
  onBackToMenu: () => void;
}
