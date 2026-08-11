// A single shared PrismaClient instance, imported everywhere data access is
// needed (see src/services/). Creating more than one per process wastes
// connections and defeats Prisma's internal connection pooling.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client.ts';
import config from '../config/env.ts';

// The "driver adapter" pattern: instead of Prisma's Rust query engine
// opening its own connection to Postgres, we hand it a `pg` connection pool
// directly. This is what lets PrismaClient run in serverless environments
// (like the Vercel function this API deploys to) without shipping a native
// binary alongside it.
const adapter = new PrismaPg({ connectionString: config.databaseUrl });

export const prisma = new PrismaClient({ adapter });
