// The router + auth gate. Signed out -> AuthPanel, full stop, no routes
// are even mounted. Signed in -> a persistent header (email + sign out,
// needed on every page) wraps whatever the router renders. Pages compose
// features together (see src/pages/) — this file only decides "which page,"
// never reaches into a feature's internals itself.
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router';
import { authClient, useSession } from './lib/authClient.ts';
import AuthPanel from './features/auth/AuthPanel.tsx';
import HubPage from './pages/HubPage.tsx';
import ModeDrillPage from './pages/ModeDrillPage.tsx';
import FretboardIdentifierPage from './pages/FretboardIdentifierPage.tsx';
import ScaleDegreePage from './pages/ScaleDegreePage.tsx';
import FriendsPage from './pages/FriendsPage.tsx';
import Button from './components/Button.tsx';

export default function App() {
	const { data: session, isPending } = useSession();

	// The title renders immediately either way — only the body beneath it
	// waits on the session check — so there's no flash of a blank page
	// while Better Auth's session request is in flight.
	if (!session) {
		return (
			<main className='mx-auto mt-16 max-w-sm space-y-6 px-4'>
				<h1 className='text-2xl font-bold text-text'>
					Music Theory <span className='text-accent'>App</span>
				</h1>
				{isPending ? (
					<p className='text-sm text-text-muted'>Loading…</p>
				) : (
					<AuthPanel />
				)}
			</main>
		);
	}

	return (
		<BrowserRouter>
			<div className='mx-auto max-w-3xl px-4'>
				<header className='flex items-center justify-between border-b border-border-muted py-4'>
					<Link to='/' className='text-lg font-bold text-text'>
						Music Theory <span className='text-accent'>App</span>
					</Link>
					<div className='flex items-center gap-3 text-sm'>
						<span className='text-text-muted'>
							{session.user.email}
						</span>
						<Button
							type='button'
							variant='ghost'
							onClick={() => void authClient.signOut()}
							className='px-3 py-1.5 text-xs'
						>
							Sign out
						</Button>
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
					<Route
						path='/games/scale-degree'
						element={<ScaleDegreePage />}
					/>
					<Route path='/friends' element={<FriendsPage />} />
					<Route path='*' element={<Navigate to='/' replace />} />
				</Routes>
			</div>
		</BrowserRouter>
	);
}
