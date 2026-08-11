// Sign-up / sign-in against Better Auth (authClient.ts). This is only ever
// rendered by App.tsx's auth gate when there's no session — once signed
// in, the router takes over and this unmounts. Profile viewing/editing and
// sign-out live at the app layer now (see App.tsx's header), not here,
// since they're needed on every page, not just this one.
import { useState } from 'react';
import { authClient } from '../../lib/authClient.ts';

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
		<form
			onSubmit={(event) => void handleSubmit(event)}
			className='space-y-3'
		>
			<div className='flex gap-2 text-sm'>
				<button
					type='button'
					onClick={() => {
						setMode('sign-up');
					}}
					className={mode === 'sign-up' ? 'font-bold underline' : ''}
				>
					Sign up
				</button>
				<button
					type='button'
					onClick={() => {
						setMode('sign-in');
					}}
					className={mode === 'sign-in' ? 'font-bold underline' : ''}
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
					className='block w-full rounded border px-3 py-2'
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
				className='block w-full rounded border px-3 py-2'
				required
			/>
			<input
				type='password'
				value={password}
				onChange={(event) => {
					setPassword(event.target.value);
				}}
				placeholder='Password'
				className='block w-full rounded border px-3 py-2'
				minLength={8}
				required
			/>

			{error && <p className='text-sm text-red-600'>{error}</p>}

			<button
				type='submit'
				className='rounded bg-slate-900 px-4 py-2 text-white'
			>
				{mode === 'sign-up' ? 'Create account' : 'Sign in'}
			</button>
		</form>
	);
}
