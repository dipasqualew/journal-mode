import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
    paths: [
        './**/*.feature'
    ],
    require: [
        './**/*.step.ts'
    ],
    outputDir: './gen',
    importTestFrom: './fixtures.ts',
});

export default defineConfig({
    testDir,
});
