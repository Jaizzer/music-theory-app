// Read by every `prisma` CLI command (generate, migrate dev, migrate
// deploy...). Centralizing the connection string through our own
// config/env.ts — instead of letting Prisma read a raw DATABASE_URL env
// var itself — means there's exactly one place that decides which database
// a given NODE_ENV talks to.
import { defineConfig } from 'prisma/config';
import config from '../config/env.ts';

export default defineConfig({
	schema: 'schema.prisma',
	migrations: {
		path: 'migrations',
	},
	datasource: {
		url: config.databaseUrl,
	},
});
