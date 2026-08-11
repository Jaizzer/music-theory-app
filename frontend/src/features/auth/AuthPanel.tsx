// Demonstrates the full auth loop end to end: sign up / sign in against
// Better Auth (authClient.ts), then read/update the signed-in user's
// profile through the backend's own /api/v1/users route (api.ts) — the
// same session cookie authenticates both, which is the whole point of the
// two working together.
import { useEffect, useState } from 'react';
import { authClient, useSession } from '../../lib/authClient.ts';
import { apiFetch, ApiError } from '../../lib/api.ts';

interface Profile {
	id: string;
	email: string;
	name: string | null;
}

function SignedOutView() {
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

function SignedInView({ userId }: { userId: string }) {
	const [profile, setProfile] = useState<Profile | null>(null);
	const [nameDraft, setNameDraft] = useState('');
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		apiFetch<{ user: Profile }>(`/api/v1/users/${userId}`)
			.then((body) => {
				setProfile(body.user);
				setNameDraft(body.user.name ?? '');
			})
			.catch((err: unknown) => {
				setError(
					err instanceof ApiError ? err.message : 'Request failed.',
				);
			});
	}, [userId]);

	async function handleSave(event: React.FormEvent) {
		event.preventDefault();
		setError(null);
		try {
			const body = await apiFetch<{ user: Profile }>(
				`/api/v1/users/${userId}`,
				{ method: 'PUT', body: JSON.stringify({ name: nameDraft }) },
			);
			setProfile(body.user);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : 'Request failed.');
		}
	}

	if (!profile) {
		return <p>Loading profile…</p>;
	}

	return (
		<div className='space-y-3'>
			<p>
				Signed in as <strong>{profile.email}</strong>
			</p>
			<form
				onSubmit={(event) => void handleSave(event)}
				className='flex gap-2'
			>
				<input
					value={nameDraft}
					onChange={(event) => {
						setNameDraft(event.target.value);
					}}
					className='rounded border px-3 py-2'
				/>
				<button
					type='submit'
					className='rounded bg-slate-900 px-4 py-2 text-white'
				>
					Save name
				</button>
			</form>
			{error && <p className='text-sm text-red-600'>{error}</p>}
			<button
				type='button'
				onClick={() => void authClient.signOut()}
				className='text-sm underline'
			>
				Sign out
			</button>
		</div>
	);
}

export default function AuthPanel() {
	// Better Auth's own hook — re-runs automatically on sign-in/sign-out, so
	// this component switches views without any manual state syncing.
	const { data: session, isPending } = useSession();

	if (isPending) {
		return <p>Loading session…</p>;
	}

	return session ? (
		<SignedInView userId={session.user.id} />
	) : (
		<SignedOutView />
	);
}
