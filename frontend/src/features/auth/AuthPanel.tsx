// Sign-up / sign-in against Better Auth (authClient.ts). This is only ever
// rendered by App.tsx's auth gate when there's no session — once signed
// in, the router takes over and this unmounts. Profile viewing/editing and
// sign-out live at the app layer now (see App.tsx's header), not here,
// since they're needed on every page, not just this one.
import { useState } from 'react';
import { authClient } from '../../lib/authClient.ts';
import Card from '../../components/Card.tsx';
import Button from '../../components/Button.tsx';

const INPUT_CLASSES =
	'block w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none';

export default function AuthPanel() {
	const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-up');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [name, setName] = useState('');
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setError(null);

		const result =
			mode === 'sign-up'
				? await authClient.signUp.email({ email, password, name })
				: await authClient.signIn.email({ email, password });

		if (result.error) {
			setError(result.error.message ?? 'Something went wrong.');
		}
	}

	return (
		<Card className='p-6'>
			<form
				onSubmit={(event) => void handleSubmit(event)}
				className='space-y-4'
			>
				<div className='flex gap-1 rounded-md bg-bg p-1 text-sm'>
					<button
						type='button'
						onClick={() => {
							setMode('sign-up');
						}}
						className={`flex-1 rounded px-3 py-1.5 font-semibold transition-colors ${
							mode === 'sign-up'
								? 'bg-surface-hover text-text'
								: 'text-text-muted hover:text-text'
						}`}
					>
						Sign up
					</button>
					<button
						type='button'
						onClick={() => {
							setMode('sign-in');
						}}
						className={`flex-1 rounded px-3 py-1.5 font-semibold transition-colors ${
							mode === 'sign-in'
								? 'bg-surface-hover text-text'
								: 'text-text-muted hover:text-text'
						}`}
					>
						Sign in
					</button>
				</div>

				{mode === 'sign-up' && (
					<input
						value={name}
						onChange={(event) => {
							setName(event.target.value);
						}}
						placeholder='Name'
						className={INPUT_CLASSES}
						required
					/>
				)}
				<input
					type='email'
					value={email}
					onChange={(event) => {
						setEmail(event.target.value);
					}}
					placeholder='Email'
					className={INPUT_CLASSES}
					required
				/>
				<input
					type='password'
					value={password}
					onChange={(event) => {
						setPassword(event.target.value);
					}}
					placeholder='Password'
					className={INPUT_CLASSES}
					minLength={8}
					required
				/>

				{error && <p className='text-sm text-error'>{error}</p>}

				<Button type='submit' className='w-full'>
					{mode === 'sign-up' ? 'Create account' : 'Sign in'}
				</Button>
			</form>
		</Card>
	);
}
