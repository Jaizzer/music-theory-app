// A single choke point for every transactional email Better Auth sends
// (email verification, password reset) — src/lib/auth.ts calls this
// instead of talking to Resend directly, so both call sites share the same
// dev-fallback behavior.
//
// `RESEND_API_KEY` is optional, same precedent as `googleClient` in
// config/env.ts: requiring every contributor to have a personal Resend
// account just to run `npm run dev` would be unnecessary friction. Without
// it, this just logs the email — the same behavior sendVerificationEmail
// already had before Resend was wired up, so local dev and CI (which also
// doesn't set this secret) keep working with arbitrary/burner emails.
//
// Sending from Resend's sandbox address (no verified domain) only reaches
// the Resend account owner's own inbox — real delivery to arbitrary
// recipients needs a verified sending domain, a later step outside this
// app's code.
import { Resend } from 'resend';
import config from '../config/env.ts';

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

export async function sendAuthEmail(
	to: string,
	subject: string,
	html: string,
): Promise<void> {
	if (!resend) {
		console.log(`[dev email] To: ${to}\nSubject: ${subject}\n${html}`);
		return;
	}

	await resend.emails.send({
		from: 'FretRank <onboarding@resend.dev>',
		to,
		subject,
		html,
	});
}
