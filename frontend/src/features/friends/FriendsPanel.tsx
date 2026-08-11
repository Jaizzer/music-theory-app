import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../../lib/api.ts';

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
			.catch(() => {
				// Leave data as null — the loading message just persists.
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
		return <p className='text-sm text-slate-400'>Loading friends…</p>;
	}

	return (
		<div className='space-y-4'>
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
					className='flex-1 rounded border px-3 py-2 text-sm'
					required
				/>
				<button
					type='submit'
					className='rounded bg-slate-900 px-3 py-2 text-sm text-white'
				>
					Add
				</button>
			</form>
			{error && <p className='text-sm text-red-600'>{error}</p>}

			{data.incomingRequests.length > 0 && (
				<div>
					<h3 className='text-sm font-bold'>Requests</h3>
					<ul className='space-y-1'>
						{data.incomingRequests.map((request) => (
							<li
								key={request.friendshipId}
								className='flex items-center justify-between text-sm'
							>
								<span>
									{request.user.name ?? request.user.email}
								</span>
								<span className='flex gap-2'>
									<button
										type='button'
										onClick={() =>
											void respond(
												request.friendshipId,
												'ACCEPTED',
											)
										}
										className='underline'
									>
										Accept
									</button>
									<button
										type='button'
										onClick={() =>
											void respond(
												request.friendshipId,
												'DECLINED',
											)
										}
										className='underline'
									>
										Decline
									</button>
								</span>
							</li>
						))}
					</ul>
				</div>
			)}

			<div>
				<h3 className='text-sm font-bold'>Friends</h3>
				<ul className='space-y-1 text-sm'>
					{data.friends.map((friend) => (
						<li key={friend.id}>{friend.name ?? friend.email}</li>
					))}
					{data.friends.length === 0 && (
						<li className='text-slate-400'>No friends yet.</li>
					)}
				</ul>
			</div>
		</div>
	);
}
