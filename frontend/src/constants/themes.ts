import { GameTheme } from '../types/game.types';

export const ThemeConfigs = {
  [GameTheme.CYBER_ARENA]: {
    id: GameTheme.CYBER_ARENA,
    name: 'Cyber Arena',
    fonts: { heading: 'font-orbitron', body: 'font-rajdhani' },
    victory: {
      bg: 'bg-cyber-bg',
      title: 'VICTORY!',
      subtitle: 'ACCEPTED // CODE COMPILED',
      emoji: '🏆',
      particleColors: ['#00E5FF', '#8B5CF6', '#22C55E', '#FFFFFF'],
      motivationalQuote: 'System override successful. You dominate the grid.',
    },
    defeat: {
      bg: 'bg-cyber-bg-dark',
      title: 'SYSTEM FAILURE',
      subtitle: 'ERROR 0x8F2A // COMPILATION FAILED',
      emoji: '💀',
      particleColors: ['#FF1744', '#00838F', '#4A148C', '#222222'],
      motivationalQuote: 'Every bug is a lesson. Debug and retry.',
    }
  },
  [GameTheme.SPACE_OPS]: {
    id: GameTheme.SPACE_OPS,
    name: 'Space Ops',
    fonts: { heading: 'font-chakra', body: 'font-chakra' },
    victory: {
      bg: 'bg-space-bg',
      title: 'MISSION COMPLETE',
      subtitle: 'MISSION ID: BB-2026-ALPHA',
      emoji: '🚀',
      particleColors: ['#22D3EE', '#E879F9', '#1D4ED8', '#FFFFFF'],
      motivationalQuote: 'The galaxy acknowledges your brilliance.',
    },
    defeat: {
      bg: 'bg-space-bg-dark',
      title: 'MISSION FAILED',
      subtitle: 'SIGNAL LOST — ALL UNITS REPORT',
      emoji: '💥',
      particleColors: ['#D50000', '#FF6F00', '#006064', '#111111'],
      motivationalQuote: 'Even the best pilots crash. Recalibrate.',
    }
  },
  [GameTheme.SAMURAI_DOJO]: {
    id: GameTheme.SAMURAI_DOJO,
    name: 'Samurai Dojo',
    fonts: { heading: 'font-noto-serif-jp', body: 'font-noto-sans-jp' },
    victory: {
      bg: 'bg-dojo-ink',
      title: '勝',
      subtitle: 'MASTERY ACHIEVED',
      emoji: '⚔️',
      particleColors: ['#FFC0CB', '#FFFFFF', '#FFB6C1', '#D4AF37'],
      motivationalQuote: 'Your discipline sharpens the blade.',
    },
    defeat: {
      bg: 'bg-dojo-ink-deep',
      title: '敗',
      subtitle: 'HONOR IN DEFEAT',
      emoji: '⚔️',
      particleColors: ['#4A4A4A', '#8B0000', '#222222', '#8B7355'],
      motivationalQuote: 'Defeat forges the warrior.',
    }
  },
  [GameTheme.PIXEL_ARCADE]: {
    id: GameTheme.PIXEL_ARCADE,
    name: 'Pixel Arcade',
    fonts: { heading: 'font-press-start', body: 'font-press-start' },
    victory: {
      bg: 'bg-pixel-bg',
      title: 'STAGE CLEAR!',
      subtitle: 'K.O.! YOU WIN!',
      emoji: '🏆',
      particleColors: ['#FF006E', '#3A86FF', '#FFBE0B', '#06FFA5', '#8338EC'],
      motivationalQuote: 'A new high score awaits!',
    },
    defeat: {
      bg: 'bg-pixel-bg-dark',
      title: 'GAME OVER',
      subtitle: 'CONTINUE? 9...',
      emoji: '💀',
      particleColors: ['#FF0040', '#12121F', '#2A2A3E', '#FF006E'],
      motivationalQuote: 'Game Over doesn\'t mean Give Up.',
    }
  },
  [GameTheme.MYTHIC_RPG]: {
    id: GameTheme.MYTHIC_RPG,
    name: 'Mythic RPG',
    fonts: { heading: 'font-cinzel', body: 'font-lora' },
    victory: {
      bg: 'bg-rpg-night',
      title: 'QUEST COMPLETE',
      subtitle: 'The Guild salutes you, Hero!',
      emoji: '🐉',
      particleColors: ['#F59E0B', '#6D28D9', '#FEF3C7', '#16A34A'],
      motivationalQuote: 'Your legend grows with every victory.',
    },
    defeat: {
      bg: 'bg-rpg-night-deep',
      title: 'QUEST FAILED',
      subtitle: 'Darkness spreads...',
      emoji: '💀',
      particleColors: ['#7F1D1D', '#3B0764', '#92400E', '#000000'],
      motivationalQuote: 'Every hero falls. True heroes rise again.',
    }
  },
  [GameTheme.SPORTS_ARENA]: {
    id: GameTheme.SPORTS_ARENA,
    name: 'Sports Arena',
    fonts: { heading: 'font-teko', body: 'font-barlow' },
    victory: {
      bg: 'bg-sports-dark',
      title: 'GOAL!',
      subtitle: 'FULL TIME — YOU WIN!',
      emoji: '📣',
      particleColors: ['#2563EB', '#FBBF24', '#FFFFFF'],
      motivationalQuote: 'A champion performance!',
    },
    defeat: {
      bg: 'bg-sports-dark-deep',
      title: 'DEFEATED',
      subtitle: 'FULL TIME — BETTER LUCK NEXT TIME',
      emoji: '😞',
      particleColors: ['#B91C1C', '#4B5563', '#9CA3AF', '#000000'],
      motivationalQuote: 'Champions are made in rematches.',
    }
  }
};
