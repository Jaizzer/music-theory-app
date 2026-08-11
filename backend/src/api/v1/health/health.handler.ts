// A small, deliberately boring example route — read this file first if
// you're new to the codebase. It shows the shape every other route in
// api/v1/ follows: a Router (health.route.ts) wires a path to a handler
// (this file), the handler stays thin, and it calls a service for actual
// work. There's no separate health.service.ts here only because there's
// nothing to reuse elsewhere — see users/ for a route that does have one.
import type { Request, Response } from 'express';
import { prisma } from '../../../database/prismaClient.ts';

export async function getHealth(_req: Request, res: Response) {
	try {
		// Cheapest possible query that proves the database connection (and
		// credentials) actually work, not just that Postgres is reachable.
		await prisma.$queryRaw`SELECT 1`;
		res.status(200).json({ status: 'ok', database: 'ok' });
	} catch (error) {
		console.error('Health check database query failed:', error);
		res.status(503).json({ status: 'error', database: 'unreachable' });
	}
}
