import { Link } from 'react-router';
import ModeDrillGame from '../features/mode-drill/ModeDrillGame.tsx';

export default function ModeDrillPage() {
	return (
		<div className='space-y-4 py-6'>
			<Link to='/' className='text-sm text-accent hover:underline'>
				&larr; Back to hub
			</Link>
			<h1 className='text-xl font-bold text-text'>Mode Drill</h1>
			<ModeDrillGame />
		</div>
	);
}
