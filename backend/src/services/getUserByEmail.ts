import { prisma } from '../database/prismaClient.ts';

// Sits next to getUserById.ts for the same reason — used by more than one
// consumer (the friends feature, to resolve who a request is being sent
// to) so it belongs in the shared layer, not inside one feature folder.
export default async function getUserByEmail(email: string) {
	return prisma.user.findUnique({ where: { email } });
}
