// The router + auth gate. Signed out -> AuthPanel, full stop, no routes
// are even mounted. Signed in -> a persistent header (email + sign out,
// needed on every page) wraps whatever the router renders. Pages compose
// features together (see src/pages/) — this file only decides "which page,"
// never reaches into a feature's internals itself.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { authClient, useSession } from './lib/authClient.ts';
import AuthPanel from './features/auth/AuthPanel.tsx';
import HubPage from './pages/HubPage.tsx';
import ModeDrillPage from './pages/ModeDrillPage.tsx';
import FretboardIdentifierPage from './pages/FretboardIdentifierPage.tsx';
import FriendsPage from './pages/FriendsPage.tsx';

export default function App() {
	const { data: session, isPending } = useSession();

	// The title renders immediately either way — only the body beneath it
	// waits on the session check — so there's no flash of a blank page
	// while Better Auth's session request is in flight.
	if (!session) {
		return (
			<main className='mx-auto mt-16 max-w-sm space-y-6 px-4'>
				<h1 className='text-2xl font-bold'>Music Theory App</h1>
				{isPending ? (
					<p className='text-sm text-slate-400'>Loading…</p>
				) : (
					<AuthPanel />
				)}
			</main>
		);
	}

	return (
		<BrowserRouter>
			<div className='mx-auto max-w-3xl px-4'>
				<header className='flex items-center justify-between py-4'>
					<h1 className='text-xl font-bold'>Music Theory App</h1>
					<div className='flex items-center gap-3 text-sm text-slate-500'>
						<span>{session.user.email}</span>
						<button
							type='button'
							onClick={() => void authClient.signOut()}
							className='underline'
						>
							Sign out
						</button>
					</div>
				</header>

				<Routes>
					<Route path='/' element={<HubPage />} />
					<Route
						path='/games/mode-drill'
						element={<ModeDrillPage />}
					/>
					<Route
						path='/games/fretboard-identifier'
						element={<FretboardIdentifierPage />}
					/>
					<Route path='/friends' element={<FriendsPage />} />
					<Route path='*' element={<Navigate to='/' replace />} />
				</Routes>
			</div>
		</BrowserRouter>
	);
}
