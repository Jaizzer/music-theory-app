// Decorative background for the signed-out landing/auth screen — faint
// sound-wave strokes, staff lines, and inlay-style dots (echoing
// Fretboard.tsx's marker motif) hand-drawn as inline SVG. No illustration
// library or external asset: same "hand-written SVG" approach already
// used for the fretboard itself. Purely decorative (aria-hidden), kept low
// stroke-opacity so it reads as background texture rather than competing
// with the form in front of it.
export default function AuthHero() {
	return (
		<svg
			className='pointer-events-none absolute inset-0 -z-10 h-full w-full'
			viewBox='0 0 800 600'
			preserveAspectRatio='xMidYMid slice'
			aria-hidden='true'
		>
			{/* Staff lines, upper band. */}
			<g stroke='#8b949e' strokeWidth='1' opacity='0.18'>
				<line x1='40' y1='90' x2='420' y2='90' />
				<line x1='40' y1='108' x2='420' y2='108' />
				<line x1='40' y1='126' x2='420' y2='126' />
				<line x1='40' y1='144' x2='420' y2='144' />
				<line x1='40' y1='162' x2='420' y2='162' />
			</g>

			{/* Staff lines, lower band, mirrored to the right. */}
			<g stroke='#8b949e' strokeWidth='1' opacity='0.14'>
				<line x1='380' y1='460' x2='760' y2='460' />
				<line x1='380' y1='478' x2='760' y2='478' />
				<line x1='380' y1='496' x2='760' y2='496' />
				<line x1='380' y1='514' x2='760' y2='514' />
				<line x1='380' y1='532' x2='760' y2='532' />
			</g>

			{/* Sound-wave strokes. */}
			<path
				d='M0,260 C50,210 150,310 200,260 C250,210 350,310 400,260 C450,210 550,310 600,260 C650,210 750,310 800,260'
				fill='none'
				stroke='#3b82f6'
				strokeWidth='2'
				opacity='0.22'
			/>
			<path
				d='M0,340 C60,380 140,300 200,340 C260,380 340,300 400,340 C460,380 540,300 600,340 C660,380 740,300 800,340'
				fill='none'
				stroke='#3b82f6'
				strokeWidth='1.5'
				opacity='0.15'
			/>

			{/* Inlay-dot accents, echoing the fretboard's marker positions. */}
			<g fill='#00ffa3' opacity='0.25'>
				<circle cx='120' cy='230' r='4' />
				<circle cx='300' cy='400' r='3' />
				<circle cx='520' cy='150' r='3.5' />
				<circle cx='680' cy='420' r='4' />
				<circle cx='220' cy='500' r='3' />
			</g>
		</svg>
	);
}
