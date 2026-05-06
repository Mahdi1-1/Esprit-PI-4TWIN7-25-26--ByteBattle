import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: process.env.CI ? { junit: './reports/junit/junit.xml' } : undefined,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/services/duelsService.ts',
        'src/services/hintsService.ts',
        'src/services/leaderboardService.ts',
        'src/services/challengesService.ts',
        'src/services/avatarService.ts',
        'src/services/canvasService.ts',
        'src/services/submissionsService.ts',
        'src/hooks/useAnimationFrame.ts',
        'src/hooks/useInterval.ts',
        'src/hooks/useKeyboardShortcuts.ts',
        'src/hooks/useCountUp.ts',
        'src/hooks/useTypewriter.ts',
        'src/hooks/useEndGame.ts',
        'src/hooks/useVoiceSettings.ts',
        'src/hooks/useParticleSystem.ts',
        'src/components/ProblemCard.tsx',
        'src/pages/Problems.tsx',
        'src/utils/colors.ts',
        'src/utils/easing.ts',
        'src/utils/random.ts',
      ],
      exclude: [
        'build/**',
        'dist/**',
        'node_modules/**',
        'src/**/*.test.*',
        'src/setupTests.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
