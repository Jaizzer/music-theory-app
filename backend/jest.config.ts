import type { Config } from 'jest';
import { createDefaultEsmPreset } from 'ts-jest';

// ts-jest's ESM preset is what makes `import`/`export` (rather than
// `require`) work inside Jest without a separate compile step — it's why
// the "test" script in package.json launches Node with
// --experimental-vm-modules.
const presetConfig = createDefaultEsmPreset({});

export default {
	...presetConfig,
	testEnvironment: 'node',
	testMatch: [
		'**/tests/**/*.test.ts',
		'**/__tests__/**/*.test.ts',
		'**/?(*.)+(spec|test).ts',
	],
	// Source files import each other as `./foo.js` at the type level (see
	// tsconfig's rewriteRelativeImportExtensions) — this maps those back to
	// the `.ts` source so ts-jest can actually resolve them.
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	setupFiles: ['dotenv/config'],
	testTimeout: 30000,
} satisfies Config;
