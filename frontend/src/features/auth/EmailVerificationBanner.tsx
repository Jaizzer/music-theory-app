// Shown just below the signed-in header whenever the current user hasn't
// verified their email yet. Verification already fires automatically on
// sign-up (see backend/src/lib/auth.ts's sendOnSignUp), but that's an
// invisible server-side detail — this is the visible, actionable half:
// resend the email, see confirmation it went out.
import { useState } from 'react';
import { authClient } from '../../lib/authClient.ts';
import Button from '../../components/Button.tsx';

interface EmailVerificationBannerProps {
	email: string;
}

export default function EmailVerificationBanner({
	email,
}: EmailVerificationBannerProps) {
	const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

	async function handleResend() {
		setStatus('sending');
		await authClient.sendVerificationEmail({ email, callbackURL: '/' });
		setStatus('sent');
	}

	return (
		<div className='flex flex-wrap items-center justify-between gap-2 rounded-md border border-accent/30 bg-accent/10 px-4 py-2 text-sm'>
			<span className='text-text'>
				Verify your email to secure your account.
			</span>
			{status === 'sent' ? (
				<span className='text-text-muted'>Sent!</span>
			) : (
				<Button
					type='button'
					variant='ghost'
					disabled={status === 'sending'}
					onClick={() => void handleResend()}
					className='px-3 py-1 text-xs'
				>
					{status === 'sending' ? 'Sending…' : 'Resend email'}
				</Button>
			)}
		</div>
	);
}
