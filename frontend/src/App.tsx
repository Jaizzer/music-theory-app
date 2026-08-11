// The router + auth gate. Signed out -> AuthPanel, full stop, no routes
// are even mounted. Signed in -> a persistent header (email + sign out,
// needed on every page) wraps whatever the router renders. Pages compose
// features together (see src/pages/) — this file only decides "which page,"
// never reaches into a feature's internals itself.
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router';
import { authClient, useSession } from './lib/authClient.ts';
import AuthPanel from './features/auth/AuthPanel.tsx';
import EmailVerificationBanner from './features/auth/EmailVerificationBanner.tsx';
import HubPage from './pages/HubPage.tsx';
import ModeDrillPage from './pages/ModeDrillPage.tsx';
import FretboardIdentifierPage from './pages/FretboardIdentifierPage.tsx';
import ScaleDegreePage from './pages/ScaleDegreePage.tsx';
import FriendsPage from './pages/FriendsPage.tsx';
import ResetPasswordPage from './pages/ResetPasswordPage.tsx';
import Button from './components/Button.tsx';
import AuthHero from './components/AuthHero.tsx';

export default function App() {
	const { data: session, isPending } = useSession();

	// The title renders immediately either way — only the body beneath it
	// waits on the session check — so there's no flash of a blank page
	// while Better Auth's session request is in flight. Routed (not just
	// AuthPanel directly) so /reset-password?token=... — reachable from a
	// signed-out email link — has somewhere to go; the wildcard route is
	// what respects isPending, so a direct reset-password link doesn't wait
	// on a session check it doesn't need.
	if (!session) {
		return (
			<BrowserRouter>
				<main className='relative flex min-h-screen items-center justify-center overflow-hidden px-4'>
					<AuthHero />
					<div className='w-full max-w-sm space-y-6'>
						<h1 className='text-center text-2xl font-bold text-text'>
							Fret<span className='text-accent'>Rank</span>
						</h1>
						<Routes>
							<Route
								path='/reset-password'
								element={<ResetPasswordPage />}
							/>
							<Route
								path='*'
								element={
									isPending ? (
										<p className='text-center text-sm text-text-muted'>
											Loading…
										</p>
									) : (
										<AuthPanel />
									)
								}
							/>
						</Routes>
					</div>
				</main>
			</BrowserRouter>
		);
	}

	return (
		<BrowserRouter>
			<div className='mx-auto max-w-3xl px-4'>
				<header className='flex items-center justify-between border-b border-border-muted py-4'>
					<Link to='/' className='text-lg font-bold text-text'>
						Fret<span className='text-accent'>Rank</span>
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

				{!session.user.emailVerified && (
					<div className='pt-4'>
						<EmailVerificationBanner email={session.user.email} />
					</div>
				)}

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
