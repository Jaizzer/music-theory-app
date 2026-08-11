export default {
	'*.{js,jsx,ts,tsx}': ['eslint', 'prettier --check'],
	'*.{json,yml,yaml,md}': ['prettier --check'],
	// tsconfig.app.json/tsconfig.node.json both already set noEmit: true, so
	// plain `tsc -b` here only typechecks — same command the build script
	// uses, just without vite build after it.
	'*.{ts,tsx}': [() => 'tsc -b'],
};
