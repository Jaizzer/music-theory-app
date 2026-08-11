import { prisma } from '../database/prismaClient.ts';

// A standalone service (rather than inlining this query in the handler) so
// both the users route and the auth middleware can share the exact same
// lookup logic.
export default async function getUserById(id: string) {
	return prisma.user.findUnique({ where: { id } });
}
