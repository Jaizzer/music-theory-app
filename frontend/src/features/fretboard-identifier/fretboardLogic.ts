// A new game, not a port — this is deliberately simpler than ../scale-degree's
// interval-recognition mechanic: given a highlighted position on a virtual
// fretboard (the "orb"), identify the raw note name at that fret/string, not
// an interval between two points. Pure functions, no DOM, so they're
// directly unit-testable — see fretboardLogic.test.ts.
export const CHROMATIC_NOTES = [
	'C',
	'C#',
	'D',
	'D#',
	'E',
	'F',
	'F#',
	'G',
	'G#',
	'A',
	'A#',
	'B',
] as const;

export type Note = (typeof CHROMATIC_NOTES)[number];

// Standard tuning, string index 0 = high E (top of the fretboard as drawn)
// through index 5 = low E (bottom) — same visual convention as
// ../scale-degree's fretboard.
export const OPEN_STRING_NOTES: readonly Note[] = [
	'E',
	'B',
	'G',
	'D',
	'A',
	'E',
];

export const FRET_COUNT = 12;

export interface FretboardQuestion {
	stringIndex: number; // 0-5
	fret: number; // 0-FRET_COUNT
}

export function getNoteAtPosition(stringIndex: number, fret: number): Note {
	const openNote = OPEN_STRING_NOTES[stringIndex];
	if (openNote === undefined) {
		throw new Error(`Invalid string index ${String(stringIndex)}.`);
	}

	const openIndex = CHROMATIC_NOTES.indexOf(openNote);
	const note = CHROMATIC_NOTES[(openIndex + fret) % 12];
	if (note === undefined) {
		throw new Error('Note lookup failed.');
	}

	return note;
}

export function generateQuestion(): FretboardQuestion {
	return {
		stringIndex: Math.floor(Math.random() * OPEN_STRING_NOTES.length),
		fret: Math.floor(Math.random() * (FRET_COUNT + 1)),
	};
}
