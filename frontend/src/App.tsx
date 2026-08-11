// The whole page is deliberately just a wiring demo: it proves the
// frontend can reach the backend (health check) and that a full auth round
// trip works cross-origin (AuthPanel) — replace this with real UI once
// those are confirmed working in your environment too.
import { useEffect, useState } from 'react';
import { apiFetch } from './lib/api.ts';
import AuthPanel from './features/auth/AuthPanel.tsx';

function HealthStatus() {
	const [status, setStatus] = useState<'checking' | 'ok' | 'error'>(
		'checking',
	);

	useEffect(() => {
		apiFetch<{ status: string }>('/api/v1/health')
			.then((body) => {
				setStatus(body.status === 'ok' ? 'ok' : 'error');
			})
			.catch(() => {
				setStatus('error');
			});
	}, []);

	const color =
		status === 'ok'
			? 'text-green-600'
			: status === 'error'
				? 'text-red-600'
				: 'text-slate-400';

	return (
		<p className={`text-sm ${color}`}>
			Backend:{' '}
			{status === 'checking'
				? 'checking…'
				: status === 'ok'
					? 'ok'
					: 'unreachable'}
		</p>
	);
}

export default function App() {
	return (
		<main className='mx-auto mt-16 max-w-sm space-y-6 px-4'>
			<div>
				<h1 className='text-2xl font-bold'>Music Theory App</h1>
				<HealthStatus />
			</div>
			<AuthPanel />
		</main>
	);
}
