// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';

export default defineConfig(
	// Compiled/generated output — dist/ (tsc's build output) and
	// src/database/generated/ (Prisma's client) — isn't source we wrote, so
	// it shouldn't be linted as if it were. Without this, ESLint tries to
	// apply TypeScript-only rules to plain compiled .js and errors out
	// rather than just skipping it.
	{ ignores: ['dist/**', 'src/database/generated/**'] },
	{
		files: ['src/**/*.ts'],
		extends: [
			js.configs.recommended,
			// Type-checked rulesets catch bugs plain syntactic linting can't
			// (e.g. floating promises, unsafe `any` flow) — worth the extra
			// cost of ESLint needing the TS type-checker (`projectService`
			// below) to run.
			tseslint.configs.strictTypeChecked,
			tseslint.configs.stylisticTypeChecked,
		],
		languageOptions: {
			globals: {
				...globals.node,
			},
			parserOptions: {
				// Lets typescript-eslint find the right tsconfig for each
				// file automatically instead of hand-listing `project`.
				projectService: true,
			},
		},
		rules: {
			// Without this, `` `port ${someNumber}` `` is flagged as unsafe
			// even though numbers stringify perfectly safely.
			'@typescript-eslint/restrict-template-expressions': [
				'error',
				{ allowNumber: true },
			],
		},
	},
	// Must come last: turns off any ESLint stylistic rule that would fight
	// with Prettier's formatting decisions.
	prettierConfig,
);
