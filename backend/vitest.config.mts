import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'src/main.ts',
        'src/**/*.module.ts',
        'src/**/*.dto.ts',
        'src/prisma/**/*.ts',
        'src/**/*.validator.ts',
        'src/**/*.decorator.ts',
        'src/**/*.strategy.ts',
        'src/**/*.guard.ts',
        'src/modules/audit/audit.interceptor.ts',
        'src/**/*.controller.ts',
        'src/app.service.ts',
      ],
      thresholds: {
        statements: 65,
        branches: 35,
        functions: 70,
        lines: 65,
      },
    },
  },
  plugins: [swc.vite()],
});
