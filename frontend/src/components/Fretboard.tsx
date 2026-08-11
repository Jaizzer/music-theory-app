// A real guitar-neck rendering — wood-gradient body, a nut, one line per
// string, fret-wire dividers, and inlay dots at the standard positions
// (3/5/7/9 single, 12 double) — ported from ../scale-degree's CSS, which
// is the actual source of this look (this app's version of it was
// previously just a grid of bordered boxes with no resemblance to a
// fretboard at all). Shared by both fretboard games — FretboardIdentifierGame
// (one marker) and ScaleDegreeGame (two: root + target) — parameterized by
// `markers` rather than owning any game-specific logic itself.
import { FRET_COUNT, OPEN_STRING_NOTES } from '../lib/fretboardPositions.ts';

const SINGLE_DOT_FRETS = new Set([3, 5, 7, 9]);
const DOUBLE_DOT_FRET = 12;

export interface FretboardMarker {
	stringIndex: number;
	fret: number;
	label: string;
	color: 'root' | 'target';
}

interface FretboardProps {
	markers: FretboardMarker[];
}

const MARKER_COLOR_CLASSES: Record<FretboardMarker['color'], string> = {
	root: 'bg-root text-black',
	target: 'bg-target text-white',
};

export default function Fretboard({ markers }: FretboardProps) {
	const frets = Array.from({ length: FRET_COUNT + 1 }, (_, fret) => fret);
	const strings = Array.from(
		{ length: OPEN_STRING_NOTES.length },
		(_, stringIndex) => stringIndex,
	);

	return (
		<div className='rounded-2xl bg-black p-3'>
			<div
				className='relative flex aspect-[3.2/1] flex-col overflow-hidden rounded-md border-l-4 md:border-l-8'
				style={{
					background: 'linear-gradient(90deg, #2b180d, #1a0f08)',
					borderLeftColor: '#eee',
				}}
			>
				{/* Inlay dots — one overlay spanning the whole neck height, dots
				    centered on the neck rather than tied to any one string, same
				    as a real fretboard's position markers. */}
				<div className='pointer-events-none absolute inset-0 z-0 flex'>
					{frets.map((fret) => (
						<div key={fret} className='relative flex-1'>
							{SINGLE_DOT_FRETS.has(fret) && (
								<span className='absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#bbb] md:h-4 md:w-4' />
							)}
							{fret === DOUBLE_DOT_FRET && (
								<>
									<span className='absolute top-[35%] left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#bbb] md:h-4 md:w-4' />
									<span className='absolute top-[65%] left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#bbb] md:h-4 md:w-4' />
								</>
							)}
						</div>
					))}
				</div>

				{strings.map((stringIndex) => (
					<div
						key={stringIndex}
						className='relative z-10 flex flex-1'
					>
						{/* The string itself — a thin line spanning the full row,
						    behind the fret cells and any marker on it. */}
						<div className='absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#8a8a8a]' />
						{frets.map((fret) => {
							const marker = markers.find(
								(m) =>
									m.stringIndex === stringIndex &&
									m.fret === fret,
							);
							return (
								<div
									key={fret}
									className='relative flex flex-1 items-center justify-center border-r border-[#5a5a5a] last:border-r-0'
								>
									{marker && (
										<span
											className={`z-20 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[10px] font-black shadow-[0_0_8px_rgba(0,0,0,0.6)] md:h-7 md:w-7 md:text-xs ${MARKER_COLOR_CLASSES[marker.color]}`}
										>
											{marker.label}
										</span>
									)}
								</div>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
}
