import { Link } from 'react-router';
import FretboardIdentifierGame from '../features/fretboard-identifier/FretboardIdentifierGame.tsx';

export default function FretboardIdentifierPage() {
	return (
		<div className='space-y-4 py-6'>
			<Link to='/' className='text-sm underline'>
				&larr; Back to hub
			</Link>
			<h1 className='text-xl font-bold'>Fretboard Identifier</h1>
			<FretboardIdentifierGame />
		</div>
	);
}
