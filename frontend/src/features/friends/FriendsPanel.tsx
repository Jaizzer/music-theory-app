import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../../lib/api.ts';
import Card from '../../components/Card.tsx';
import Button from '../../components/Button.tsx';

interface FriendUser {
	id: string;
	name: string | null;
	email: string;
}

interface FriendRequestEntry {
	friendshipId: string;
	user: FriendUser;
}

interface FriendsData {
	friends: FriendUser[];
	incomingRequests: FriendRequestEntry[];
	outgoingRequests: FriendRequestEntry[];
}

const INPUT_CLASSES =
	'block w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none';

export default function FriendsPanel() {
	const [data, setData] = useState<FriendsData | null>(null);
	const [email, setEmail] = useState('');
	const [error, setError] = useState<string | null>(null);
	// Bumped after every mutation (send/accept/decline) to trigger a refetch
	// — simpler than threading a refresh callback through every handler.
	const [refreshToken, setRefreshToken] = useState(0);

	useEffect(() => {
		apiFetch<FriendsData>('/api/v1/friends')
			.then((body) => {
				setData(body);
			})
			.catch((err: unknown) => {
				// Previously left `data` as null forever with no explanation —
				// surfaced now so a failed load is visible instead of an
				// indefinite "Loading…".
				setError(
					err instanceof ApiError
						? err.message
						: 'Could not load friends.',
				);
			});
	}, [refreshToken]);

	async function handleSend(event: React.FormEvent) {
		event.preventDefault();
		setError(null);
		try {
			await apiFetch('/api/v1/friends', {
				method: 'POST',
				body: JSON.stringify({ addresseeEmail: email }),
			});
			setEmail('');
			setRefreshToken((current) => current + 1);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : 'Request failed.');
		}
	}

	async function respond(
		friendshipId: string,
		status: 'ACCEPTED' | 'DECLINED',
	) {
		await apiFetch(`/api/v1/friends/${friendshipId}`, {
			method: 'PATCH',
			body: JSON.stringify({ status }),
		});
		setRefreshToken((current) => current + 1);
	}

	if (!data) {
		return (
			<p className='text-sm text-text-muted'>
				{error ?? 'Loading friends…'}
			</p>
		);
	}

	return (
		<div className='space-y-4'>
			<Card className='p-4'>
				<form
					onSubmit={(event) => void handleSend(event)}
					className='flex gap-2'
				>
					<input
						type='email'
						value={email}
						onChange={(event) => {
							setEmail(event.target.value);
						}}
						placeholder="Friend's email"
						className={INPUT_CLASSES}
						required
					/>
					<Button type='submit'>Add</Button>
				</form>
				{error && <p className='mt-2 text-sm text-error'>{error}</p>}
			</Card>

			{data.incomingRequests.length > 0 && (
				<Card className='p-4'>
					<h3 className='mb-2 text-sm font-bold tracking-wide text-text-muted uppercase'>
						Requests
					</h3>
					<ul className='space-y-2'>
						{data.incomingRequests.map((request) => (
							<li
								key={request.friendshipId}
								className='flex items-center justify-between text-sm'
							>
								<span className='text-text'>
									{request.user.name ?? request.user.email}
								</span>
								<span className='flex gap-2'>
									<Button
										type='button'
										onClick={() =>
											void respond(
												request.friendshipId,
												'ACCEPTED',
											)
										}
										className='px-2 py-1 text-xs'
									>
										Accept
									</Button>
									<Button
										variant='ghost'
										type='button'
										onClick={() =>
											void respond(
												request.friendshipId,
												'DECLINED',
											)
										}
										className='px-2 py-1 text-xs'
									>
										Decline
									</Button>
								</span>
							</li>
						))}
					</ul>
				</Card>
			)}

			<Card className='p-4'>
				<h3 className='mb-2 text-sm font-bold tracking-wide text-text-muted uppercase'>
					Friends
				</h3>
				<ul className='space-y-1 text-sm text-text'>
					{data.friends.map((friend) => (
						<li key={friend.id}>{friend.name ?? friend.email}</li>
					))}
					{data.friends.length === 0 && (
						<li className='text-text-dim'>No friends yet.</li>
					)}
				</ul>
			</Card>
		</div>
	);
}
