import { Link } from 'react-router';
import FriendsPanel from '../features/friends/FriendsPanel.tsx';

export default function FriendsPage() {
	return (
		<div className='space-y-4 py-6'>
			<Link to='/' className='text-sm text-accent hover:underline'>
				&larr; Back to hub
			</Link>
			<h1 className='text-xl font-bold text-text'>Friends</h1>
			<FriendsPanel />
		</div>
	);
}
