import { Link } from 'react-router';
import ScaleDegreeGame from '../features/scale-degree/ScaleDegreeGame.tsx';

export default function ScaleDegreePage() {
	return (
		<div className='space-y-4 py-6'>
			<Link to='/' className='text-sm text-accent hover:underline'>
				&larr; Back to hub
			</Link>
			<h1 className='text-xl font-bold text-text'>Scale Degree</h1>
			<ScaleDegreeGame />
		</div>
	);
}
